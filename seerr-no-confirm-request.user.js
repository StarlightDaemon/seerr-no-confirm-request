// ==UserScript==
// @name         Seerr No-Confirm Request
// @namespace    skynet.homelab
// @version      0.2.1
// @description  One-click movie and series requests from Seerr poster cards. Shift+Click opens the native dialog.
// @match        http://192.168.1.229:5055/*
// @grant        none
// @inject-into  page
// @run-at       document-start
// @noframes
// @homepageURL  https://github.com/StarlightDaemon/seerr-no-confirm-request
// @supportURL   https://github.com/StarlightDaemon/seerr-no-confirm-request/issues
// @updateURL    https://github.com/StarlightDaemon/seerr-no-confirm-request/releases/latest/download/seerr-no-confirm-request.user.js
// @downloadURL  https://github.com/StarlightDaemon/seerr-no-confirm-request/releases/latest/download/seerr-no-confirm-request.user.js
// ==/UserScript==

/*
 * Target: Seerr 3.5.x (TitleCard / POST /api/v1/request verified against upstream v3.5.2 source).
 *
 * How it works:
 *  - On page load, one GET /api/v1/status. Outside the tested version range the script stands down
 *    (native behaviour) and says so once per browser session.
 *  - A capture-phase click listener on window sees clicks before React. It acts only on the Request
 *    button inside a poster card:
 *      [data-testid="title-card"] ... <a href="/movie|tv/{tmdbId}"> + <div><button>Request</button></div>
 *    Anything else (collections, other buttons, unknown structure, modifier keys) is left to Seerr.
 *  - Movies: POST {mediaType:'movie', mediaId, is4k:false}.
 *  - Series: GET /api/v1/tv/{id} to count aired seasons (excluding specials). Up to tv.maxSeasons:
 *    POST {mediaType:'tv', mediaId, seasons:'all', is4k:false}. Above it, or if the lookup fails,
 *    the native season dialog opens instead.
 *  - Seerr resolves default Radarr/Sonarr, profiles, folders, tags and override rules server-side,
 *    and enforces permissions, quotas, approval and duplicates.
 *  - Card state is shown with per-title CSS rules, so React re-renders never fight the script.
 *
 * Disable or remove in Violentmonkey and reload to restore native behaviour.
 */
