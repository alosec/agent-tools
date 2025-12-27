# Supabase Tools

Use Supabase CLI or API directly. No wrapper scripts needed.

## Credentials

```bash
# Management API (for schema inspection, pg_policies, etc.)
SB_ACCESS="sbp_145678bddddfdef4184f7350056254f75bec161b"

# Fat-agents project
SB_REF="imtvwbmqiqygxtpdbaxz"
source ~/.config/supabase/fat-agents.env  # SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
```

## Direct API

```bash
# REST API (data operations)
curl -s "https://$SB_REF.supabase.co/rest/v1/TABLE?select=*" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

# Management API (schema, policies, raw SQL)
curl -s "https://api.supabase.com/v1/projects/$SB_REF/database/query" \
  -H "Authorization: Bearer $SB_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM pg_policies"}'
```

## Supabase CLI

```bash
supabase login
supabase db dump --project-ref $SB_REF
supabase functions deploy --project-ref $SB_REF
```
