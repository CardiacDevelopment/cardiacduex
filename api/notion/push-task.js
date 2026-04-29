const { getConfig, notionFetch, taskToProperties, pageToTask, applyCors } = require('../_lib/notion');

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { token, databaseId } = getConfig();
    // Vercel auto-parses JSON bodies, but fall back to manual parse if a string slips through.
    let task = req.body || {};
    if (typeof task === 'string') {
      try { task = JSON.parse(task); } catch { task = {}; }
    }

    if (!task.text || !String(task.text).trim()) {
      res.status(400).json({ error: 'task.text is required' });
      return;
    }

    const properties = taskToProperties(task);
    let page;

    if (task.notionId) {
      // Update existing page.
      page = await notionFetch(`/pages/${task.notionId}`, {
        token,
        method: 'PATCH',
        body: { properties },
      });
    } else {
      // Create new page in the database.
      page = await notionFetch('/pages', {
        token,
        method: 'POST',
        body: {
          parent: { database_id: databaseId },
          properties,
        },
      });
    }

    res.status(200).json({ task: pageToTask(page) });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
      notion: err.notion,
    });
  }
};
