const { getAuthCookie } = require('../../lib/notion-cookie');
const { querySource, mapPage, buildProps, notionFetch } = require('../../lib/notion-api');

module.exports = async function handler(req, res) {
  const auth = getAuthCookie(req);
  if (!auth?.access_token) return res.status(401).json({ error: 'Not connected to Notion.' });

  if (req.method === 'GET') {
    const config = {
      sourceId: req.query.sourceId,
      titleProp: req.query.titleProp,
      statusProp: req.query.statusProp,
      dueProp: req.query.dueProp,
      categoryProp: req.query.categoryProp
    };
    if (!config.sourceId) return res.status(400).json({ error: 'Missing sourceId.' });

    const { response, data } = await querySource(config.sourceId, config, auth.access_token);
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to query Notion.' });
    }

    return res.status(200).json((data.results || []).filter(p => !p.in_trash).map(p => mapPage(p, config)));
  }

  if (req.method === 'POST') {
    const { config, task } = req.body || {};
    if (!config?.sourceId) return res.status(400).json({ error: 'Missing sourceId.' });

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Notion-Version': '2026-03-11',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: {
          type: 'data_source_id',
          data_source_id: config.sourceId
        },
        properties: buildProps(task || {}, config)
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to create task.' });
    }

    return res.status(200).json({ notionId: data.id, task: mapPage(data, config) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
