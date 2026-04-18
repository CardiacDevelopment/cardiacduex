const NOTION_VERSION = '2026-03-11';

function getHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  };
}

async function notionFetch(path, accessToken, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      ...getHeaders(accessToken),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function propsFromConfig(config) {
  return {
    title: config.titleProp || 'Task',
    status: config.statusProp || 'Status',
    dueDate: config.dueProp || 'Due Date',
    category: config.categoryProp || 'Category'
  };
}

function mapPage(page, config) {
  const props = page.properties || {};
  const names = propsFromConfig(config);
  return {
    notionId: page.id,
    text: props[names.title]?.title?.[0]?.plain_text || '',
    completed: (props[names.status]?.status?.name || '').toLowerCase() === 'done',
    dueDate: props[names.dueDate]?.date?.start || null,
    category: props[names.category]?.select?.name || 'Brain Dump',
    categoryColor: props[names.category]?.select?.color || 'default'
  };
}

function buildProps(task, config) {
  const names = propsFromConfig(config);
  return {
    [names.title]: {
      title: [{ text: { content: task.text || '' } }]
    },
    [names.status]: {
      status: { name: task.completed ? 'Done' : (task.status || 'Not started') }
    },
    [names.category]: {
      select: { name: task.category || 'Brain Dump' }
    },
    [names.dueDate]: task.dueDate
      ? { date: { start: task.dueDate } }
      : { date: null }
  };
}

async function querySource(sourceId, config, accessToken) {
  const ds = await notionFetch(`/data_sources/${sourceId}/query`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ page_size: 100 })
  });
  if (ds.response.ok) return ds;

  const db = await notionFetch(`/databases/${sourceId}/query`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ page_size: 100 })
  });
  return db;
}

module.exports = { notionFetch, mapPage, buildProps, querySource };