(() => {
  'use strict';

  // ---- Configuration -------------------------------------------------------
  const CONFIG = {
    origin: 'http://192.168.1.229:5055',
    testedVersion: /^3\.5\.\d+$/, // stand down on anything else
    tv: {
      enabled: true,
      maxSeasons: 5, // series with more aired seasons open the native dialog
    },
    debug: false, // true → console.debug diagnostics (never logs cookies or headers)
    toastMs: 5000,
    errorToastMs: 9000,
  };

  // ---- Constants tied to Seerr 3.5.x ---------------------------------------
  const CARD_SELECTOR = '[data-testid="title-card"]';
  const MEDIA_HREF = /^\/(movie|tv)\/(\d+)$/;
  const REQUEST_STATUS = { PENDING: 1, APPROVED: 2 };

  if (location.origin !== CONFIG.origin) return;

  const log = (...args) => {
    if (CONFIG.debug) console.debug('[SeerrNoConfirmRequest]', ...args);
  };

  // 'pending' until the version check answers; clicks stay native unless 'ok'.
  let guard = 'pending';

  // `${type}:${id}` → 'busy' | 'approved' | 'pending' | 'exists'
  const state = new Map();

  // Buttons we re-click to open the native dialog; the next click on them is passed through.
  const nativePass = new WeakSet();

  // ---- Version guard -------------------------------------------------------
  function standDown(reason) {
    guard = 'off';
    log('standing down:', reason);
    const key = 'seerr-quick-request:paused-notice';
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage unavailable: show the notice anyway */
    }
    whenBodyReady(() =>
      toast(`Seerr No-Confirm Request paused: ${reason}. Native requests work as normal.`, 'info')
    );
  }

  fetch('/api/v1/status', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((body) => {
      const v = body && body.version;
      if (typeof v === 'string' && CONFIG.testedVersion.test(v)) {
        guard = 'ok';
        log('active on Seerr', v);
      } else {
        standDown(`Seerr ${typeof v === 'string' ? v : '(unknown version)'} hasn't been tested`);
      }
    })
    .catch((err) => standDown(`couldn't verify the Seerr version (${err && err.message})`));

  // ---- Target detection ----------------------------------------------------
  /**
   * Returns {type, id, title, button} when the click is on a poster card's Request button,
   * otherwise null (and the click goes to Seerr untouched).
   */
  function resolveTarget(event) {
    const target = event.target;
    if (!(target instanceof Element)) return null;

    const button = target.closest('button');
    if (!button) return null;

    const card = button.closest(CARD_SELECTOR);
    if (!card) return null;

    const container = button.parentElement;
    const anchor = container && container.previousElementSibling;
    if (!anchor || anchor.tagName !== 'A' || !card.contains(anchor)) return null;
    if (container.querySelectorAll('button').length !== 1) return null;

    const match = MEDIA_HREF.exec(anchor.getAttribute('href') || '');
    if (!match) return null; // collection or unexpected link

    const type = match[1];
    const id = Number(match[2]);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    if (type === 'tv' && !CONFIG.tv.enabled) return null;

    const titleEl = card.querySelector('[data-testid="title-card-title"]');
    const title = (titleEl && titleEl.textContent.trim()) || `TMDB ${id}`;
    return { type, id, title, button };
  }

  const keyOf = (type, id) => `${type}:${id}`;
  const buttonSelector = (type, id) => `${CARD_SELECTOR} a[href="/${type}/${id}"] + div > button`;

  // ---- Click interception --------------------------------------------------
  function onClick(event) {
    if (event.button !== 0) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return; // native dialog
    if (guard !== 'ok') return;

    const hit = resolveTarget(event);
    if (!hit) return;

    if (nativePass.has(hit.button)) {
      nativePass.delete(hit.button);
      return; // our own re-click: let React open the dialog
    }

    // From here on the click is ours: React must not open the dialog.
    event.preventDefault();
    event.stopImmediatePropagation();

    const current = state.get(keyOf(hit.type, hit.id));
    if (current === 'busy') {
      log('ignored repeat click while in flight', hit.type, hit.id);
      return;
    }
    if (current) {
      toast(`${hit.title} is already requested.`, 'info');
      return;
    }
    if (hit.type === 'tv') requestSeries(hit);
    else submit(hit, { mediaType: 'movie', mediaId: hit.id, is4k: false });
  }

  /** Open Seerr's own dialog for this title by re-clicking its (possibly re-rendered) button. */
  function openNative({ type, id, title, button }, why) {
    const live = button.isConnected ? button : document.querySelector(buttonSelector(type, id));
    if (!live) {
      toast(`${why} Open ${title} again and Shift+Click Request.`, 'info');
      return;
    }
    toast(why, 'info');
    nativePass.add(live);
    live.click();
  }

  // ---- Series --------------------------------------------------------------
  async function requestSeries(hit) {
    const key = keyOf('tv', hit.id);
    setState(key, 'busy');

    let seasons;
    try {
      const r = await fetch(`/api/v1/tv/${hit.id}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (r.status === 401) {
        clearState(key);
        toast('Your Seerr session has expired. Log in again, then retry.', 'error');
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = await r.json();
      if (!body || !Array.isArray(body.seasons)) throw new Error('no season list');
      // Same rule as the server's seasons:'all' — no specials, no empty (unaired) seasons.
      seasons = body.seasons.filter((s) => s.seasonNumber !== 0 && s.episodeCount > 0).length;
    } catch (err) {
      log('season lookup failed', hit.id, err && err.message);
      clearState(key);
      openNative(hit, `Couldn't check seasons for ${hit.title}; opening the request dialog.`);
      return;
    }

    log('aired seasons', hit.id, seasons);
    if (seasons === 0) {
      clearState(key);
      openNative(hit, `${hit.title} has no aired seasons yet; opening the request dialog.`);
      return;
    }
    if (seasons > CONFIG.tv.maxSeasons) {
      clearState(key);
      openNative(hit, `${hit.title} has ${seasons} seasons; choose them in the dialog.`);
      return;
    }
    submit(hit, { mediaType: 'tv', mediaId: hit.id, seasons: 'all', is4k: false }, seasons);
  }

  // ---- Submission ----------------------------------------------------------
  function readCookie(name) {
    const prefix = `${name}=`;
    for (const part of document.cookie.split(';')) {
      const c = part.trim();
      if (c.startsWith(prefix)) {
        try {
          return decodeURIComponent(c.slice(prefix.length));
        } catch {
          return c.slice(prefix.length);
        }
      }
    }
    return null;
  }

  async function readMessage(response) {
    try {
      const body = await response.json();
      if (body && typeof body.message === 'string') return body.message.slice(0, 200);
    } catch {
      /* non-JSON body */
    }
    return null;
  }

  async function submit({ type, id, title }, payload, seasonCount) {
    const key = keyOf(type, id);
    setState(key, 'busy');
    log('submitting', key);

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const xsrf = readCookie('XSRF-TOKEN'); // present only when CSRF protection is enabled
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

    let response;
    try {
      response = await fetch('/api/v1/request', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (err) {
      log('network error', key, err && err.name);
      clearState(key);
      toast(`Couldn't reach Seerr to request ${title}. Click again to retry.`, 'error');
      return;
    }

    log('response', key, response.status);
    const what =
      type === 'tv' ? `${title} (${seasonCount} season${seasonCount === 1 ? '' : 's'})` : title;

    if (response.status === 201) {
      let body = null;
      try {
        body = await response.json();
      } catch {
        /* handled below */
      }
      if (!body || typeof body.id !== 'number') {
        // Server said Created but the body isn't a request; don't claim success blindly.
        setState(key, 'pending');
        toast(`Seerr accepted ${title}, but the response was unexpected. Check Requests.`, 'info');
        return;
      }
      const approved = body.status === REQUEST_STATUS.APPROVED;
      setState(key, approved ? 'approved' : 'pending');
      toast(
        approved ? `${what} requested and approved.` : `${what} requested — pending approval.`,
        'success'
      );
      return;
    }

    const message = await readMessage(response);

    if (response.status === 202 && type === 'tv') {
      // Seerr: every season is already requested or available.
      setState(key, 'exists');
      toast(`${title}: all seasons are already requested or available.`, 'info');
      return;
    }

    switch (response.status) {
      case 409:
        setState(key, 'exists');
        toast(`${title} already has a request.`, 'info');
        return;
      case 401:
        clearState(key);
        toast('Your Seerr session has expired. Log in again, then retry.', 'error');
        return;
      case 403:
        clearState(key);
        toast(`Seerr refused ${title}: ${message || 'not permitted'}`, 'error');
        return;
      default:
        clearState(key);
        toast(
          `Request for ${title} failed (HTTP ${response.status}${message ? `: ${message}` : ''}). ` +
            'Click to retry or Shift+Click for the native dialog.',
          'error'
        );
    }
  }

  // ---- Card state via CSS --------------------------------------------------
  const LABELS = {
    busy: 'Requesting…',
    approved: 'Requested',
    pending: 'Pending approval',
    exists: 'Already requested',
  };
  let styleEl = null;

  function setState(key, value) {
    state.set(key, value);
    renderStyles();
  }

  function clearState(key) {
    state.delete(key);
    renderStyles();
  }

  function renderStyles() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'seerr-quick-request-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }
    let css = '';
    for (const [key, value] of state) {
      const [type, id] = key.split(':');
      const btn = buttonSelector(type, id);
      css +=
        `${btn}{cursor:${value === 'busy' ? 'progress' : 'default'}!important;` +
        `${value === 'busy' ? 'opacity:.7!important;' : 'filter:saturate(.25)!important;'}}` +
        `${btn} > *{display:none!important}` +
        `${btn}::after{content:"${LABELS[value]}"}\n`;
    }
    styleEl.textContent = css;
  }

  // ---- Toasts --------------------------------------------------------------
  // Identical messages collapse into one toast with a repeat count; at most MAX_TOASTS are shown.
  let toastHost = null;
  const TOAST_COLORS = { success: '#15803d', info: '#1d4ed8', error: '#b91c1c' };
  const MAX_TOASTS = 4;
  const liveToasts = new Map(); // key → {el, timer, count}

  function whenBodyReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  function toast(text, kind) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.id = 'seerr-quick-request-toasts';
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      toastHost.style.cssText =
        'position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;' +
        'flex-direction:column;gap:8px;max-width:min(380px,90vw);pointer-events:none';
      document.body.appendChild(toastHost);
    }
    const key = `${kind}|${text}`;
    const ms = kind === 'error' ? CONFIG.errorToastMs : CONFIG.toastMs;
    const existing = liveToasts.get(key);
    if (existing) {
      existing.count += 1;
      existing.el.textContent = `${text} (×${existing.count})`;
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => dismiss(key), ms);
      return;
    }
    while (liveToasts.size >= MAX_TOASTS) dismiss(liveToasts.keys().next().value);

    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText =
      `background:${TOAST_COLORS[kind] || TOAST_COLORS.info};color:#fff;padding:10px 14px;` +
      'border-radius:8px;font:500 14px/1.35 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35);' +
      'pointer-events:auto;cursor:pointer';
    el.title = 'Click to dismiss';
    el.addEventListener('click', () => dismiss(key));
    toastHost.appendChild(el);
    liveToasts.set(key, { el, timer: setTimeout(() => dismiss(key), ms), count: 1 });
  }

  function dismiss(key) {
    const t = liveToasts.get(key);
    if (!t) return;
    clearTimeout(t.timer);
    t.el.remove();
    liveToasts.delete(key);
  }

  window.addEventListener('click', onClick, true);
})();
