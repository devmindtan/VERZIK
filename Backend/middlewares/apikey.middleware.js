const bcrypt = require('bcryptjs');
const { ethers } = require('ethers');
const ApiClient = require('../models/ApiClient.model');

/**
 * Middleware xác thực 3 lớp cho upload API:
 * Layer 1: client_id + client_secret
 * Layer 2: wallet address in whitelist
 * Layer 3: ECDSA signature verification
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    // ─── Layer 1: API Credentials ───
    const clientId = req.headers['x-client-id'];
    const clientSecret = req.headers['x-client-secret'];

    if (!clientId || !clientSecret) {
      return res.status(401).json({ error: 'Missing API credentials (X-Client-Id, X-Client-Secret)' });
    }

    const apiClient = await ApiClient.findOne({ client_id: clientId, is_active: true });
    if (!apiClient) {
      return res.status(401).json({ error: 'Invalid or inactive API client' });
    }

    const secretMatch = await bcrypt.compare(clientSecret, apiClient.client_secret_hash);
    if (!secretMatch) {
      return res.status(401).json({ error: 'Invalid API secret' });
    }

    if (!apiClient.permissions.includes('upload')) {
      return res.status(403).json({ error: 'API client does not have upload permission' });
    }

    // ─── Layer 2: Wallet Whitelist ───
    const walletAddress = req.headers['x-wallet-address'];
    if (!walletAddress) {
      return res.status(401).json({ error: 'Missing wallet address (X-Wallet-Address)' });
    }

    const normalizedWallet = walletAddress.toLowerCase();
    const whitelist = apiClient.whitelisted_wallets.map(w => w.toLowerCase());

    if (!whitelist.includes(normalizedWallet)) {
      return res.status(403).json({ error: 'Wallet not in whitelist' });
    }

    // ─── Layer 3: Signature Verification ───
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing signature or timestamp (X-Signature, X-Timestamp)' });
    }

    // Timestamp window: 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(now - ts) > 300) {
      return res.status(401).json({ error: 'Timestamp expired or invalid (5 minute window)' });
    }

    // Message = "VERZIK_UPLOAD:{client_id}:{timestamp}"
    const message = `VERZIK_UPLOAD:${clientId}:${timestamp}`;
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      return res.status(401).json({ error: 'Invalid signature format' });
    }

    if (recoveredAddress.toLowerCase() !== normalizedWallet) {
      return res.status(401).json({
        error: 'Signature does not match wallet address',
        expected: normalizedWallet,
        recovered: recoveredAddress.toLowerCase(),
      });
    }

    // ─── Auth passed — attach context ───
    req.apiClient = apiClient;
    req.walletAddress = normalizedWallet;

    // Update last_used_at
    apiClient.last_used_at = new Date();
    await apiClient.save();

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { apiKeyAuth };
