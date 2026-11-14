(() => {
  'use strict';

  const UI = {
    he: { skip: 'דלג לעבודות', works: 'עבודות', projects: 'פרויקטים', writing: 'טקסטים', about: 'אודות', contact: 'קשר', motto: 'צילום · קריעה · הרכבה מחדש', talk: 'דברו איתי', all: 'הכול', open: 'לצפייה במסך מלא', read: 'לקריאה', photo: 'צילום', cm: 'ס״מ', shop: 'רכישת עבודות', shopNote: 'העבודות זמינות לרכישה דרך גלריה ״פחות מאלף״, תל אביב.', shopLink: 'לעמוד שלי בגלריה', noTexts: 'טקסטים יתווספו כאן בקרוב.', langBtn: 'EN', langLabel: 'Switch to English', close: 'סגירה', prev: 'הקודם', next: 'הבא' },
    en: { skip: 'Skip to works', works: 'Works', projects: 'Projects', writing: 'Writing', about: 'About', contact: 'Contact', motto: 'Photograph · Tear · Reassemble', talk: 'Get in touch', all: 'All', open: 'View full screen', read: 'Read', photo: 'Photography', cm: 'cm', shop: 'Buy works', shopNote: 'Works are available to purchase through Under 1000 Gallery, Tel Aviv.', shopLink: 'My page at the gallery', noTexts: 'Texts will appear here soon.', langBtn: 'עב', langLabel: 'מעבר לעברית', close: 'Close', prev: 'Previous', next: 'Next' }
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

  const param = new URLSearchParams(location.search).get('lang');
  let lang = ['he', 'en'].includes(param) ? param : (store.get('lang') || 'he');
  let data = null;
  let current = -1;
  let proj = '';        // selected project id, '' = all
  let visible = [];     // indices into data.works currently shown

  const t = (o) => (o && (o[lang] || o.he || o.en)) || '';
  const other = (o) => (o && o[lang === 'he' ? 'en' : 'he']) || '';
  const pad = (n) => String(n).padStart(2, '0');
  const meta = (w) => [t(w.medium), w.size ? `<bdi dir="ltr">${esc(w.size)}</bdi> ${UI[lang].cm}` : '', w.year].filter(Boolean).join(' · ');

  function workHtml(w, i, big, n) {
    const img = `<img src="${esc(w.thumb || w.src)}" alt="${esc(t(w.title))}" width="${w.w || ''}" height="${w.h || ''}" loading="lazy">`;
    if (big) {
      return `<button type="button" class="frame" data-open="${i}" aria-label="${esc(t(w.title))}: ${UI[lang].open}">${img}</button>
        <div class="cap"><span class="n" aria-hidden="true">${pad(n)}</span><h3>${esc(t(w.title))}</h3><p class="alt" lang="${lang === 'he' ? 'en' : 'he'}">${esc(other(w.title))}</p><p class="meta">${meta(w)}</p>
        <button type="button" class="open" data-open="${i}">${UI[lang].open} ${lang === 'he' ? '←' : '→'}</button></div>`;
    }
    return `<div class="work${w.display ? ' sz-' + esc(w.display) : ''}"><button type="button" class="frame" data-open="${i}" aria-label="${esc(t(w.title))}: ${UI[lang].open}">${img}</button>
      <div class="cap-row"><h3>${esc(t(w.title))}</h3><span class="n" aria-hidden="true">${pad(n)}</span></div><p class="sub">${meta(w)}</p></div>`;
  }

  function render() {
    const u = UI[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = `${t(data.artist)} · ${u.photo}`;
    document.querySelectorAll('[data-ui]').forEach((el) => { el.textContent = u[el.dataset.ui]; });
    $('lang').textContent = u.langBtn;
    $('lang').setAttribute('aria-label', u.langLabel);

    document.querySelector('[data-bind="navname"]').innerHTML = `${esc(t(data.artist))}<span class="nav-what"> · ${u.photo}</span>`;
    $('hero-name').innerHTML = t(data.artist).split(' ').map((p) => `<span>${esc(p)}</span>`).join('');
    document.querySelector('[data-bind="tagline"]').textContent = t(data.tagline);
    document.querySelector('[data-bind="quote"]').textContent = t(data.quote);

    const works = data.works || [];
    const heroes = works.map((w, i) => ({ w, i })).filter((x) => x.w.hero).slice(0, 4);
    const strips = heroes.length ? heroes : works.slice(0, 4).map((w, i) => ({ w, i }));
    $('strips').innerHTML = strips.map(({ w, i }) =>
      `<button type="button" class="strip" data-open="${i}" aria-label="${esc(t(w.title))}"><span><img src="${esc(w.thumb || w.src)}" alt=""></span></button>`).join('');

    renderWorks();

    const texts = data.texts || [];
    $('text-list').innerHTML = texts.length
      ? texts.map((x) => `<li><a href="#/text/${encodeURIComponent(x.id)}"><span>${esc(t(x.title))}</span><time>${esc(x.date || '')}</time></a></li>`).join('')
      : '';
    $('nav-writing').hidden = !texts.length;
    $('writing-label').hidden = !texts.length;

    $('portrait').src = data.portrait || '';
    $('portrait').alt = t(data.artist);
    $('portrait').hidden = !data.portrait;
    $('about-body').innerHTML = ((data.about && (data.about[lang] || data.about.he)) || []).map((p) => `<p>${esc(p)}</p>`).join('');

    const c = data.contact || {};
    const arrow = lang === 'he' ? '←' : '→';
    $('nav-ext').innerHTML = [
      c.shop && `<a class="shop" href="${esc(c.shop)}" target="_blank" rel="noopener">${u.shop}</a>`,
      c.instagram && `<a class="icon" href="${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg></a>`,
      c.onex && `<a class="onex" href="${esc(c.onex)}" target="_blank" rel="noopener" dir="ltr">1x</a>`
    ].filter(Boolean).join('');
    $('shop-note').innerHTML = c.shop ? `${u.shopNote} <a href="${esc(c.shop)}" target="_blank" rel="noopener">${u.shopLink} ${arrow}</a>` : '';
    $('foot-links').innerHTML = [
      c.email && `<a href="mailto:${esc(c.email)}" dir="ltr">${esc(c.email)}</a>`,
      `<small dir="ltr">© ${new Date().getFullYear()} ${esc(data.artist.en || '')}</small>`
    ].filter(Boolean).join('');

    $('v-prev').textContent = lang === 'he' ? '→' : '←';
    $('v-next').textContent = lang === 'he' ? '←' : '→';
    $('v-prev').setAttribute('aria-label', u.prev);
    $('v-next').setAttribute('aria-label', u.next);
    $('v-close').setAttribute('aria-label', u.close);
    $('r-close').setAttribute('aria-label', u.close);
    route();
  }

  function closeSub() { $('nav-sub').hidden = true; $('nav-proj-btn').setAttribute('aria-expanded', 'false'); }
  function renderWorks() {
    const works = data.works || [], projects = data.projects || [];
    if (proj && !projects.some((p) => p.id === proj)) proj = '';
    visible = works.map((w, i) => i).filter((i) => !proj || works[i].project === proj);
    $('nav-proj').hidden = !projects.length;
    if (!projects.length) closeSub();
    $('nav-sub').innerHTML = [{ id: '', title: { he: UI.he.all, en: UI.en.all } }, ...projects].map((p) => `<a href="${p.id ? '#/project/' + encodeURIComponent(p.id) : '#works'}" data-goproj="${esc(p.id)}"${p.id === proj ? ' aria-current="true"' : ''}>${esc(t(p.title))}</a>`).join('');
    const cur = projects.find((p) => p.id === proj);
    $('proj-title').textContent = cur ? t(cur.title) : '';
    $('proj-desc').textContent = cur ? t(cur.description) : '';
    $('count').textContent = pad(visible.length);
    let html = '', k = 0, step = 0;
    while (k < visible.length) {
      // each work may set display: 'large' (alone, full width), 'medium' (alone, or beside a small one), 'small' (always beside another); empty = automatic alternation
      const flip = step % 4 >= 2 ? ' flip' : '', i = visible[k], d = works[i].display || '';
      const next = visible[k + 1], dn = next === undefined ? null : (works[next].display || '');
      const canPair = next !== undefined && dn !== 'large';
      const pair = d === 'large' ? false : d === 'small' ? canPair : d === 'medium' ? dn === 'small' : (step % 2 === 1 && canPair);
      if (!pair) {
        html += `<div class="plate plate-one${flip}${d ? ' sz-' + esc(d) : ''}">${workHtml(works[i], i, true, k + 1)}</div>`; k += 1;
      } else {
        html += `<div class="plate plate-two${flip}">${workHtml(works[i], i, false, k + 1)}${workHtml(works[visible[k + 1]], visible[k + 1], false, k + 2)}</div>`; k += 2;
      }
      step += 1;
    }
    $('plates').innerHTML = html;
  }

  /* viewer */
  const step = (d) => { const list = visible.includes(current) ? visible : data.works.map((w, i) => i); const k = list.indexOf(current); show(list[(k + d + list.length) % list.length]); };
  function show(i) {
    const works = data.works;
    current = (i + works.length) % works.length;
    const w = works[current];
    const img = $('v-img');
    img.src = w.thumb || w.src;          // instant, then swap in the full file
    const full = new Image();
    full.onload = () => { if (data.works[current] === w) img.src = w.src; };
    full.src = w.src;
    img.alt = t(w.title);
    $('v-num').textContent = pad((visible.includes(current) ? visible.indexOf(current) : current) + 1);
    $('v-title').textContent = t(w.title);
    $('v-meta').innerHTML = meta(w);
    if (!$('viewer').open) $('viewer').showModal();
    history.replaceState(null, '', `#/work/${encodeURIComponent(w.id)}`);
  }
  function showText(id) {
    const x = (data.texts || []).find((y) => y.id === id);
    if (!x) return;
    const w = x.image && data.works.find((y) => y.id === x.image);
    const paras = t(x.body).split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${esc(p.trim())}</p>`);
    const fig = w ? `<figure><img src="${esc(w.src)}" alt="${esc(t(w.title))}" loading="lazy"><figcaption>${esc(t(w.title))}</figcaption></figure>` : '';
    if (fig) paras.splice(Math.min(1, paras.length), 0, fig);
    $('r-body').innerHTML = `<h1>${esc(t(x.title))}</h1><time>${esc(x.date || '')}</time>${paras.join('')}`;
    if (!$('reader').open) $('reader').showModal();
    $('reader').scrollTop = 0;
  }
  function route() {
    const m = location.hash.match(/^#\/(work|text|project)\/(.+)$/);
    if (!m || !data) return;
    const id = decodeURIComponent(m[2]);
    if (m[1] === 'project') { if (proj !== id) { proj = id; renderWorks(); $('works').scrollIntoView(); } }
    else if (m[1] === 'work') { const i = data.works.findIndex((w) => w.id === id); if (i >= 0) show(i); }
    else showText(id);
  }
  const clearHash = (anchor) => { if (location.hash.startsWith('#/')) history.replaceState(null, '', anchor === '#works' && proj ? `#/project/${encodeURIComponent(proj)}` : anchor); };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-proj')) closeSub();
    const el = e.target.closest('[data-open]');
    if (el) { show(Number(el.dataset.open)); return; }
    const g = e.target.closest('[data-goproj]');
    if (g) { e.preventDefault(); proj = g.dataset.goproj; renderWorks(); closeSub(); history.replaceState(null, '', proj ? `#/project/${encodeURIComponent(proj)}` : '#works'); $('works').scrollIntoView(); return; }

  });
  $('v-prev').onclick = () => step(-1);
  $('v-next').onclick = () => step(1);
  $('v-close').onclick = () => $('viewer').close();
  $('r-close').onclick = () => $('reader').close();
  $('viewer').addEventListener('close', () => clearHash('#works'));
  $('reader').addEventListener('close', () => clearHash('#writing'));
  $('viewer').addEventListener('click', (e) => { if (e.target === $('viewer')) $('viewer').close(); });
  $('viewer').addEventListener('keydown', (e) => {
    const fwd = lang === 'he' ? 'ArrowLeft' : 'ArrowRight', back = lang === 'he' ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd) step(1);
    if (e.key === back) step(-1);
  });
  let touchX = null;
  $('viewer').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('viewer').addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) < 50) return;
    const fwd = lang === 'he' ? dx > 0 : dx < 0;
    step(fwd ? 1 : -1);
  });
  window.addEventListener('hashchange', route);

  $('nav-proj-btn').onclick = () => { const open = $('nav-sub').hidden; $('nav-sub').hidden = !open; $('nav-proj-btn').setAttribute('aria-expanded', String(open)); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSub(); });
  $('lang').onclick = () => { lang = lang === 'he' ? 'en' : 'he'; store.set('lang', lang); render(); };

  /* torn strips drift sideways as the page scrolls */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 1200);
        document.querySelectorAll('.strip').forEach((s, k) => { s.style.transform = `translateX(${(k % 2 ? 1 : -1) * y * 0.035 * (k + 1)}px)`; });
        ticking = false;
      });
    }, { passive: true });
  }

  fetch('content/site.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { data = d; render(); })
    .catch(() => { $('hero-name').textContent = 'תמיר שורץ'; });
})();
