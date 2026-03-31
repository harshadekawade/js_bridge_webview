'use strict';

(() => {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const logList     = document.getElementById('logList');
  const dot         = document.getElementById('bridgeDot');
  const statusText  = document.getElementById('statusText');
  const badge       = document.getElementById('pendingBadge');
  const autoPingBar = document.getElementById('autoPingBar');
  const autoPingTxt = document.getElementById('autoPingText');

  // ── Timestamp helper ──────────────────────────────────────────────────────
  function ts() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `[${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}]`;
  }

  // ── Logger ────────────────────────────────────────────────────────────────
  function log(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    el.textContent = `${ts()} ${msg}`;
    logList.appendChild(el);
    logList.scrollTop = logList.scrollHeight;
    refreshBadge();
  }

  function clearLogs() {
    logList.innerHTML = '';
    log('Log cleared.');
  }

  // ── Status bar ────────────────────────────────────────────────────────────
  function updateStatus() {
    const ready = typeof window.sendToNative === 'function' &&
                  typeof window.isSecureBridgeAvailable === 'function' &&
                  window.isSecureBridgeAvailable();

    if (ready) {
      dot.className          = 'dot ready';
      statusText.textContent = 'Bridge re-injected · AES-256-CBC + HMAC-SHA256 active';
    } else if (typeof window.sendToNative === 'function') {
      dot.className          = 'dot partial';
      statusText.textContent = 'Bridge script loaded · Awaiting native channel…';
    } else {
      dot.className          = 'dot';
      statusText.textContent = 'Bridge not yet injected — waiting for native…';
    }
  }

  // ── Pending badge ─────────────────────────────────────────────────────────
  function refreshBadge() {
    const n = typeof window.secureBridgePendingCount === 'function'
      ? window.secureBridgePendingCount()
      : 0;

    if (n > 0) {
      badge.style.display = 'inline';
      badge.textContent   = `${n} pending`;
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────
  function bridgeReady() {
    if (typeof window.sendToNative !== 'function') {
      log('✗ Bridge not ready — injection pending.', 'error');
      return false;
    }
    return true;
  }

  // ── Auto-ping on bridge ready ─────────────────────────────────────────────
  // Fires automatically when native injects the bridge script on this page,
  // confirming re-injection worked after navigation from Page 1.
  window.addEventListener('secureBridge:ready', async () => {
    log('🔐 Bridge re-injected on Page 2 (AES-256-CBC + HMAC-SHA256)', 'success');
    updateStatus();

    log('→ AUTO-PING from Page 2 [encrypted]', 'send');
    try {
      const res = await window.sendToNative('PING', { page: 2, ts: Date.now() });
      log(`← Auto-ping response: ${JSON.stringify(res)}`, 'success');

      autoPingBar.style.display = 'flex';
      autoPingBar.style.background = 'rgba(74,222,128,.08)';
      autoPingBar.style.borderColor = 'rgba(74,222,128,.3)';
      autoPingTxt.textContent = '✓ Bridge confirmed working on Page 2';
      autoPingTxt.style.color = '#4ade80';
    } catch (e) {
      log(`✗ Auto-ping failed: ${e.message}`, 'error');

      autoPingBar.style.display = 'flex';
      autoPingBar.style.background = 'rgba(248,113,113,.08)';
      autoPingBar.style.borderColor = 'rgba(248,113,113,.3)';
      autoPingTxt.textContent = `✗ Auto-ping failed: ${e.message}`;
      autoPingTxt.style.color = '#f87171';
    }
    refreshBadge();
  });

  // ── Button handlers ───────────────────────────────────────────────────────
  async function doPing() {
    if (!bridgeReady()) return;
    log('→ PING from Page 2 [encrypted]', 'send');
    try {
      const res = await window.sendToNative('PING', { page: 2, ts: Date.now() });
      log(`← ${JSON.stringify(res)}`, 'success');
    } catch (e) {
      log(`✗ ${e.message}`, 'error');
    }
    refreshBadge();
  }

  async function doGetProfile() {
    if (!bridgeReady()) return;
    log('→ GET_USER_PROFILE from Page 2 [encrypted]', 'send');
    try {
      const res = await window.sendToNative('GET_USER_PROFILE');
      log(`← ${JSON.stringify(res)}`, 'success');
    } catch (e) {
      log(`✗ ${e.message}`, 'error');
    }
    refreshBadge();
  }

  async function doGetDeviceInfo() {
    if (!bridgeReady()) return;
    log('→ GET_DEVICE_INFO from Page 2 [encrypted]', 'send');
    try {
      const res = await window.sendToNative('GET_DEVICE_INFO');
      log(`← ${JSON.stringify(res)}`, 'success');
    } catch (e) {
      log(`✗ ${e.message}`, 'error');
    }
    refreshBadge();
  }

  async function doSavePref() {
    if (!bridgeReady()) return;
    log('→ SAVE_PREFERENCE {key: page2_visited, value: true} [encrypted]', 'send');
    try {
      const res = await window.sendToNative('SAVE_PREFERENCE', {
        key: 'page2_visited',
        value: true,
      });
      log(`← ${JSON.stringify(res)}`, 'success');
    } catch (e) {
      log(`✗ ${e.message}`, 'error');
    }
    refreshBadge();
  }

  // ── Expose handlers for inline onclick ────────────────────────────────────
  Object.assign(window, {
    clearLogs,
    doPing,
    doGetProfile,
    doGetDeviceInfo,
    doSavePref,
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  updateStatus();
  setTimeout(updateStatus, 1500);
})();
