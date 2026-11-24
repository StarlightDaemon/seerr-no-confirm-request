// Mock-DOM tests for seerr-no-confirm-request.user.js. Card structure mirrors Seerr v3.5.2 TitleCard.
// Run: npm i jsdom && node test/mock-dom.test.js seerr-no-confirm-request.user.js
const { JSDOM } = require('jsdom');
const fs = require('fs');
const assert = require('assert');

const SCRIPT = fs.readFileSync(process.argv[2] || 'seerr-no-confirm-request.user.js', 'utf8');

function card(type, id) {
  return `
  <div data-testid="title-card"><div><div>
    <div class="top"><button class="watchlist">★</button></div>
    <div class="overlay">
      <a href="/${type}/${id}"><h1 data-testid="title-card-title">T-${type}-${id}</h1></a>
      <div class="bottom"><button class="req"><svg><path/></svg><span>Request</span></button></div>
    </div>
  </div></div></div>`;
}

const seasons = (n, { specials = true, unaired = 0 } = {}) => [
  ...(specials ? [{ seasonNumber: 0, episodeCount: 4 }] : []),
  ...Array.from({ length: n }, (_, i) => ({ seasonNumber: i + 1, episodeCount: 10 })),
  ...Array.from({ length: unaired }, (_, i) => ({ seasonNumber: n + i + 1, episodeCount: 0 })),
];

/**
 * opts.version: status version (or Error / {status} for failure)
 * opts.tv: map tmdbId → season list | {status}
 * opts.requests: queue of responses for POST /api/v1/request
 */
async function setup(opts = {}) {
  const { origin = 'http://192.168.1.229:5055', version = '3.5.2', tv = {}, requests = [], cookie = '' } = opts;
  const dom = new JSDOM(
    `<!doctype html><html><head></head><body><div id="__next">
      ${card('movie', 101)}${card('tv', 202)}${card('collection', 303)}${card('movie', 404)}${card('tv', 505)}
    </div></body></html>`,
    { url: origin + '/', runScripts: 'outside-only' }
  );
  const w = dom.window;
  if (cookie) w.document.cookie = cookie;
  const calls = [];
  const queue = [...requests];
  const reply = (r) =>
    r instanceof Error
      ? Promise.reject(r)
      : new Promise((res) =>
          setTimeout(() => res({
            status: r.status, ok: r.status >= 200 && r.status < 300,
            json: async () => { if (r.body === undefined) throw new Error('no json'); return r.body; },
          }), 3));
  w.fetch = (url, o = {}) => {
    calls.push({ url, opts: o });
    if (url === '/api/v1/status')
      return reply(version instanceof Error ? version : typeof version === 'object' ? version : { status: 200, body: { version } });
    const m = /^\/api\/v1\/tv\/(\d+)$/.exec(url);
    if (m) {
      const s = tv[m[1]];
      if (!s) return reply({ status: 500, body: { message: 'boom' } });
      return reply(Array.isArray(s) ? { status: 200, body: { id: +m[1], seasons: s } } : s);
    }
    if (url === '/api/v1/request') return reply(queue.shift());
    return reply({ status: 404 });
  };
  const reactSeen = [];
  w.document.getElementById('__next').addEventListener('click', (e) => reactSeen.push(e.target));
  w.eval(SCRIPT);
  await tick(); // let the version check resolve
  const posts = () => calls.filter((c) => c.url === '/api/v1/request');
  return { w, calls, posts, reactSeen };
}

function click(w, el, init = {}) {
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }));
}
const btn = (w, type, id) => w.document.querySelector(`a[href="/${type}/${id}"] + div > button`);
const tick = (ms = 25) => new Promise((r) => setTimeout(r, ms));
const toasts = (w) => [...w.document.querySelectorAll('#seerr-no-confirm-request-toasts > div')].map((d) => d.textContent);
const css = (w) => (w.document.getElementById('seerr-no-confirm-request-style') || {}).textContent || '';
const ok = (status = 2) => ({ status: 201, body: { id: 9, status } });

