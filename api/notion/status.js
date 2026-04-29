const { getConfig, notionFetch, applyCors } = require('../_lib/notion');

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const { token, databaseId } = getConfig();
    // Cheapest call that confirms both auth and DB access.
    const db = await notionFetch(`/databases/${databaseId}`, { token });
    res.status(200).json({
      connected: true,
      databaseId,
      databaseTitle: (db.title || []).map(t => t.plain_text).join('') || 'Untitled',
    });
  } catch (err) {
    res.status(200).json({
      connected: false,
      error: err.message,
      status: err.status || 500,
    });
  }
};
