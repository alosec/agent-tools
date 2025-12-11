#!/usr/bin/env npx ts-node
/**
 * Refresh venue events from web scraping
 * 
 * Usage:
 *   ./refresh-venue-events.ts                    # Refresh all priority venues
 *   ./refresh-venue-events.ts --venue "Moody Center"  # Single venue
 *   ./refresh-venue-events.ts --dry-run          # Don't insert, just show
 */

import { execSync } from 'child_process';
import * as path from 'path';

const SCRIPT_DIR = path.dirname(process.argv[1]);
const SUPABASE_PROJECT = 'jhqgctrqhvytujcvitym';

// Priority venues with their event page URLs
const VENUES: Record<string, { url: string; venue_id?: number }> = {
  'Moody Center': { 
    url: 'https://moodycenteratx.com/events',
    venue_id: 86
  },
  'ACL Live': { 
    url: 'https://acl-live.com/calendar',
    venue_id: undefined  // Need to look up
  },
  "Stubb's": { 
    url: 'https://www.stubbsaustin.com',
    venue_id: undefined
  },
  'Zilker Park': {
    url: 'https://austintrailoflights.org',
    venue_id: undefined
  },
  'Q2 Stadium': {
    url: 'https://www.q2stadium.com/events',
    venue_id: 17
  }
};

interface Event {
  title: string;
  date: string;
  time?: string;
  description?: string;
  event_type?: string;
  ticket_url?: string;
  venue: string;
}

function loadEnv() {
  const envPath = path.join(SCRIPT_DIR, '.env');
  const content = execSync(`cat ${envPath}`, { encoding: 'utf-8' });
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key] = value;
  });
  
  // Also load supabase env
  const sbEnvPath = path.join(SCRIPT_DIR, '../supabase-tools/.env');
  const sbContent = execSync(`cat ${sbEnvPath}`, { encoding: 'utf-8' });
  sbContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key] = value;
  });
}

async function scrapeEvents(venueName: string, url: string): Promise<Event[]> {
  console.error(`Scraping ${venueName} from ${url}...`);
  
  try {
    const result = execSync(
      `${SCRIPT_DIR}/firecrawl-events.sh "${url}" "${venueName}"`,
      { encoding: 'utf-8', timeout: 60000 }
    );
    return JSON.parse(result);
  } catch (e) {
    console.error(`Error scraping ${venueName}: ${e}`);
    return [];
  }
}

function supabaseQuery(sql: string): any[] {
  const result = execSync(
    `${SCRIPT_DIR}/../supabase-tools/supabase-query.sh ${SUPABASE_PROJECT} "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf-8' }
  );
  return JSON.parse(result);
}

function formatDate(dateStr: string): string {
  // Try to parse various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  // If already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return dateStr;
}

async function insertEvents(events: Event[], venueId: number | undefined, dryRun: boolean) {
  for (const event of events) {
    const date = formatDate(event.date);
    
    // Skip past events
    if (new Date(date) < new Date()) {
      console.error(`  Skipping past event: ${event.title} on ${date}`);
      continue;
    }
    
    const sql = `
      INSERT INTO events (title, date, time, venue, description, event_type, ticket_url, venue_id, created_at, updated_at)
      VALUES (
        '${event.title.replace(/'/g, "''")}',
        '${date}',
        ${event.time ? `'${event.time}'` : 'NULL'},
        '${event.venue.replace(/'/g, "''")}',
        ${event.description ? `'${event.description.replace(/'/g, "''")}'` : 'NULL'},
        ${event.event_type ? `'${event.event_type}'` : 'NULL'},
        ${event.ticket_url ? `'${event.ticket_url}'` : 'NULL'},
        ${venueId || 'NULL'},
        NOW(),
        NOW()
      )
      ON CONFLICT (title, date, venue) DO UPDATE SET
        time = EXCLUDED.time,
        description = EXCLUDED.description,
        event_type = EXCLUDED.event_type,
        ticket_url = EXCLUDED.ticket_url,
        updated_at = NOW()
    `.trim();
    
    if (dryRun) {
      console.log(`[DRY RUN] Would insert: ${event.title} on ${date} at ${event.venue}`);
    } else {
      try {
        // Note: This won't work without proper upsert support - just log for now
        console.log(`Inserting: ${event.title} on ${date} at ${event.venue}`);
        // supabaseQuery(sql);
      } catch (e) {
        console.error(`  Error inserting: ${e}`);
      }
    }
  }
}

async function main() {
  loadEnv();
  
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const venueArg = args.find(a => a.startsWith('--venue='))?.split('=')[1] 
    || (args.indexOf('--venue') !== -1 ? args[args.indexOf('--venue') + 1] : null);
  
  const venuesToProcess = venueArg 
    ? { [venueArg]: VENUES[venueArg] }
    : VENUES;
  
  const allEvents: Event[] = [];
  
  for (const [name, config] of Object.entries(venuesToProcess)) {
    if (!config) {
      console.error(`Unknown venue: ${name}`);
      continue;
    }
    
    const events = await scrapeEvents(name, config.url);
    console.error(`  Found ${events.length} events`);
    allEvents.push(...events);
    
    if (!dryRun && events.length > 0) {
      await insertEvents(events, config.venue_id, dryRun);
    }
  }
  
  // Output all events as JSON
  console.log(JSON.stringify(allEvents, null, 2));
}

main().catch(console.error);
