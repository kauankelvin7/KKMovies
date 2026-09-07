const VERSION_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;
const RELOAD_KEY = 'kkm-release-reload';

export function validRelease(value: unknown): value is string {
  return typeof value === 'string' && VERSION_PATTERN.test(value);
}

export function readWorkerVersion(worker: ServiceWorker): Promise<string | null> {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const finish = (version: string | null) => {
      clearTimeout(timer); channel.port1.close(); channel.port2.close(); resolve(version);
    };
    const timer = setTimeout(() => finish(null), 2500);
    channel.port1.onmessage = event => finish(validRelease(event.data?.version) ? event.data.version : null);
    try { worker.postMessage({ type: 'GET_APP_VERSION' }, [channel.port2]); } catch { finish(null); }
  });
}

/** Automatic updates belong to the catalog entry only, never the watch document. */
export function startAppUpdates(currentVersion: string): () => void {
  let registration: ServiceWorkerRegistration | undefined;
  let stopped = false;
  let checking = false;
  let lastCheck = 0;
  let lastInteraction = Date.now();
  let pending: string | null = null;
  let ready = false;
  let reloading = false;
  let applyTimer: ReturnType<typeof setTimeout> | undefined;
  const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : undefined;

  const apply = () => {
    clearTimeout(applyTimer);
    if (stopped || !pending || !ready || reloading) return;
    const editing = document.activeElement?.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    const playing = Array.from(document.querySelectorAll('video, audio')).some(element => !(element as HTMLMediaElement).paused);
    if (!navigator.onLine || document.visibilityState !== 'visible' || editing || playing || document.querySelector('[aria-modal="true"], dialog[open]') || Date.now() - lastInteraction < 2000) {
      applyTimer = setTimeout(apply, 2000); return;
    }
    // One attempt per source/target pair prevents loops if a proxy serves stale HTML.
    const attempt = `${currentVersion}:${pending}`;
    try {
      if (sessionStorage.getItem(RELOAD_KEY) === attempt) return;
      sessionStorage.setItem(RELOAD_KEY, attempt);
    } catch {
      // Without a persistent guard, wait for the next normal navigation instead.
      return;
    }
    reloading = true;
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith('kk_catalog_v2_')) localStorage.removeItem(key);
    } catch { /* Personal collections are never cleared. */ }
    location.reload();
  };

  const check = async (force = false) => {
    if (stopped || checking || !navigator.onLine || document.visibilityState !== 'visible' || (!force && Date.now() - lastCheck < 30000)) return;
    checking = true; lastCheck = Date.now();
    try {
      const response = await fetch('/version.json', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      const release = await response.json();
      if (stopped || !validRelease(release.version)) return;
      if (release.version === currentVersion) { pending = null; ready = false; clearTimeout(applyTimer); return; }
      pending = release.version; ready = false;
      if (registration) {
        await registration.update();
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      }
      const controller = sw?.controller;
      // Do not reload into an old precache: the controlling worker must match the release.
      ready = controller ? await readWorkerVersion(controller) === pending : !registration || registration.active !== null;
      if (!stopped) apply();
    } catch { /* Offline, a failed install or an unavailable release must not interrupt the app. */ }
    finally { checking = false; }
  };

  const interaction = () => { lastInteraction = Date.now(); };
  const resume = () => { void check(); apply(); };
  const online = () => { void check(true); };
  const changed = () => {
    // Controller changes can arrive during registration.update(), so retry after that check.
    lastCheck = 0;
    void check(true);
  };
  const releaseTimer = setInterval(() => { void check(); }, 5 * 60 * 1000);
  // Also handles a newly activated worker while a previous check was still in progress.
  const pendingTimer = setInterval(() => { if (pending && !ready) void check(true); }, 10000);
  for (const event of ['pointerdown', 'keydown', 'input']) document.addEventListener(event, interaction, { passive: true });
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('focus', resume);
  window.addEventListener('pageshow', resume);
  window.addEventListener('online', online);
  window.addEventListener('vite:preloadError', online);
  sw?.addEventListener('controllerchange', changed);
  if (sw) {
    sw.register('/sw.js', { updateViaCache: 'none' }).then(value => {
      if (stopped) return;
      registration = value;
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      void check(true);
    }).catch(() => { void check(true); });
  } else void check(true);

  return () => {
    stopped = true; clearInterval(releaseTimer); clearInterval(pendingTimer); clearTimeout(applyTimer);
    for (const event of ['pointerdown', 'keydown', 'input']) document.removeEventListener(event, interaction);
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('focus', resume); window.removeEventListener('pageshow', resume);
    window.removeEventListener('online', online); window.removeEventListener('vite:preloadError', online);
    sw?.removeEventListener('controllerchange', changed);
  };
}
