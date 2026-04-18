const { setStateCookie } = require('../../lib/notion-cookie');

module.exports = async function handler(req, res) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) {
    return res.status(500).json({ error: 'Missing NOTION_CLIENT_ID or APP_URL.' });
  }

  const state = String(req.query.state || '');
  if (!state) return res.status(400).json({ error: 'Missing state.' });

  setStateCookie(res, state);

  const redirectUri = `${appUrl}/api/notion/oauth/callback`;
  const url = new URL('https://api.notion.com/v1/oauth/authorize');
  url.searchParams.set('owner', 'user');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  return res.status(200).json({ url: url.toString() });
};
