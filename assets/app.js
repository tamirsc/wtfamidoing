(() => {
  'use strict';

  const UI = {
    he: { skip: 'דלג לעבודות', works: 'עבודות', writing: 'טקסטים', about: 'אודות', contact: 'קשר', motto: 'צילום · קריעה · הרכבה מחדש', talk: 'דברו איתי', open: 'לצפייה במסך מלא', read: 'לקריאה', photo: 'צילום', cm: 'ס״מ', shop: 'רכישת עבודות', noTexts: 'טקסטים יתווספו כאן בקרוב.', langBtn: 'EN', langLabel: 'Switch to English', close: 'סגירה', prev: 'הקודם', next: 'הבא' },
    en: { skip: 'Skip to works', works: 'Works', writing: 'Writing', about: 'About', contact: 'Contact', motto: 'Photograph · Tear · Reassemble', talk: 'Get in touch', open: 'View full screen', read: 'Read', photo: 'Photography', cm: 'cm', shop: 'Buy prints', noTexts: 'Texts will appear here soon.', langBtn: 'עב', langLabel: 'מעבר לעברית', close: 'Close', prev: 'Previous', next: 'Next' }
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

  const param = new URLSearchParams(location.search).get('lang');
  let lang = ['he', 'en'].includes(param) ? param : (store.get('lang') || 'he');
  let data = null;
  let current = -1;

  const t = (o) => (o && (o[lang] || o.he || o.en)) || '';
  const other = (o) => (o && o[lang === 'he' ? 'en' : 'he']) || '';
  const pad = (n) => String(n).padStart(2, '0');
  const meta = (w) => [t(w.medium), w.size ? `<bdi dir="ltr">${esc(w.size)}</bdi> ${UI[lang].cm}` : '', w.year].filter(Boolean).join(' · ');

  function workHtml(w, i, big) {
    const img = `<img src="${esc(w.thumb || w.src)}" alt="${esc(t(w.title))}" width="${w.w || ''}" height="${w.h || ''}" loading="lazy">`;
    if (big) {
      return `<button type="button" class="frame" data-open="${i}" aria-label="${esc(t(w.title))}: ${UI[lang].open}">${img}<span class="num" aria-hidden="true">${pad(i + 1)}</span></button>
        <div class="cap"><h3>${esc(t(w.title))}</h3><p class="alt" lang="${lang === 'he' ? 'en' : 'he'}">${esc(other(w.title))}</p><p class="meta">${meta(w)}</p>
        <button type="button" class="open" data-open="${i}">${UI[lang].open} ${lang === 'he' ? '←' : '→'}</button></div>`;
    }
    return `<div class="work"><button type="button" class="frame" data-open="${i}" aria-label="${esc(t(w.title))}: ${UI[lang].open}">${img}</button>
      <div class="cap-row"><h3>${esc(t(w.title))}</h3><span class="n" aria-hidden="true">${pad(i + 1)}</span></div><p class="sub">${meta(w)}</p></div>`;
  }

  function render() {
    const u = UI[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = `${t(data.artist)} · ${u.photo}`;
    document.querySelectorAll('[data-ui]').forEach((el) => { el.textContent = u[el.dataset.ui]; });
    $('lang').textContent = u.langBtn;
    $('lang').setAttribute('aria-label', u.langLabel);

    document.querySelector('[data-bind="navname"]').textContent = `${t(data.artist)} · ${u.photo}`;
    $('hero-name').innerHTML = t(data.artist).split(' ').map((p) => `<span>${esc(p)}</span>`).join('');
    document.querySelector('[data-bind="tagline"]').textContent = t(data.tagline);
    document.querySelector('[data-bind="quote"]').textContent = t(data.quote);

    const works = data.works || [];
    const heroes = works.map((w, i) => ({ w, i })).filter((x) => x.w.hero).slice(0, 4);
    const strips = heroes.length ? heroes : works.slice(0, 4).map((w, i) => ({ w, i }));
    $('strips').innerHTML = strips.map(({ w, i }) =>
      `<button type="button" class="strip" data-open="${i}" aria-label="${esc(t(w.title))}"><span><img src="${esc(w.thumb || w.src)}" alt=""></span></button>`).join('');

    $('count').textContent = pad(works.length);
    let html = '', i = 0, step = 0;
    while (i < works.length) {
      const flip = step % 4 >= 2 ? ' flip' : '';
      if (step % 2 === 0 || i === works.length - 1) {
        html += `<div class="plate plate-one${flip}">${workHtml(works[i], i, true)}</div>`; i += 1;
      } else {
        html += `<div class="plate plate-two${flip}">${workHtml(works[i], i)}${workHtml(works[i + 1], i + 1)}</div>`; i += 2;
      }
      step += 1;
    }
    $('plates').innerHTML = html;

    const texts = data.texts || [];
    $('text-list').innerHTML = texts.length
      ? texts.map((x) => `<li><a href="#/text/${encodeURIComponent(x.id)}"><span>${esc(t(x.title))}</span><time>${esc(x.date || '')}</time></a></li>`).join('')
      : `<li class="empty">${u.noTexts}</li>`;

    $('portrait').src = data.portrait || '';
    $('portrait').alt = t(data.artist);
    $('portrait').hidden = !data.portrait;
    $('about-body').innerHTML = ((data.about && (data.about[lang] || data.about.he)) || []).map((p) => `<p>${esc(p)}</p>`).join('');

    const c = data.contact || {};
    $('talk').href = c.email ? `mailto:${c.email}` : '#contact';
    $('foot-links').innerHTML = [
      c.email && `<a href="mailto:${esc(c.email)}" dir="ltr">${esc(c.email)}</a>`,
      c.instagram && `<a href="${esc(c.instagram)}" target="_blank" rel="noopener">Instagram</a>`,
      c.shop && `<a href="${esc(c.shop)}" target="_blank" rel="noopener">${u.shop}</a>`,
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

  /* viewer */
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
    $('v-num').textContent = pad(current + 1);
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
    const m = location.hash.match(/^#\/(work|text)\/(.+)$/);
    if (!m || !data) return;
    const id = decodeURIComponent(m[2]);
    if (m[1] === 'work') { const i = data.works.findIndex((w) => w.id === id); if (i >= 0) show(i); }
    else showText(id);
  }
  const clearHash = (anchor) => { if (location.hash.startsWith('#/')) history.replaceState(null, '', anchor); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open]');
    if (el) show(Number(el.dataset.open));
  });
  $('v-prev').onclick = () => show(current - 1);
  $('v-next').onclick = () => show(current + 1);
  $('v-close').onclick = () => $('viewer').close();
  $('r-close').onclick = () => $('reader').close();
  $('viewer').addEventListener('close', () => clearHash('#works'));
  $('reader').addEventListener('close', () => clearHash('#writing'));
  $('viewer').addEventListener('click', (e) => { if (e.target === $('viewer')) $('viewer').close(); });
  $('viewer').addEventListener('keydown', (e) => {
    const fwd = lang === 'he' ? 'ArrowLeft' : 'ArrowRight', back = lang === 'he' ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd) show(current + 1);
    if (e.key === back) show(current - 1);
  });
  let touchX = null;
  $('viewer').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('viewer').addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) < 50) return;
    const fwd = lang === 'he' ? dx > 0 : dx < 0;
    show(current + (fwd ? 1 : -1));
  });
  window.addEventListener('hashchange', route);

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
