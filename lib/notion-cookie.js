const crypto = require('crypto');

const COOKIE_NAME = 'notion_oauth';
const STATE_COOKIE = 'notion_oauth_state';

function getSecret() {
  const secret = process.env.COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('Missing COOKIE_SECRET env var.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const key = getSecret();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decrypt(token) {
  const raw = Buffer.from(token, 'base64url');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = getSecret();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return JSON.parse(plaintext);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const idx = part.indexOf('=');
      return [decodeURIComponent(part.slice(0, idx)), decodeURIComponent(part.slice(idx + 1))];
    })
  );
}

function cookieBase({ maxAge, httpOnly = true }) {
  const secure = process.env.NODE_ENV !== 'development';
  return [
    'Path=/',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    httpOnly ? 'HttpOnly' : '',
    typeof maxAge === 'number' ? `Max-Age=${maxAge}` : ''
  ].filter(Boolean).join('; ');
}

function setAuthCookie(res, payload) {
  const value = encrypt(payload);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; ${cookieBase({ maxAge: 60 * 60 * 24 * 30 })}`);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${cookieBase({ maxAge: 0 })}`);
}

function getAuthCookie(req) {
  const cookies = parseCookies(req);
  if (!cookies[COOKIE_NAME]) return null;
  try {
    return decrypt(cookies[COOKIE_NAME]);
  } catch (error) {
    return null;
  }
}

function setStateCookie(res, state) {
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=${encodeURIComponent(state)}; ${cookieBase({ maxAge: 60 * 10 })}`);
}

function getStateCookie(req) {
  const cookies = parseCookies(req);
  return cookies[STATE_COOKIE] || null;
}

function clearStateCookie(res) {
  const existing = res.getHeader('Set-Cookie');
  const clearState = `${STATE_COOKIE}=; ${cookieBase({ maxAge: 0, httpOnly: true })}`;
  if (!existing) {
    res.setHeader('Set-Cookie', clearState);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, clearState]);
  } else {
    res.setHeader('Set-Cookie', [existing, clearState]);
  }
}

module.exports = {
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  setStateCookie,
  getStateCookie,
  clearStateCookie
};
