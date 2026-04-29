const { getConfig, notionFetch, applyCors } = require('../_lib/notion');

// Archives (soft-deletes) a Notion page by id.
// Notion does not expose a hard-delete endpoint via the public API; archiving
// is the official way to remove a task and is reversible from Notion's UI.
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { token } = getConfig();

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const notionId = body.notionId;
    if (!notionId || !String(notionId).trim()) {
      res.status(400).json({ error: 'notionId is required' });
      return;
    }

    const page = await notionFetch(`/pages/${notionId}`, {
      token,
      method: 'PATCH',
      body: { archived: true },
    });

    res.status(200).json({ archived: true, id: page.id });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
      notion: err.notion,
    });
  }
};
