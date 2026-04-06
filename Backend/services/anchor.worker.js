/**
 * Anchor Worker (deprecated)
 *
 * Hệ thống hiện dùng flow "ký sau" qua API /api/v1/anchor.
 * Không chạy background worker để tự anchor.
 */

const logDisabled = () => {
  console.log('⏸️  Anchor Worker is disabled. Use POST /api/v1/anchor for lazy minting flow.');
};

const start = () => {
  logDisabled();
};

const stop = () => {};

const triggerNow = () => {
  logDisabled();
};

const pollOnce = async () => {
  logDisabled();
};

module.exports = { start, stop, triggerNow, pollOnce };
