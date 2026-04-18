const { getAuthCookie } = require('../../lib/notion-cookie');

module.exports = async function handler(req, res) {
  const auth = getAuthCookie(req);
  if (!auth?.access_token) {
    return res.status(200).json({ connected: false });
  }
  return res.status(200).json({
    connected: true,
    workspace_name: auth.workspace_name || null,
    workspace_id: auth.workspace_id || null
  });
};