const tests = {
  // ---- movies ----
  async 'movie: one click submits one correct request'() {
    const { w, posts, reactSeen } = await setup({ requests: [ok()] });
    click(w, btn(w, 'movie', 101).querySelector('path'));
    await tick();
    assert.strictEqual(posts().length, 1);
    const c = posts()[0];
    assert.strictEqual(c.opts.method, 'POST');
    assert.strictEqual(c.opts.credentials, 'same-origin');
    assert.deepStrictEqual(JSON.parse(c.opts.body), { mediaType: 'movie', mediaId: 101, is4k: false });
    assert.ok(!('X-XSRF-TOKEN' in c.opts.headers));
    assert.strictEqual(reactSeen.length, 0, 'click leaked to React');
    assert.match(toasts(w)[0], /T-movie-101 requested and approved/);
    assert.match(css(w), /a\[href="\/movie\/101"\] \+ div > button::after\{content:"Requested"\}/);
  },
  async 'movie: pending approval reflected'() {
    const { w } = await setup({ requests: [ok(1)] });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.match(toasts(w)[0], /pending approval/);
    assert.match(css(w), /Pending approval/);
  },
  async 'movie: rapid clicks → one request; repeats collapse into one toast'() {
    const { w, posts } = await setup({ requests: [ok()] });
    for (let i = 0; i < 5; i++) click(w, btn(w, 'movie', 101));
    assert.match(css(w), /Requesting…/);
    await tick();
    for (let i = 0; i < 9; i++) click(w, btn(w, 'movie', 101));
    await tick();
    assert.strictEqual(posts().length, 1);
    const t = toasts(w);
    assert.strictEqual(t.length, 2);
    assert.match(t[1], /already requested\. \(×9\)$/);
  },
  async 'movie: 409 marks already requested'() {
    const { w } = await setup({ requests: [{ status: 409, body: { message: 'exists' } }] });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.match(toasts(w)[0], /already has a request/);
    assert.match(css(w), /Already requested/);
  },
  async 'movie: 401/403/500/network restore control and allow retry'() {
    const { w, posts } = await setup({
      requests: [
        { status: 401, body: { message: 'x' } },
        { status: 403, body: { message: 'Movie Quota exceeded.' } },
        { status: 500 },
        new TypeError('net'),
        ok(),
      ],
    });
    for (const re of [/session has expired/, /Movie Quota exceeded/, /HTTP 500/, /Couldn't reach Seerr/, /approved/]) {
      click(w, btn(w, 'movie', 101));
      await tick();
      assert.match(toasts(w).at(-1), re);
    }
    assert.strictEqual(posts().length, 5);
  },
  async 'movie: 202 is not reported as success'() {
    const { w } = await setup({ requests: [{ status: 202, body: { message: 'odd' } }] });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.match(toasts(w)[0], /failed \(HTTP 202/);
    assert.strictEqual(css(w), '');
  },
  async 'CSRF cookie forwarded as header'() {
    const { w, posts } = await setup({ cookie: 'XSRF-TOKEN=abc%2F123', requests: [ok()] });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.strictEqual(posts()[0].opts.headers['X-XSRF-TOKEN'], 'abc/123');
  },

  // ---- series ----
  async 'tv: ≤5 aired seasons → one all-seasons request'() {
    const { w, posts, reactSeen } = await setup({ tv: { 202: seasons(3, { unaired: 1 }) }, requests: [ok()] });
    click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.strictEqual(posts().length, 1);
    assert.deepStrictEqual(JSON.parse(posts()[0].opts.body), { mediaType: 'tv', mediaId: 202, seasons: 'all', is4k: false });
    assert.strictEqual(reactSeen.length, 0);
    assert.match(toasts(w)[0], /T-tv-202 \(3 seasons\) requested and approved/);
    assert.match(css(w), /a\[href="\/tv\/202"\][^{]*::after\{content:"Requested"\}/);
  },
  async 'tv: exactly 5 seasons still one-click; specials not counted'() {
    const { w, posts } = await setup({ tv: { 202: seasons(5) }, requests: [ok()] });
    click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.strictEqual(posts().length, 1);
  },
  async 'tv: >5 seasons → native dialog, no request'() {
    const { w, posts, reactSeen } = await setup({ tv: { 202: seasons(8) } });
    click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 1, 'native re-click should reach React exactly once');
    assert.match(toasts(w)[0], /has 8 seasons; choose them in the dialog/);
    assert.strictEqual(css(w), '');
  },
  async 'tv: season lookup failure → native dialog'() {
    const { w, posts, reactSeen } = await setup({ tv: {} });
    click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 1);
    assert.match(toasts(w)[0], /Couldn't check seasons/);
  },
  async 'tv: no aired seasons → native dialog'() {
    const { w, posts, reactSeen } = await setup({ tv: { 202: seasons(0, { unaired: 1 }) } });
    click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 1);
  },
  async 'tv: 202 from server → already requested/available'() {
    const { w } = await setup({ tv: { 202: seasons(2) }, requests: [{ status: 202, body: { message: 'No seasons available to request' } }] });
    click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.match(toasts(w)[0], /all seasons are already requested or available/);
    assert.match(css(w), /Already requested/);
  },
  async 'tv: rapid clicks during season lookup → one lookup, one request'() {
    const { w, calls, posts } = await setup({ tv: { 202: seasons(2) }, requests: [ok()] });
    for (let i = 0; i < 5; i++) click(w, btn(w, 'tv', 202));
    await tick(60);
    assert.strictEqual(calls.filter((c) => c.url === '/api/v1/tv/202').length, 1);
    assert.strictEqual(posts().length, 1);
  },
  async 'tv: native fallback when button re-rendered during lookup'() {
    const { w, reactSeen } = await setup({ tv: { 202: seasons(9) } });
    const b = btn(w, 'tv', 202);
    click(w, b);
    b.replaceWith(b.cloneNode(true)); // simulate React re-mount
    await tick(60);
    assert.strictEqual(reactSeen.length, 1);
    assert.strictEqual(reactSeen[0].closest('button'), btn(w, 'tv', 202));
  },

  // ---- passthrough ----
  async 'collection, watchlist, modifiers pass through untouched'() {
    const { w, posts, reactSeen } = await setup();
    click(w, btn(w, 'collection', 303));
    click(w, w.document.querySelector('button.watchlist'));
    click(w, btn(w, 'movie', 101), { shiftKey: true });
    click(w, btn(w, 'tv', 202), { shiftKey: true });
    click(w, btn(w, 'movie', 101), { ctrlKey: true });
    click(w, btn(w, 'movie', 101), { button: 1 });
    await tick();
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 6);
  },
  async 'unknown structure falls back to native'() {
    const { w, posts, reactSeen } = await setup();
    const b = btn(w, 'movie', 404);
    b.parentElement.appendChild(w.document.createElement('button'));
    click(w, b);
    await tick();
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 1);
  },
  async 'does nothing on another origin'() {
    const { w, calls, reactSeen } = await setup({ origin: 'http://example.com' });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.strictEqual(calls.length, 0, 'no requests at all, not even status');
    assert.strictEqual(reactSeen.length, 1);
  },

  // ---- version guard ----
  async 'guard: untested version → native + one notice per session'() {
    const { w, posts, reactSeen } = await setup({ version: '3.6.0' });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 1);
    assert.match(toasts(w)[0], /paused: Seerr 3\.6\.0 hasn't been tested/);
    assert.strictEqual(w.sessionStorage.getItem('seerr-no-confirm-request:paused-notice'), '1');
  },
  async 'guard: status failure → native'() {
    const { w, posts, reactSeen } = await setup({ version: new TypeError('down') });
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.strictEqual(posts().length, 0);
    assert.strictEqual(reactSeen.length, 1);
    assert.match(toasts(w)[0], /couldn't verify the Seerr version/);
  },
  async 'guard: clicks before the check answers stay native'() {
    const dom = new JSDOM(`<!doctype html><body><div id="__next">${card('movie', 101)}</div></body>`,
      { url: 'http://192.168.1.229:5055/', runScripts: 'outside-only' });
    const w = dom.window;
    const seen = [];
    let posted = 0;
    w.fetch = (url) => { if (url === '/api/v1/request') posted++; return new Promise(() => {}); }; // never answers
    w.document.getElementById('__next').addEventListener('click', (e) => seen.push(e));
    w.eval(SCRIPT);
    click(w, btn(w, 'movie', 101));
    await tick();
    assert.strictEqual(posted, 0);
    assert.strictEqual(seen.length, 1);
  },
};

(async () => {
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(); console.log('PASS', name); }
    catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
  }
  console.log(failed ? `${failed} failed` : `all ${Object.keys(tests).length} passed`);
  process.exit(failed ? 1 : 0);
})();
