# firecrawl-tools

CLI tools for [Firecrawl](https://firecrawl.dev/) web scraping API.

## Setup

1. Get API key from https://firecrawl.dev/
2. Create `.env`:
   ```
   FIRECRAWL_API_KEY=fc-your-key-here
   ```

## Scripts

### firecrawl-scrape.sh

Scrape a URL and return markdown content.

```bash
./firecrawl-scrape.sh https://example.com/article
```

### firecrawl-search.sh

Search the web using Firecrawl.

```bash
# Basic search
./firecrawl-search.sh "best pizza austin"

# With custom limit (default 5)
./firecrawl-search.sh "climate change effects" 10
```

Returns title, url, and description for each result.

### firecrawl-extract.sh

Extract structured data from a URL using a JSON schema.

```bash
# With schema file
./firecrawl-extract.sh "https://example.com/events" ./events-schema.json

# With inline schema
./firecrawl-extract.sh "https://example.com/product" '{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}'
```

Example schema file (`events-schema.json`):
```json
{
  "type": "object",
  "properties": {
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "date": { "type": "string" },
          "venue": { "type": "string" }
        }
      }
    }
  }
}
```
