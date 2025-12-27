import puppeteer from "puppeteer-core";

const b = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const pages = await b.pages();
const page = pages[0];

// Enable console capture
page.on('console', msg => {
  console.log(`[console.${msg.type()}] ${msg.text()}`);
});

page.on('pageerror', err => {
  console.log(`[PAGE ERROR] ${err.message}`);
});

// Reload to capture fresh logs
await page.reload({ waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log('reload timeout'));

// Wait a bit for any async errors
await new Promise(r => setTimeout(r, 3000));

await b.disconnect();
