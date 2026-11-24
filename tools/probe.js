// Seerr No-Confirm Request — read-only environment probe.
// Paste into the Firefox console on http://192.168.1.229:5055 while logged in as an admin.
// Only GET requests. Prints no API keys, cookies or tokens.
(async () => {
  const get = async (p) => {
    try { const r = await fetch(p, { credentials: 'same-origin' }); return r.ok ? r.json() : { error: r.status }; }
    catch (e) { return { error: String(e) }; }
  };
  const P = { ADMIN: 2, MANAGE_REQUESTS: 16, REQUEST: 32, AUTO_APPROVE: 128, AUTO_APPROVE_MOVIE: 256,
    AUTO_APPROVE_TV: 512, REQUEST_ADVANCED: 8192, REQUEST_MOVIE: 262144, REQUEST_TV: 524288 };
  const perms = (v) => Object.keys(P).filter((k) => (v & P[k]) === P[k]);
  const [status, me, net, main, radarr, sonarr, rules, users] = await Promise.all([
    get('/api/v1/status'), get('/api/v1/auth/me'), get('/api/v1/settings/network'),
    get('/api/v1/settings/main'), get('/api/v1/settings/radarr'), get('/api/v1/settings/sonarr'),
    get('/api/v1/overrideRule'),
    get('/api/v1/user?take=100&skip=0'),
  ]);
  const report = {
    version: status.version,
    origin: location.origin,
    me: { id: me.id, perms: perms(me.permissions || 0) },
    csrfProtection: net.csrfProtection ?? net.error ?? '(unknown)',
    defaultQuotas: main.defaultQuotas || main.error,
    partialRequestsEnabled: main.partialRequestsEnabled,
    enableSpecialEpisodes: main.enableSpecialEpisodes,
    radarr: Array.isArray(radarr)
      ? radarr.map((s) => ({ id: s.id, name: s.name, is4k: s.is4k, isDefault: s.isDefault,
          profile: s.activeProfileName, folder: s.activeDirectory }))
      : radarr,
    sonarr: Array.isArray(sonarr)
      ? sonarr.map((s) => ({ id: s.id, name: s.name, is4k: s.is4k, isDefault: s.isDefault,
          profile: s.activeProfileName, folder: s.activeDirectory, animeProfile: s.activeAnimeProfileName,
          animeFolder: s.activeAnimeDirectory, seasonFolders: s.enableSeasonFolders, monitorNewItems: s.monitorNewItems }))
      : sonarr,
    overrideRules: Array.isArray(rules)
      ? { movie: rules.filter((r) => r.radarrServiceId != null).length,
          tv: rules.filter((r) => r.sonarrServiceId != null).length }
      : rules,
    users: Array.isArray(users.results)
      ? users.results.map((u) => ({ id: u.id, perms: perms(u.permissions || 0),
          movieQuota: u.movieQuotaLimit ?? 'default', tvQuota: u.tvQuotaLimit ?? 'default' }))
      : users,
  };
  console.log(JSON.stringify(report, null, 2));
})();
