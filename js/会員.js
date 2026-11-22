// 会員限定の続き（記事のページの「会員の区切り」）。会員の仕組み（Cloudflare Workers。アドレスは data-口）に、読めるかを聞く。
//   ログインの札は、会員の仕組みがアドレスの # の後ろ（members-token=…）で渡し、この PC のブラウザの localStorage にだけしまう。
(() => {
  const この台本 = document.currentScript && document.currentScript.src;
  const KEY = 'satori-members-token';
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('members-token')) {
    localStorage.setItem(KEY, h.get('members-token'));
    history.replaceState(null, '', location.pathname + location.search + '#members');
  }
  if (h.get('members-logout')) localStorage.removeItem(KEY);
  const gate = document.querySelector('.members-gate');
  if (!gate || !gate.dataset.口) return;
  const base = gate.dataset.口.replace(/\/+$/, '');
  const id = gate.dataset.記事;
  const msg = gate.querySelector('.gate-msg');
  const buttons = gate.querySelector('.gate-buttons');
  const box = gate.querySelector('.members-content');
  const here = location.href.split('#')[0];
  const token = () => localStorage.getItem(KEY);
  const call = (path, opt = {}) => fetch(base + path, { ...opt, headers: { ...(opt.headers || {}), ...(token() ? { Authorization: 'Bearer ' + token() } : {}), ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
  const show = (names, text) => {
    msg.textContent = text;
    buttons.querySelectorAll('[data-する]').forEach(b => { b.hidden = !names.includes(b.dataset.する); });
  };
  const login = () => { location.href = base + '/login?return=' + encodeURIComponent(here); };
  const buy = async kind => {
    if (!token()) return login();
    msg.textContent = '支払いの画面を開いています…';
    const r = await call('/api/buy', { method: 'POST', body: JSON.stringify({ kind, id, return: here }) });
    if (r.status === 401) { localStorage.removeItem(KEY); return login(); }
    const j = await r.json().catch(() => ({}));
    if (j.url) location.href = j.url; else msg.textContent = j.error || '支払いの画面を開けませんでした。';
  };
  buttons.addEventListener('click', e => {
    const b = e.target.closest('[data-する]');
    if (!b) return;
    e.preventDefault();
    if (b.dataset.する === 'ログイン') login();
    if (b.dataset.する === '会員') buy('member');
    if (b.dataset.する === '買う') buy('article');
    if (b.dataset.する === 'ログアウト') { localStorage.removeItem(KEY); load(); }
  });
  if (!buttons.querySelector('[data-する="ログアウト"]')) {
    const out = document.createElement('a');
    out.href = '#members'; out.className = 'button secondary'; out.dataset.する = 'ログアウト'; out.textContent = 'ログアウト';
    buttons.append(out);
  }
  const load = async () => {
    if (!token()) return show(['ログイン', '会員', '買う'], 'ここから先は、会員の方が読めます。ログインすると続きが読めるか分かります。');
    msg.textContent = '読めるかを確かめています…';
    let r;
    try { r = await call('/api/rest/' + encodeURIComponent(id)); } catch { return show(['ログイン'], '会員の仕組みにつながりませんでした。少し待ってから開き直してください。'); }
    if (r.status === 401) { localStorage.removeItem(KEY); return show(['ログイン', '会員', '買う'], 'ログインの期限が切れました。もう一度ログインしてください。'); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 402) {
      const who = j.email ? `（${j.email} でログイン中）` : '';
      if (j.member) return show(['買う', 'ログアウト'], `この記事は、会員になる前の月の記事です。1 本ずつ買って読めます${who}。`);
      return show(['会員', '買う', 'ログアウト'], `会員になると、この月の記事が読めます。この記事だけを買うこともできます${who}。`);
    }
    if (!r.ok) return show(['ログイン'], j.error || 'いまは読めません。');
    const doc = new DOMParser().parseFromString(j.html || '', 'text/html');
    for (const img of doc.querySelectorAll('img')) {
      const src = img.getAttribute('src') || '';
      const m = src.match(/^会員の絵\/[^/]+\/(.+)$/);
      img.removeAttribute('src');
      if (!m) continue;
      call('/api/image/' + encodeURIComponent(id) + '/' + encodeURIComponent(m[1])).then(x => x.ok ? x.blob() : null).then(b => { if (b) img.src = URL.createObjectURL(b); });
    }
    box.replaceChildren(...doc.body.childNodes);
    box.hidden = false;
    // 続きの中に書のページ（絵を横に送る所）があれば、送るボタンを用意する
    if (box.querySelector('.page-strip')) {
      if (window.書のページを用意) window.書のページを用意();
      else if (この台本) { const sc = document.createElement('script'); sc.src = new URL('書のページ.js', この台本).href; document.body.append(sc); }
    }
    gate.classList.add('is-open');
    show(['ログアウト'], j.email ? `会員の方の続きです（${j.email}）。` : '会員の方の続きです。');
  };
  load();
})();
