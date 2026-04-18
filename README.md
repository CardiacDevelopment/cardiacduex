# Cardiac Core + Notion OAuth (Vercel)

## Add these files
- Replace your root `index.html` with the provided OAuth version.
- Add the `api/` and `lib/` folders.
- Add `vercel.json`, `.env.example`, and `package.json`.

## Vercel env vars
- `APP_URL`
- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `COOKIE_SECRET`

## Notion setup
Create a **public integration** in the Notion Creator dashboard and add this redirect URI:

`https://your-app.vercel.app/api/notion/oauth/callback`

## Notes
This version stores each user's Notion access token in an encrypted HTTP-only cookie after the OAuth flow. The database/data source ID and property names stay in that user's browser.
