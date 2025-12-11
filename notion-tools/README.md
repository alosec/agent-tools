# Notion Tools

Simple bash scripts for Notion API. Uses jq to filter aggressively - Notion API returns way too much data.

## Setup

```bash
# .env (gitignored)
NOTION_API_KEY=ntn_xxx
```

## Scripts

### notion-search.sh
Search accessible pages/databases.

```bash
./notion-search.sh                    # List all accessible
./notion-search.sh "query"            # Search by title
```

### notion-page.sh
Fetch page content as markdown-ish text.

```bash
./notion-page.sh <page-id>
```

## Notes

- **Integration must be shared with pages** - Notion API only sees pages explicitly shared with your integration
- To share: Open page → Share → Invite → search your integration name
- Page IDs: grab from URL (the 32-char hex after the title slug)

## Accessible Content (Dec 2025)

Personal workspace + Ideaflow Engineering Wiki.

**NOT accessible yet:** Jacob's vision docs (need to be shared with integration)
- Ideaflow Master Plan and Vision 2025: `1a824612a17f80dc8d2bf80a3eaa908a`
