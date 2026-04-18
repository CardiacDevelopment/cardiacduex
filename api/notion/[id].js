const { getAuthCookie } = require('../../lib/notion-cookie');
const { buildProps } = require('../../lib/notion-api');

module.exports = async function handler(req, res) {
  const auth = getAuthCookie(req);
  if (!auth?.access_token) return res.status(401).json({ error: 'Not connected to Notion.' });

  const pageId = req.query.id;
  if (!pageId) return res.status(400).json({ error: 'Missing page ID.' });

  if (req.method === 'PATCH') {
    const { config, task } = req.body || {};
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Notion-Version': '2026-03-11',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: buildProps(task || {}, config || {})
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to update task.' });
    }
    return res.status(200).json({ ok: true, notionId: data.id });
  }

  if (req.method === 'DELETE') {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Notion-Version': '2026-03-11',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ in_trash: true })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to archive task.' });
    }
    return res.status(200).json({ ok: true, notionId: data.id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
