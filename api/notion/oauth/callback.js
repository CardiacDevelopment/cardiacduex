const { setAuthCookie, getStateCookie, clearStateCookie } = require('../../../lib/notion-cookie');

module.exports = async function handler(req, res) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return res.status(500).send('Missing OAuth environment variables.');
  }

  const { code, state, error } = req.query;
  const redirectUri = `${appUrl}/api/notion/oauth/callback`;

  if (error) {
    return res.redirect(`${appUrl}/?error=${encodeURIComponent(error)}`);
  }

  const expectedState = getStateCookie(req);
  if (!code || !state || !expectedState || state !== expectedState) {
    clearStateCookie(res);
    return res.redirect(`${appUrl}/?error=${encodeURIComponent('invalid_state')}`);
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Notion-Version': '2026-03-11',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.access_token) {
      clearStateCookie(res);
      return res.redirect(`${appUrl}/?error=${encodeURIComponent(data.message || 'oauth_exchange_failed')}`);
    }

    setAuthCookie(res, {
      access_token: data.access_token,
      workspace_id: data.workspace_id || null,
      workspace_name: data.workspace_name || null,
      owner: data.owner || null
    });
    clearStateCookie(res);

    return res.redirect(`${appUrl}/?notion_connected=1`);
  } catch (err) {
    clearStateCookie(res);
    return res.redirect(`${appUrl}/?error=${encodeURIComponent(err.message || 'oauth_callback_failed')}`);
  }
};
