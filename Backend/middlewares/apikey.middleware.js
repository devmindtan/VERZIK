const ApiClient = require('../models/ApiClient.model');

const normalizeDomain = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  // Khi nhận origin/referer dạng URL
  try {
    const withScheme = trimmed.includes('://') ? trimmed : `http://${trimmed}`;
    const url = new URL(withScheme);
    return url.hostname.toLowerCase();
  } catch {
    // Fallback: host/domain raw
    const raw = trimmed.split('/')[0];
    return raw.split(':')[0].toLowerCase();
  }
};

const resolveRequestDomain = (req) => {
  const candidates = [
    req.headers['x-client-domain'],
    req.headers.origin,
    req.headers.referer,
  ];

  for (const candidate of candidates) {
    const domain = normalizeDomain(candidate);
    if (domain) return domain;
  }

  return null;
};

const domainMatchesWhitelist = (domain, whitelist) => {
  if (!domain || !Array.isArray(whitelist)) return false;

  return whitelist.some((entry) => {
    const normalized = normalizeDomain(entry);
    if (!normalized) return false;

    // Hỗ trợ wildcard *.example.com
    if (normalized.startsWith('*.')) {
      const suffix = normalized.slice(2);
      return domain === suffix || domain.endsWith(`.${suffix}`);
    }

    return domain === normalized;
  });
};

/**
 * Middleware auth cho upload API:
 * - Chỉ cần X-Client-Id hợp lệ
 * - Domain gọi API phải nằm trong whitelist của API client
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const clientId = req.headers['x-client-id'];
    if (!clientId) {
      return res.status(401).json({ error: 'Missing X-Client-Id header' });
    }

    const apiClient = await ApiClient.findOne({ client_id: clientId, is_active: true });
    if (!apiClient) {
      return res.status(401).json({ error: 'Invalid or inactive API client' });
    }

    if (!apiClient.permissions.includes('upload')) {
      return res.status(403).json({ error: 'API client does not have upload permission' });
    }

    const requestDomain = resolveRequestDomain(req);
    if (!requestDomain) {
      return res.status(401).json({
        error: 'Missing caller domain (send X-Client-Domain or Origin header)',
      });
    }

    const whitelistDomains = (apiClient.whitelisted_domains || []).map(normalizeDomain).filter(Boolean);
    if (whitelistDomains.length === 0) {
      return res.status(403).json({ error: 'API client has no whitelisted domains configured' });
    }

    if (!domainMatchesWhitelist(requestDomain, whitelistDomains)) {
      return res.status(403).json({
        error: 'Domain not in whitelist',
        domain: requestDomain,
      });
    }

    // Attach context.
    req.apiClient = apiClient;
    // Dùng wallet header nếu có; fallback theo client_id để tracking issuer ổn định.
    req.walletAddress = (req.headers['x-wallet-address'] || `client:${clientId}`).toLowerCase();

    apiClient.last_used_at = new Date();
    await apiClient.save();

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { apiKeyAuth };
