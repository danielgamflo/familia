// Conecta la app con Supabase y le da la misma forma que usa la sincronización (doc/collection/onSnapshot).
(function () {
  const cfg = window.FAMILIA_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseKey && !/^TU_/.test(cfg.supabaseUrl) && window.supabase);
  const api = { configured };
  if (!configured) { window.FamiliaSupabase = api; return; }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const META = { fromCache: false, hasPendingWrites: false };
  const fail = e => { throw { code: 'unavailable', message: (e && e.message) || 'Error de red' }; };
  const ok = r => { if (r.error) fail(r.error); return r; };

  // Observa una tabla: carga al inicio y vuelve a cargar con cada cambio en vivo,
  // al volver a la app y cada minuto por si se perdió un aviso.
  function watch(table, load, onError) {
    let timer = null, closed = false, first = true;
    const run = async () => {
      try { await load(); first = false; }
      catch (e) { if (first && onError) { first = false; onError(e); } }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(run, 150); };
    const ch = sb.channel('familia-' + table + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table }, schedule).subscribe();
    const onVis = () => { if (document.visibilityState === 'visible') schedule(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', schedule);
    const poll = setInterval(run, 60000);
    run();
    return () => { if (closed) return; closed = true; clearTimeout(timer); clearInterval(poll); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', schedule); sb.removeChannel(ch); };
  }

  const db = {
    doc(path) {
      if (path === 'meta/config') return {
        async set(v) { ok(await sb.from('config').upsert({ id: 1, data: v, updated_at: new Date().toISOString() })); },
        onSnapshot(next, err) {
          return watch('config', async () => {
            const r = ok(await sb.from('config').select('data').eq('id', 1).maybeSingle());
            next({ id: 'config', exists: !!r.data, data: () => r.data && r.data.data, metadata: META });
          }, err);
        }
      };
      const m = /^events\/(.+)$/.exec(path);
      if (m) return {
        async set(v) { ok(await sb.from('events').upsert({ id: m[1], data: v, updated_at: new Date().toISOString() })); },
        async delete() { ok(await sb.from('events').delete().eq('id', m[1])); }
      };
      throw new Error('Ruta no soportada: ' + path);
    },
    collection(path) {
      if (path !== 'events') throw new Error('Colección no soportada: ' + path);
      return {
        onSnapshot(next, err) {
          return watch('events', async () => {
            const r = ok(await sb.from('events').select('id,data'));
            const docs = (r.data || []).map(x => ({ id: x.id, exists: true, data: () => x.data, metadata: META }));
            next({ docs, size: docs.length, empty: !docs.length, metadata: META });
          }, err);
        }
      };
    }
  };

  api.client = sb;
  api.session = async () => (await sb.auth.getSession()).data.session;
  api.signIn = async (email, password) => { const r = await sb.auth.signInWithPassword({ email, password }); if (r.error) throw r.error; return r.data.session; };
  api.signUp = async (email, password) => { const r = await sb.auth.signUp({ email, password }); if (r.error) throw r.error; return r.data; };
  api.signOut = async () => { await sb.auth.signOut(); };
  // Devuelve quién es el usuario (Daniel = a, Cami = b) y si su correo está autorizado.
  api.connect = async () => {
    const s = await api.session(); if (!s) return null;
    const r = await sb.from('members').select('slot').maybeSingle();
    const slot = r.data && r.data.slot;
    return { db, uid: s.user.id, email: s.user.email, me: slot || null, canWrite: !!slot, denied: !slot };
  };
  window.FamiliaSupabase = api;
})();
