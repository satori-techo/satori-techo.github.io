// 手帖.js（c1・2026-10-30）：どのページでも読む。上の帯・サイト内の検索・バックナンバー・過去の記事の欄（人気と最新）・用語の説明の並べ方・タグのページ
//   記事の目録は js\記事一覧.js（window.手帖の記事。書き出すプログラムが作る。会員の区切りより前の字だけ）
(() => {
  const 記事 = (window.手帖の記事 || []).slice().sort((a, b) => (a.日 < b.日 ? 1 : a.日 > b.日 ? -1 : 0));
  const 根 = document.body.dataset.根 || '';
  const 口 = (document.body.dataset.口 || '').replace(/\/+$/, '');
  const 編集中 = !!document.querySelector('meta[name="編集の所"]');
  const $ = (tag, attrs = {}, ...子) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else e.setAttribute(k, v); } e.append(...子.filter(x => x != null)); return e; };
  const 日の字 = d => { const [y, m, dd] = (d || '').split('-').map(Number); return y ? `${y}年${m}月${dd}日` : ''; };

  // ===== 上の帯：下に送ったら細くする =====
  const 頭 = document.querySelector('.site-head');
  const 帯 = () => 頭 && 頭.classList.toggle('is-thin', window.scrollY > 60);
  window.addEventListener('scroll', 帯, { passive: true }); 帯();

  // ===== サイト内の検索 =====
  const 欄 = document.getElementById('site-q'), 結果 = document.querySelector('.search-results');
  if (欄 && 結果) {
    const 探す = q => {
      const 語 = q.toLowerCase().split(/[\s　]+/).filter(Boolean);
      if (!語.length) return [];
      return 記事.filter(a => { const 字 = (a.題名 + '\n' + a.タグ.join(' ') + '\n' + a.本文).toLowerCase(); return 語.every(w => 字.includes(w)); });
    };
    const 抜き出す = (a, q) => { const w = q.split(/[\s　]+/).filter(Boolean)[0] || ''; const i = a.本文.toLowerCase().indexOf(w.toLowerCase()); if (i < 0) return a.わかること || ''; const s = Math.max(0, i - 20); return (s ? '…' : '') + a.本文.slice(s, i + 40).replace(/\n/g, ' ') + '…'; };
    const 出す = () => {
      const q = 欄.value.trim();
      if (!q) { 結果.hidden = true; return; }
      const 見つけた = 探す(q);
      結果.replaceChildren(...(見つけた.length ? 見つけた.slice(0, 8).map(a => $('a', { href: 根 + a.場所 }, $('b', {}, a.題名), $('small', {}, 抜き出す(a, q)))) : [$('p', { class: 'search-none' }, '見つかりませんでした')]));
      結果.hidden = false;
    };
    欄.addEventListener('input', 出す);
    欄.addEventListener('focus', 出す);
    欄.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = 結果.querySelector('a'); if (a) location.href = a.href; } if (e.key === 'Escape') { 結果.hidden = true; 欄.blur(); } });
    document.addEventListener('click', e => { if (!e.target.closest('.site-search')) 結果.hidden = true; });
  }

  // ===== バックナンバー：年 → 月 → 記事 =====
  const 箱 = document.querySelector('.backnumber-body');
  if (箱) {
    const 年 = new Map();
    for (const a of 記事) { const y = a.日.slice(0, 4), m = Number(a.日.slice(5, 7)); if (!y) continue; if (!年.has(y)) 年.set(y, new Map()); const 月 = 年.get(y); if (!月.has(m)) 月.set(m, []); 月.get(m).push(a); }
    if (!年.size) 箱.append($('p', { class: 'muted' }, 'まだ記事がありません'));
    for (const [y, 月] of 年) 箱.append($('details', { class: 'bn-year' }, $('summary', {}, y + '年'), ...[...月].map(([m, l]) => $('details', { class: 'bn-month' }, $('summary', {}, `${m}月（${l.length}）`), $('ul', {}, ...l.map(a => $('li', {}, $('a', { href: 根 + a.場所 }, a.題名))))))));
  }

  // ===== 過去の記事の欄：左が人気（1・2・3週間以内）、右が最新。かぶらない。今の記事は出さない =====
  const 欄の過去 = document.querySelector('.past');
  if (欄の過去) {
    const 今の = 欄の過去.dataset.今;
    const 一つ = (a, 札) => $('li', {}, $('a', { href: 根 + a.場所 }, a.表紙 ? $('img', { src: 根 + a.表紙, alt: '', loading: 'lazy' }) : $('span', { class: 'past-noimg' }), 札 ? $('small', {}, 札) : null, $('span', { class: 'past-title' }, a.題名)));
    const 並べる = 数 => {
      const 使った = new Set([今の]);
      const 候補 = 記事.filter(a => a.番号 !== 今の);
      const 人気 = [];
      for (const [週, 札] of [['7', '1週間以内'], ['14', '2週間以内'], ['21', '3週間以内']]) {
        const 表 = (数 && 数[週]) || {};
        const 一番 = 候補.filter(a => !使った.has(a.番号) && (表[a.番号] || 0) > 0).sort((a, b) => 表[b.番号] - 表[a.番号])[0] || 候補.find(a => !使った.has(a.番号));
        if (一番) { 使った.add(一番.番号); 人気.push(一つ(一番, 札)); }
      }
      const 最新 = 候補.filter(a => !使った.has(a.番号)).slice(0, 3).map(a => 一つ(a, 日の字(a.日)));
      欄の過去.querySelector('.past-popular ol').replaceChildren(...人気);
      欄の過去.querySelector('.past-latest ol').replaceChildren(...最新);
      欄の過去.hidden = !人気.length && !最新.length;
    };
    並べる(null);
    if (口) {
      fetch(口 + '/api/popular').then(r => (r.ok ? r.json() : null)).then(j => j && 並べる(j)).catch(() => {});
      if (!編集中 && 今の) fetch(口 + '/api/view/' + encodeURIComponent(今の), { method: 'POST' }).catch(() => {});
    }
  }

  // ===== 用語の説明：広い画面は段落の横（その言葉の高さ）に、せまい画面はその段落のすぐ下に =====
  const 広い = () => window.matchMedia('(min-width: 1180px)').matches;
  const 用語を並べる = () => {
    document.querySelectorAll('.blk-text').forEach(blk => {
      const 横 = blk.querySelector(':scope > .term-notes');
      if (!横) return;
      const 説明たち = [...blk.querySelectorAll('.term-note')];
      if (広い() || 編集中) {
        説明たち.forEach(n => { if (n.parentElement !== 横) 横.append(n); });
        if (!広い()) { 説明たち.forEach(n => (n.style.top = '')); return; }
        let 下 = 0;
        for (const n of 説明たち) {
          const 語 = blk.querySelector(`.term[data-term="${n.dataset.term}"]`);
          const 上 = 語 ? 語.getBoundingClientRect().top - blk.getBoundingClientRect().top - 4 : 下;
          const y = Math.max(上, 下);
          n.style.top = y + 'px';
          下 = y + n.offsetHeight + 10;
        }
        横.style.minHeight = 下 + 'px';
      } else {
        // その言葉のある段落のすぐ下に入れる（同じ段落なら番号の順に）
        for (const n of 説明たち) {
          n.style.top = '';
          const 語 = blk.querySelector(`.term[data-term="${n.dataset.term}"]`);
          const p = 語 && 語.closest('p');
          if (!p) { 横.append(n); continue; }
          let 後 = p;
          while (後.nextElementSibling && 後.nextElementSibling.classList.contains('term-note')) 後 = 後.nextElementSibling;
          後.after(n);
        }
      }
    });
  };
  window.用語を並べる = 用語を並べる;
  let 待ち;
  const 並べ直す = () => { clearTimeout(待ち); 待ち = setTimeout(用語を並べる, 120); };
  window.addEventListener('resize', 並べ直す);
  window.addEventListener('load', 用語を並べる);
  document.fonts && document.fonts.ready.then(用語を並べる);
  用語を並べる();
  // 会員の続きが入ったら並べ直す
  const 続き = document.querySelector('.members-content');
  if (続き) new MutationObserver(並べ直す).observe(続き, { childList: true, subtree: true });
  // 用語の番号を押したら、その説明へ
  document.addEventListener('click', e => { const t = e.target.closest('.term'); if (!t) return; const n = document.getElementById('term-' + t.dataset.term); if (n) { n.classList.add('is-lit'); setTimeout(() => n.classList.remove('is-lit'), 1500); } });

  // ===== タグのページ（tags.html?t=タグ） =====
  const タグの欄 = document.querySelector('.tagged');
  if (タグの欄) {
    const t = new URLSearchParams(location.search).get('t') || '';
    const 数 = new Map();
    for (const a of 記事) for (const x of a.タグ) 数.set(x, (数.get(x) || 0) + 1);
    タグの欄.querySelector('.tag-cloud').replaceChildren(...[...数].sort((a, b) => b[1] - a[1]).map(([x, n]) => $('a', { class: 'tag' + (x === t ? ' is-now' : ''), href: '?t=' + encodeURIComponent(x) }, `#${x}（${n}）`)));
    const 合う = t ? 記事.filter(a => a.タグ.includes(t)) : [];
    タグの欄.querySelector('.tagged-title').textContent = t ? '#' + t : 'タグ';
    タグの欄.querySelector('.tagged-count').textContent = t ? 合う.length + ' 本' : '';
    if (t) document.title = '#' + t + ' | ' + document.title.split(' | ').pop();
    タグの欄.querySelector('.tagged-list').replaceChildren(...合う.map(a => $('article', { class: 'entry' }, $('a', { class: 'entry-cover', href: 根 + a.場所, tabindex: '-1', 'aria-hidden': 'true' }, a.表紙 ? $('img', { src: 根 + a.表紙, alt: '', loading: 'lazy' }) : $('span', { class: 'paper-cover' }, a.題名)), $('div', { class: 'entry-body' }, $('p', { class: 'meta' }, 日の字(a.日)), $('h3', {}, $('a', { href: 根 + a.場所 }, a.題名)), a.わかること ? $('p', {}, a.わかること) : null))));
  }
})();
