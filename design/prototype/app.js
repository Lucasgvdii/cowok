/* Tirada — prototipo estático del dashboard (vanilla JS, sin build) */
(function () {
  'use strict';

  /* ---------------- utilidades ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const ic = (n, c = '') => `<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const nf = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
  const fmt = (n) => nf.format(n);
  const pct = (n, d = 1) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' %';
  const eur = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
  const av = (ini, color, sm) => `<span class="avatar${sm ? ' sm' : ''}" style="background:${color}" title="${ini}">${ini}</span>`;

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = ic('check') + '<span></span>';
    t.lastChild.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  // PRNG determinista para datos falsos estables
  function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

  /* ---------------- mobile gate ---------------- */
  const gateMQ = window.matchMedia('(max-width: 1023.98px), (pointer: coarse) and (max-width: 1023.98px)');
  function applyGate() {
    const gated = gateMQ.matches;
    document.documentElement.classList.toggle('is-gated', gated);
    $('#app').toggleAttribute('inert', gated);
    $('#app').setAttribute('aria-hidden', gated ? 'true' : 'false');
    if (gated) closePalette();
  }
  gateMQ.addEventListener ? gateMQ.addEventListener('change', applyGate) : gateMQ.addListener(applyGate);

  $('[data-gate-email]').addEventListener('click', () => toast('Te hemos enviado el enlace a lucia@labrujula.tech'));
  $('[data-gate-copy]').addEventListener('click', () => {
    const url = location.href;
    const done = () => toast('Enlace copiado');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, () => fallbackCopy(url, done));
    } else fallbackCopy(url, done);
  });
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* sin portapapeles */ }
    ta.remove(); done();
  }

  /* ---------------- datos ---------------- */
  const PUB = { name: 'La Brújula Tech', subs: 48213 };
  const POSTS = [
    { t: 'El fin del clic gratis', d: '13 oct', sent: 47980, open: 42.6, ctr: 9.8, st: 'Enviado', rev: 410 },
    { t: 'Lo que la IA no te va a contar de tu stack', d: '9 oct', sent: 47702, open: 40.9, ctr: 8.1, st: 'Enviado', rev: 380 },
    { t: 'Especial: 50 herramientas que usamos de verdad', d: '6 oct', sent: 47511, open: 44.2, ctr: 12.7, st: 'Enviado', rev: 620 },
    { t: 'Entrevista: Marta Gil (Fintual) sobre producto', d: '2 oct', sent: 47290, open: 39.4, ctr: 6.9, st: 'Enviado', rev: 290 },
    { t: 'Por qué tu startup no necesita Kubernetes', d: '29 sept', sent: 47011, open: 41.1, ctr: 7.6, st: 'Enviado', rev: 350 },
  ];
  const SUBSCRIBERS = [
    ['Ana Torres', 'ana.torres@gmail.com', 'Recomendación · Código Abierto', 'Premium', 94, 'hoy', '12 mar 2024'],
    ['Javier Ruiz', 'jruiz@outlook.com', 'Formulario web · /inicio', 'Free', 81, 'ayer', '3 ago 2025'],
    ['Camila Herrera', 'camila@herrera.co', 'Referido · Paula M.', 'Fundador', 98, 'hoy', '19 ene 2023'],
    ['Marc Puig', 'marc.puig@icloud.com', 'Link-in-bio · X', 'Free', 62, 'hace 6 días', '28 sept 2025'],
    ['Lucía Fernández', 'lucia.f@yahoo.es', 'Importación · Substack', 'Premium', 77, 'hace 2 días', '15 may 2024'],
    ['Diego Salas', 'diego@salas.dev', 'Ad network · Boost', 'Free', 45, 'hace 19 días', '1 oct 2025'],
    ['Valentina Rojas', 'vrojas@gmail.com', 'Pop-up · artículo', 'Free', 88, 'hoy', '22 jun 2025'],
    ['Pablo Ortega', 'pablo.ortega@empresa.com', 'API · webinar Hubspot', 'Free', 23, 'hace 41 días', '9 abr 2025'],
    ['Sofía Medina', 'sofi.medina@proton.me', 'Recomendación · Datos con Café', 'Premium', 91, 'ayer', '30 nov 2024'],
    ['Andrés Castillo', 'acastillo@gmail.com', 'Formulario web · /premium', 'Free', 56, 'hace 4 días', '17 jul 2025'],
    ['Elena Navarro', 'elena@navarro.studio', 'Referido · Ana T.', 'Free', 70, 'hace 3 días', '5 sept 2025'],
  ];

  /* ---------------- vistas ---------------- */
  const views = {};

  /* ===== 1. Inicio ===== */
  views.inicio = {
    title: 'Inicio',
    html() {
      const top = [
        ['Recomendaciones', 412], ['Formularios web', 358], ['Referidos', 241], ['Ad network (Boost)', 166], ['Link-in-bio', 107],
      ];
      const max = 412;
      return `
      <div class="page-head">
        <div><h1>Buenos días, Lucía</h1><p class="sub">Último envío: martes 13 oct · «El fin del clic gratis» · 47.980 destinatarios</p></div>
        <div class="actions">
          <div class="seg" role="group" aria-label="Rango"><button aria-pressed="false">7 días</button><button aria-pressed="true">30 días</button><button aria-pressed="false">90 días</button></div>
          <button class="btn">${ic('download')}Exportar</button>
        </div>
      </div>

      <div class="kpis">
        <div class="card kpi hero">
          <div class="k-label">${ic('zap')}Clics humanos verificados · 30 días</div>
          <div class="k-val num">18.420</div>
          <div class="k-foot"><span class="delta-up">▲ 12,4 %</span> vs. 30 días anteriores</div>
          <div class="k-foot"><span class="badge">${ic('shield')}6.312 clics de bots y escáneres excluidos</span></div>
        </div>
        <div class="card kpi">
          <div class="k-label">${ic('users')}Suscriptores</div>
          <div class="k-val">48.213</div>
          <div class="k-foot"><span class="delta-up">+1.284</span> netos · 412 bajas</div>
        </div>
        <div class="card kpi">
          <div class="k-label">${ic('eye')}Aperturas verificadas</div>
          <div class="k-val">41,2 %</div>
          <div class="k-foot">Brutas: 63,8 % <span class="muted">(MPP + escáneres)</span></div>
          <div class="split-bar" aria-label="41,2 % verificadas, 22,6 % infladas">
            <span style="width:41.2%;background:var(--series-1)"></span><span style="width:22.6%;background:var(--series-muted)"></span><span style="flex:1;background:var(--surface-sunken)"></span>
          </div>
        </div>
        <div class="card kpi">
          <div class="k-label">${ic('coin')}Ingresos recurrentes (MRR)</div>
          <div class="k-val">6.840 €</div>
          <div class="k-foot"><span class="delta-up">▲ 4,1 %</span> · 1.142 de pago</div>
        </div>
        <div class="card kpi">
          <div class="k-label">${ic('alert')}Tasa de quejas</div>
          <div class="k-val">0,021 %</div>
          <div class="k-foot"><span class="badge good">${ic('check')}Bajo el umbral de 0,1 %</span></div>
        </div>
      </div>

      <div class="grid g-main-side" style="margin-bottom:var(--s-5)">
        <section class="card">
          <div class="card-h"><h2>Clics por día</h2>
            <div class="right legend"><span><i style="background:var(--series-1)"></i>Humanos verificados</span><span><i style="background:var(--series-muted)"></i>Brutos (incluye bots)</span></div>
          </div>
          <div class="card-b"><div class="chart-wrap" id="chart"></div></div>
        </section>
        <section class="card">
          <div class="card-h"><h2>Para hoy</h2></div>
          <div class="card-b" style="padding-top:6px;padding-bottom:6px">
            <ul class="plain agenda">
              <li><span class="when">10:00</span><div><b>Borrador #142 listo para revisar</b><div class="muted">Diego dejó 2 comentarios · preflight con 1 aviso</div></div></li>
              <li><span class="when">Hoy</span><div><b>3 ofertas nuevas en la ad network</b><div class="muted">Hasta 2.150 € garantizados · <a href="#/monetizacion">ver</a></div></div></li>
              <li><span class="when">Aviso</span><div><b>BIMI sin certificado VMC</b><div class="muted">Tu logo aún no aparece en Gmail · <a href="#/entregabilidad">arreglar</a></div></div></li>
              <li><span class="when">Vie</span><div><b>Envío programado: «Resumen semanal»</b><div class="muted">Viernes 17 oct, 07:30 (hora del lector)</div></div></li>
            </ul>
          </div>
        </section>
      </div>

      <div class="grid g-main-side">
        <section class="card">
          <div class="card-h"><h2>Posts recientes</h2><div class="right"><a class="btn sm ghost" href="#/editor">Ver todos ${ic('chev-r')}</a></div></div>
          <div class="post-row head"><span>Post</span><span class="r">Enviados</span><span class="r">Apert. verif.</span><span class="r">CTR verif.</span><span class="r">Ingresos</span></div>
          ${POSTS.map((p) => `<div class="post-row"><div><div class="title">${p.t}</div><div class="cell-sub">${p.d} · ${p.st}</div></div><span class="r">${fmt(p.sent)}</span><span class="r">${pct(p.open)}</span><span class="r"><b>${pct(p.ctr)}</b></span><span class="r">${eur(p.rev)}</span></div>`).join('')}
        </section>
        <section class="card">
          <div class="card-h"><h2>Fuentes de crecimiento</h2><span class="right muted">30 días · altas netas</span></div>
          <div class="card-b stack" style="gap:14px">
            ${top.map(([n, v]) => `<div><div class="row" style="margin-bottom:6px"><span>${n}</span><span class="spacer"></span><b class="num">${fmt(v)}</b></div><div class="meter accent"><span style="width:${(v / max) * 100}%"></span></div></div>`).join('')}
            <div class="callout">${ic('info')}<span>Cada suscriptor guarda su fuente de adquisición. Las altas detectadas como bot (2.904 este mes) no cuentan.</span></div>
          </div>
        </section>
      </div>`;
    },
    mount() { drawChart($('#chart')); },
  };

  function drawChart(el) {
    const r = rng(42);
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(2026, 8, 16 + i);
      const dow = d.getDay();
      const sendDay = dow === 2 || dow === 5;
      const base = sendDay ? 1050 + r() * 450 : (dow === 3 || dow === 6 ? 520 + r() * 180 : 210 + r() * 120);
      const v = Math.round(base * (1 + i * 0.006));
      days.push({ d, v, raw: Math.round(v * (1.28 + r() * 0.22) + (sendDay ? 260 : 60)) });
    }
    const W = 760, H = 300, P = { l: 44, r: 12, t: 12, b: 28 };
    const maxY = 2500;
    const x = (i) => P.l + (i * (W - P.l - P.r)) / (days.length - 1);
    const y = (v) => P.t + (H - P.t - P.b) * (1 - v / maxY);
    const line = (k) => days.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
    const ticks = [0, 500, 1000, 1500, 2000, 2500];
    const dfmt = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Clics por día en los últimos 30 días: humanos verificados frente a brutos">
        ${ticks.map((t) => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--grid)" stroke-width="1"/><text x="${P.l - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)">${fmt(t)}</text>`).join('')}
        ${days.map((p, i) => (i % 5 === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${dfmt(p.d)}</text>` : '')).join('')}
        <path d="${line('v')}L${x(29)},${y(0)}L${x(0)},${y(0)}Z" fill="var(--series-1)" opacity=".08"/>
        <path d="${line('raw')}" fill="none" stroke="var(--series-muted)" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round"/>
        <path d="${line('v')}" fill="none" stroke="var(--series-1)" stroke-width="2.25" stroke-linejoin="round"/>
        <g id="ch-hover" style="opacity:0">
          <line id="ch-x" y1="${P.t}" y2="${H - P.b}" stroke="var(--ink-3)" stroke-width="1"/>
          <circle id="ch-d1" r="4.5" fill="var(--series-1)" stroke="var(--surface)" stroke-width="2"/>
          <circle id="ch-d2" r="4" fill="var(--series-muted)" stroke="var(--surface)" stroke-width="2"/>
        </g>
        <rect x="${P.l}" y="0" width="${W - P.l - P.r}" height="${H}" fill="transparent" id="ch-hit"/>
      </svg>
      <div class="chart-tip" id="ch-tip"></div>`;
    const svg = $('svg', el), hit = $('#ch-hit', el), tip = $('#ch-tip', el), g = $('#ch-hover', el);
    hit.addEventListener('mousemove', (e) => {
      const rect = svg.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * W;
      const i = Math.max(0, Math.min(29, Math.round(((sx - P.l) / (W - P.l - P.r)) * 29)));
      const p = days[i];
      $('#ch-x', el).setAttribute('x1', x(i)); $('#ch-x', el).setAttribute('x2', x(i));
      $('#ch-d1', el).setAttribute('cx', x(i)); $('#ch-d1', el).setAttribute('cy', y(p.v));
      $('#ch-d2', el).setAttribute('cx', x(i)); $('#ch-d2', el).setAttribute('cy', y(p.raw));
      g.style.opacity = 1;
      tip.innerHTML = `${p.d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}<br>Verificados <b>${fmt(p.v)}</b> · Brutos <b>${fmt(p.raw)}</b>`;
      tip.style.left = (x(i) / W) * rect.width + 'px';
      tip.style.top = (y(p.v) / H) * rect.height + 'px';
      tip.style.opacity = 1;
    });
    hit.addEventListener('mouseleave', () => { g.style.opacity = 0; tip.style.opacity = 0; });
  }

  /* ===== 2. Editor ===== */
  const SIMS = {
    ana: { name: 'Ana', tier: 'premium', label: 'Ana Torres · Premium · Madrid' },
    javier: { name: 'Javier', tier: 'free', label: 'Javier Ruiz · Free · Bogotá' },
    none: { name: null, tier: 'free', label: 'Sin nombre (probar fallback)' },
  };
  let sim = 'ana';
  views.editor = {
    title: 'Editor', full: true,
    html() {
      return `
      <div class="editor">
        <aside class="ed-left">
          <div class="side-h">Estructura</div>
          <ul class="plain outline">
            <li class="on">${ic('heading')}El fin del clic gratis</li>
            <li class="l2">Qué ha cambiado</li>
            <li class="l2">Los números de octubre</li>
            <li class="l2">${ic('poll')}Encuesta</li>
            <li class="l2">${ic('lock')}Solo premium: el plan</li>
          </ul>
          <div class="side-h">Autores</div>
          <div class="stack" style="gap:8px">
            <div class="row">${av('LM', '#7c3aed', 1)}<span>Lucía Marín</span></div>
            <div class="row">${av('DS', '#2563eb', 1)}<span>Diego Salas</span><span class="badge outline" style="margin-left:auto">invitado</span></div>
            <button class="btn sm ghost" style="justify-content:flex-start">${ic('plus')}Añadir autor</button>
          </div>
          <div class="side-h">Plantilla</div>
          <div class="rp-sec" style="padding:12px">
            <b>Brújula semanal</b><div class="hint">Newsreader 18 · bermellón · márgenes 64</div>
            <div class="row" style="margin-top:8px;gap:6px"><span class="dot" style="background:#c2410c;width:14px;height:14px"></span><span class="dot" style="background:#1b1a17;width:14px;height:14px"></span><span class="dot" style="background:#f4ecdf;width:14px;height:14px;box-shadow:inset 0 0 0 1px var(--border)"></span></div>
          </div>
          <div class="side-h">Historial</div>
          <ul class="plain" style="font-size:var(--fs-sm);display:flex;flex-direction:column;gap:6px">
            <li class="muted">Hace 3 s · autoguardado</li>
            <li class="muted">10:42 · Diego editó «Los números…»</li>
            <li class="muted">09:15 · Lucía creó el borrador</li>
          </ul>
        </aside>

        <section class="ed-center">
          <div class="ed-toolbar">
            <button class="btn sm ghost icon" aria-label="Deshacer">${ic('undo')}</button>
            <button class="btn sm ghost icon" aria-label="Rehacer">${ic('redo')}</button>
            <span class="sep"></span>
            <button class="btn sm ghost">Párrafo ${ic('chev')}</button>
            <button class="btn sm ghost icon" aria-label="Negrita">${ic('bold')}</button>
            <button class="btn sm ghost icon" aria-label="Cursiva">${ic('italic')}</button>
            <button class="btn sm ghost icon" aria-label="Enlace">${ic('link')}</button>
            <span class="sep"></span>
            <button class="btn sm ghost" data-ai-write title="Escribir con IA (reescribir, traducir, corregir)">${ic('sparkle')}IA</button>
            <span class="saved">${ic('check')}Guardado</span>
            <span class="spacer"></span>
            <div class="avatars" title="Editando ahora">${av('LM', '#7c3aed', 1)}${av('DS', '#2563eb', 1)}${av('RP', '#0f766e', 1)}</div>
            <button class="btn sm" data-tab-open="comentarios">${ic('comment')}3</button>
            <a class="btn sm primary" href="#/enviar">Enviar ${ic('chev-r')}</a>
          </div>

          <article class="doc" id="doc">
            <div class="kicker">Edición #142 · Martes</div>
            <h1>El fin del clic gratis</h1>
            <p class="dek">Gmail, Apple y Yahoo están cambiando cómo medimos el email. Esto es lo que significa para ti.</p>
            <div class="byline">${av('LM', '#7c3aed', 1)} Lucía Marín y Diego Salas · 6 min de lectura</div>

            <div class="blk"><span class="handle">${ic('plus')}${ic('grip')}</span>
              <p>Hola <span class="mt" data-mt>{{ nombre | "lector" }}</span>, esta semana toca hablar de algo incómodo: <span class="remote-sel">la mitad de las aperturas que celebrabas eran de robots</span><span class="rcaret"><span class="cursor-tag" style="background:#2563eb">Diego</span></span>. Apple Mail Privacy Protection abre todos los correos por ti, y los escáneres corporativos hacen clic en cada enlace.</p>
            </div>

            <div class="blk" style="position:relative" id="slash-blk"><span class="handle">${ic('plus')}${ic('grip')}</span>
              <p class="typing">/enc<span class="caret"></span></p>
              <div class="slash" id="slash" role="listbox" aria-label="Insertar bloque">
                <div class="grp">Bloques</div>
                <div class="it active" role="option" aria-selected="true"><span class="ic">${ic('poll')}</span><div>Encuesta<small>Pregunta con opciones; resultados en vivo</small></div><kbd>↵</kbd></div>
                <div class="it" role="option"><span class="ic">${ic('heading')}</span><div>Encabezado<small>Título de sección con ancla</small></div></div>
                <div class="it" role="option"><span class="ic">${ic('columns')}</span><div>Columnas<small>2 o 3 columnas, alineación vertical</small></div></div>
                <div class="grp">IA</div>
                <div class="it" role="option"><span class="ic">${ic('sparkle')}</span><div>Encuesta sugerida por IA<small>A partir del texto del post</small></div></div>
              </div>
            </div>

            <h2>Qué ha cambiado</h2>
            <div class="blk"><span class="handle">${ic('plus')}${ic('grip')}</span>
              <p>Desde este mes, en Tirada medimos el <strong>clic humano verificado</strong>: excluimos escáneres de seguridad, prefetch y patrones de bot. Es un número más pequeño, pero <span class="comment-hl" data-tab-open="comentarios">es el único que se correlaciona con ventas</span>.</p>
            </div>

            <figure class="blk"><span class="handle">${ic('plus')}${ic('grip')}</span>
              <div class="img-ph">${ic('image')}</div>
              <figcaption><em>Fig. 1</em> — Aperturas brutas vs. verificadas en las últimas 12 ediciones. Alt: «Gráfico de barras comparando aperturas».</figcaption>
            </figure>

            <h2>Los números de octubre</h2>
            <div class="cols blk">
              <div><h4>Antes</h4>63,8 % de aperturas, 2,1 % de CTR. Bonito para el media kit, inútil para decidir.</div>
              <div><h4>Ahora</h4>41,2 % verificadas y 9,8 % de clics humanos. Menos vanidad, más señal.</div>
            </div>

            <div class="poll blk"><div class="q">¿Qué métrica miras primero al enviar?</div>
              <div class="opt"><span class="fill" style="width:46%"></span><span>Aperturas</span><b>46 %</b></div>
              <div class="opt"><span class="fill" style="width:38%"></span><span>Clics</span><b>38 %</b></div>
              <div class="opt"><span class="fill" style="width:16%"></span><span>Ingresos</span><b>16 %</b></div>
            </div>

            <div class="adslot blk sel" data-blk="ad"><span class="cond badge info">${ic('eye')}Solo free · email + web</span>
              <div class="logo">N</div><div><small>Patrocinado</small><div style="font-weight:600">Northwind Cloud — despliega en 30 s, sin YAML.</div><div class="muted" style="font-size:13px">Prueba gratis 60 días con el código BRUJULA</div></div>
            </div>

            <div class="paywall">${ic('lock')} Corte de pago · lo de abajo es solo premium</div>

            <div class="blk premium-only"><span class="cond badge accent">${ic('lock')}Premium</span>
              <h2 style="margin-top:0">Solo premium: el plan</h2>
              <p><span class="mt" data-mt>{{ nombre | "lector" }}</span>, aquí van los tres cambios que hemos hecho en nuestro media kit y la plantilla exacta que enviamos a anunciantes.</p>
            </div>
          </article>
        </section>

        <aside class="ed-right">
          <div style="padding:var(--s-4) var(--s-4) 0">
            <div class="rp-sec">
              <h4>${ic('mail')}Tamaño del email<span class="right badge good">${ic('check')}Seguro</span></h4>
              <div class="row"><b class="num" style="font-size:20px">64 KB</b><span class="muted">/ 102 KB límite de Gmail</span></div>
              <div class="gauge" role="meter" aria-valuemin="0" aria-valuemax="102" aria-valuenow="64" aria-label="Tamaño del email"><span class="fill" style="width:62.7%"></span><span class="mark" style="left:88%" title="Aviso a 90 KB"></span></div>
              <div class="gauge-legend"><span>0</span><span>aviso 90 KB</span><span>102 KB</span></div>
            </div>
          </div>
          <div class="tabs" role="tablist" style="padding:0 var(--s-4);margin-top:var(--s-3)">
            <button class="tab" role="tab" data-tab="preview" aria-selected="true">Vista previa</button>
            <button class="tab" role="tab" data-tab="bloque" aria-selected="false">Visibilidad</button>
            <button class="tab" role="tab" data-tab="preflight" aria-selected="false">Preflight <span class="badge warn">1</span></button>
            <button class="tab" role="tab" data-tab="comentarios" aria-selected="false" aria-label="Comentarios" title="Comentarios">${ic('comment')} 3</button>
          </div>
          <div class="rp-body" id="rp"></div>
        </aside>
      </div>`;
    },
    mount() {
      const tabs = $$('.ed-right .tab');
      const show = (name) => {
        tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === name));
        $('#rp').innerHTML = edPanels[name]();
        if (name === 'preview') bindPreview();
      };
      tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
      $$('[data-tab-open]').forEach((b) => b.addEventListener('click', () => show(b.dataset.tabOpen)));
      $$('.doc .blk').forEach((b) => b.addEventListener('click', () => {
        $$('.doc .blk.sel').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
      }));
      $('[data-ai-write]').addEventListener('click', () => openPalette('Reescribe la introducción más corta y directa'));
      document.addEventListener('click', hideSlash, true);
      show('preview');
      applySim();
    },
    unmount() { document.removeEventListener('click', hideSlash, true); },
  };
  function hideSlash(e) { const s = $('#slash'); if (s && !s.contains(e.target)) { s.remove(); const t = $('#slash-blk .typing'); if (t) t.innerHTML = '<span class="muted">Escribe «/» para insertar un bloque</span>'; } }

  function applySim() {
    const s = SIMS[sim];
    $$('[data-mt]').forEach((m) => {
      m.textContent = s.name || 'lector';
      m.classList.add('resolved');
      m.title = '{{ nombre | "lector" }}';
    });
  }

  const edPanels = {
    preview() {
      const s = SIMS[sim];
      return `
        <div class="row" style="justify-content:space-between">
          <div class="seg" role="group" aria-label="Canal"><button aria-pressed="true" data-ch="email">${ic('mail')}Email</button><button aria-pressed="false" data-ch="web">${ic('monitor')}Web</button><button aria-pressed="false" data-ch="audio">${ic('headphones')}Audio</button></div>
        </div>
        <div class="field">
          <label for="sim">Suscriptor simulado (merge tags)</label>
          <select class="select" id="sim">${Object.entries(SIMS).map(([k, v]) => `<option value="${k}"${k === sim ? ' selected' : ''}>${v.label}</option>`).join('')}</select>
          <span class="hint">Las etiquetas y bloques condicionales se resuelven como los vería esta persona.</span>
        </div>
        <div id="pv">${previewHTML('email', s)}</div>`;
    },
    bloque() {
      return `
        <div class="rp-sec">
          <h4>${ic('megaphone')}Bloque seleccionado: Anuncio</h4>
          <div class="hint" style="margin-bottom:12px">Northwind Cloud · oferta de la ad network · 32 € CPM</div>
          <div class="label" style="margin-bottom:6px">Canales</div>
          <div class="row wrap" style="margin-bottom:14px"><button class="chip" aria-pressed="true">${ic('mail')}Email</button><button class="chip" aria-pressed="true">${ic('monitor')}Web</button><button class="chip" aria-pressed="false">${ic('headphones')}Audio</button></div>
          <div class="label" style="margin-bottom:6px">Nivel</div>
          <div class="row wrap" style="margin-bottom:14px"><button class="chip" aria-pressed="true">Free</button><button class="chip" aria-pressed="false">Premium</button><button class="chip" aria-pressed="false">Fundador</button></div>
          <div class="label" style="margin-bottom:6px">Segmentos</div>
          <div class="cond-group" style="margin-bottom:14px;font-size:var(--fs-sm)">
            <div class="row"><span class="badge bad">${ic('x')}excluir</span>Compraron «Curso de growth»</div>
          </div>
          <div class="label" style="margin-bottom:6px">Cohorte del envío</div>
          <div class="seg" role="group"><button aria-pressed="true">Todas</button><button aria-pressed="false">Solo A</button><button aria-pressed="false">Solo B</button></div>
        </div>
        <div class="callout">${ic('info')}<span>Un solo documento, muchas salidas: las condiciones viven en el bloque y cada renderer (email, web, audio, API) las respeta.</span></div>
        <div class="rp-sec"><h4>Así verán este bloque</h4>
          <div class="check"><span class="ci good">${ic('check')}</span>Javier (free, email) — lo ve</div>
          <div class="check"><span class="ci bad">${ic('x')}</span>Ana (premium) — oculto</div>
          <div class="check"><span class="ci bad">${ic('x')}</span>Versión audio — omitido</div>
        </div>`;
    },
    preflight() {
      const items = [
        ['good', 'Tamaño del email 64 KB (sin recorte de Gmail)'],
        ['good', '23 enlaces comprobados, 0 rotos'],
        ['warn', 'Falta texto alternativo en 1 imagen', 'Añadir'],
        ['good', 'Merge tags con fallback'],
        ['good', 'Spam score 0,8 / 10'],
        ['good', 'Contraste de texto AA en modo oscuro'],
        ['good', 'Vídeo e iframes ocultos en la versión email'],
        ['good', 'Enlace de baja en un clic (RFC 8058)'],
      ];
      return `
        <div class="callout warn">${ic('alert')}<span><b>7 de 8 comprobaciones superadas.</b> El preflight no bloquea el envío, pero hay que mirarlo.</span></div>
        <div class="rp-sec">${items.map(([s, t, a]) => `<div class="check"><span class="ci ${s}">${ic(s === 'good' ? 'check' : 'alert')}</span><span>${t}</span>${a ? `<button class="btn sm act">${a}</button>` : ''}</div>`).join('')}</div>
        <div class="rp-sec"><h4>Renderizado en clientes</h4>
          <div class="check"><span class="ci good">${ic('check')}</span>Gmail web y app</div>
          <div class="check"><span class="ci good">${ic('check')}</span>Apple Mail (claro / oscuro)</div>
          <div class="check"><span class="ci good">${ic('check')}</span>Outlook 2016–365 (tablas + VML)</div>
        </div>`;
    },
    comentarios() {
      return `
        <div class="rp-sec">
          <div class="thread">
            <div class="msg">${av('DS', '#2563eb', 1)}<div><div class="who">Diego Salas<span>hace 12 min</span></div><q>es el único que se correlaciona con ventas</q>¿Tenemos dato para respaldar esto? Si no, suavizaría a «el que mejor se correlaciona».</div></div>
            <div class="msg">${av('LM', '#7c3aed', 1)}<div><div class="who">Lucía Marín<span>hace 4 min</span></div>Sí: correlación 0,71 con conversiones a premium en 12 ediciones. Añado nota al pie.</div></div>
            <div class="msg">${av('RP', '#0f766e', 1)}<div><div class="who">Rocío Pérez<span>ahora</span></div>Perfecto. @Lucía ¿pongo la fuente en el pie de la Fig. 1?</div></div>
          </div>
          <div class="row" style="margin-top:14px"><input class="input" placeholder="Responder… (@ para mencionar)"><button class="btn sm dark" data-toast="Comentario publicado">Enviar</button></div>
          <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-toast="Hilo resuelto">${ic('check')}Resolver hilo</button></div>
        </div>
        <div class="rp-sec"><h4>Presencia</h4>
          <div class="check">${av('LM', '#7c3aed', 1)}Lucía — tú</div>
          <div class="check">${av('DS', '#2563eb', 1)}Diego — seleccionando en el párrafo 1</div>
          <div class="check">${av('RP', '#0f766e', 1)}Rocío — viendo el panel de preflight</div>
        </div>`;
    },
  };

  function previewHTML(ch, s) {
    const n = s.name || 'lector';
    if (ch === 'audio') {
      const bars = Array.from({ length: 42 }, (_, i) => `<i class="${i < 13 ? 'p' : ''}" style="height:${20 + Math.abs(Math.sin(i * 1.7)) * 80}%"></i>`).join('');
      return `<div class="audio-player"><span class="play">${ic('play')}</span><div class="wave">${bars}</div><span class="num" style="font-size:12px">1:52 / 6:04</span></div>
        <div class="hint" style="margin-top:10px">Voz «Lucía (clonada)» · se omiten anuncios visuales, encuestas y figuras. Los lectores premium escuchan también la parte de pago.</div>`;
    }
    const prem = s.tier === 'premium';
    return `<div class="preview-frame"><div class="preview-mail" style="${ch === 'web' ? 'font-family:Georgia,serif' : ''}">
      ${ch === 'email' ? `<div class="from"><span class="pub-logo" style="background:#c2410c;width:22px;height:22px;font-size:11px">B</span><div><b>La Brújula Tech</b><div style="color:#6f6a60">Para: ${s.label.split(' · ')[0]}</div></div></div>` : '<div style="color:#6f6a60;font-size:11px;margin-bottom:8px">labrujula.tech/p/el-fin-del-clic-gratis</div>'}
      <h5>El fin del clic gratis</h5>
      <p style="margin:0 0 8px">Hola <b>${n}</b>, esta semana toca hablar de algo incómodo: la mitad de las aperturas que celebrabas eran de robots…</p>
      ${!prem ? '<div style="border:1px solid #e5e0d6;border-radius:6px;padding:8px;margin-bottom:8px;background:#faf8f4"><small style="color:#6f6a60">PATROCINADO</small><br><b>Northwind Cloud</b> — despliega en 30 s.</div>' : ''}
      ${prem ? `<p style="margin:0"><b>Solo premium:</b> ${n}, aquí van los tres cambios…</p>` : '<div style="text-align:center;padding:10px;background:#fbe9df;border-radius:6px"><b>Sigue leyendo con Premium</b><br><span style="color:#6f6a60">6 €/mes · cancela cuando quieras</span></div>'}
    </div></div>
    <div class="hint" style="margin-top:8px">${prem ? 'Premium: sin anuncio, con sección de pago.' : 'Free: con anuncio, corte de pago visible.'} ${ch === 'email' ? 'HTML de tablas con estilos inline.' : 'Versión web con SEO y schema de Google News.'}</div>`;
  }

  function bindPreview() {
    let ch = 'email';
    $$('#rp [data-ch]').forEach((b) => b.addEventListener('click', () => {
      ch = b.dataset.ch;
      $$('#rp [data-ch]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      $('#pv').innerHTML = previewHTML(ch, SIMS[sim]);
    }));
    $('#sim').addEventListener('change', (e) => {
      sim = e.target.value;
      $('#pv').innerHTML = previewHTML(ch, SIMS[sim]);
      applySim();
      $$('.premium-only').forEach((p) => (p.style.opacity = SIMS[sim].tier === 'premium' ? 1 : 0.35));
      const ad = $('[data-blk="ad"]');
      if (ad) ad.style.opacity = SIMS[sim].tier === 'premium' ? 0.35 : 1;
    });
  }

  /* ===== 3. Enviar ===== */
  views.enviar = {
    title: 'Enviar',
    html() {
      return `
      <div class="page-head">
        <div><h1>Enviar «El fin del clic gratis»</h1><p class="sub">Edición #142 · última edición hace 3 min por Lucía</p></div>
        <div class="actions"><a class="btn" href="#/editor">${ic('edit')}Volver al editor</a><button class="btn" data-toast="Prueba enviada a 3 direcciones del equipo">${ic('mail')}Enviar prueba</button></div>
      </div>
      <div class="steps">
        <div class="step done"><span class="n">${ic('check')}</span>Contenido</div>
        <div class="step cur"><span class="n">2</span>Audiencia</div>
        <div class="step"><span class="n">3</span>Asunto y pruebas</div>
        <div class="step"><span class="n">4</span>Programación</div>
        <div class="step"><span class="n">5</span>Revisión</div>
      </div>
      <div class="grid g-main-side" style="align-items:start">
        <div class="stack">
          <section class="card">
            <div class="card-h"><h2>Audiencia</h2><span class="right muted">Listas y segmentos se combinan con bitmaps: el recuento es instantáneo</span></div>
            <div class="card-b grid g-2">
              <div class="aud-box inc"><div class="label" style="margin-bottom:6px">${ic('check')} Incluir</div>
                <div class="aud-item">${ic('users')}Lista · Newsletter principal<span class="num">48.213</span></div>
                <div class="aud-item">${ic('filter')}Segmento · Activos últimos 90 días<span class="num">39.506</span></div>
                <button class="btn sm ghost">${ic('plus')}Añadir lista o segmento</button>
              </div>
              <div class="aud-box exc"><div class="label" style="margin-bottom:6px">${ic('x')} Excluir</div>
                <div class="aud-item">${ic('filter')}Compraron «Curso de growth»<span class="num">−1.204</span></div>
                <div class="aud-item">${ic('alert')}Rebote suave en los 2 últimos envíos<span class="num">−318</span></div>
                <div class="aud-item">${ic('shield')}Supresiones (global + publicación)<span class="num">automático</span></div>
              </div>
            </div>
            <div class="card-b" style="border-top:1px solid var(--border);padding-top:14px;padding-bottom:14px"><div class="row"><span class="muted">Destinatarios estimados</span><span class="spacer"></span><b class="num" style="font-size:18px">37.984</b><span class="badge good">${ic('check')}Sunset policy activa</span></div></div>
          </section>

          <section class="card">
            <div class="card-h"><h2>Test A/B del asunto</h2><div class="right"><span class="muted">Activado</span><button class="switch" role="switch" aria-checked="true" aria-label="Test A/B"></button></div></div>
            <div class="card-b grid g-2" style="gap:var(--s-6)">
              <div>
                ${[['A', 'El fin del clic gratis', '33'], ['B', 'La mitad de tus aperturas son robots', '33'], ['C', '{{nombre}}, tu tasa de apertura te miente', '34']].map(([v, s, p]) => `<div class="variant"><span class="v">${v}</span><input class="input" value="${s}" aria-label="Asunto variante ${v}"><span class="muted num">${p} %</span></div>`).join('')}
                <div class="row" style="margin-top:6px"><button class="btn sm ghost">${ic('plus')}Variante</button><button class="btn sm ghost" data-palette="Sugiere 3 asuntos para este post">${ic('sparkle')}Sugerir con IA</button></div>
                <div class="grid g-2" style="margin-top:14px;gap:12px">
                  <div class="field"><label>Muestra de prueba</label><select class="select"><option>20 % de la audiencia</option><option>10 %</option></select></div>
                  <div class="field"><label>Ganador por</label><select class="select"><option>Clics humanos verificados</option><option>Aperturas verificadas</option></select></div>
                </div>
                <p class="hint" style="margin-top:8px">El ganador se envía al 80 % restante tras 4 horas.</p>
              </div>
              <div>
                <div class="label" style="margin-bottom:8px">Así se ve en la bandeja</div>
                <div class="inbox-prev">
                  <div class="ir"><b>Notion</b><span class="muted">Novedades de octubre</span><span class="muted">9:02</span></div>
                  <div class="ir me"><b>La Brújula Tech</b><span><b>La mitad de tus aperturas son robots</b> <span class="muted">— Gmail, Apple y Yahoo están cambiando…</span></span><span class="muted">9:00</span></div>
                  <div class="ir"><b>Stripe</b><span class="muted">Tu resumen mensual</span><span class="muted">8:41</span></div>
                </div>
                <div class="field" style="margin-top:14px"><label>Preheader</label><input class="input" value="Gmail, Apple y Yahoo están cambiando cómo medimos el email."></div>
                <div class="field" style="margin-top:10px"><label>Remitente</label><select class="select"><option>Lucía de La Brújula &lt;lucia@labrujula.tech&gt;</option><option>La Brújula Tech &lt;hola@labrujula.tech&gt;</option></select></div>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-h"><h2>Envío por cohortes aleatorias</h2><div class="right"><button class="switch" role="switch" aria-checked="true" aria-label="Cohortes"></button></div></div>
            <div class="card-b stack" style="gap:12px">
              <p class="muted">Divide la audiencia al azar para probar contenido distinto (no solo el asunto). Los bloques con condición <span class="badge outline">cohort:B</span> solo los ve la cohorte B.</p>
              <div class="cohort-bar"><div style="flex:50;background:var(--ink)">A · 50 % · CTA «Hazte premium»</div><div style="flex:50;background:var(--accent)">B · 50 % · CTA «Prueba 14 días gratis»</div></div>
              <div class="row"><span class="muted">Métrica de conversión:</span><b>Altas a premium en 7 días</b></div>
            </div>
          </section>

          <section class="card">
            <div class="card-h"><h2>Programación</h2></div>
            <div class="card-b grid g-3">
              <label class="aud-box row" style="cursor:pointer"><input type="radio" name="when"> Enviar ahora</label>
              <label class="aud-box row" style="cursor:pointer;border-color:var(--accent)"><input type="radio" name="when" checked> Martes 20 oct · 07:30</label>
              <label class="aud-box row" style="cursor:pointer"><input type="radio" name="when"> Hora óptima por lector ${ic('sparkle', 'muted')}</label>
            </div>
          </section>
        </div>

        <aside class="card" style="position:sticky;top:80px">
          <div class="card-h"><h2>Resumen</h2></div>
          <div class="card-b stack" style="gap:14px">
            <div><div class="summary-num num">37.984</div><div class="muted">destinatarios · Martes 20 oct, 07:30 (Europe/Madrid)</div></div>
            <div class="rp-sec" style="padding:12px 14px">
              <div class="check"><span class="ci good">${ic('check')}</span>Tamaño 64 KB / 102 KB</div>
              <div class="check"><span class="ci good">${ic('check')}</span>Enlaces y merge tags OK</div>
              <div class="check"><span class="ci warn">${ic('alert')}</span>1 imagen sin alt text<a class="act" href="#/editor">Arreglar</a></div>
              <div class="check"><span class="ci good">${ic('check')}</span>SPF, DKIM y DMARC alineados</div>
              <div class="check"><span class="ci good">${ic('check')}</span>Tasa de quejas 0,021 % · kill-switch a 0,1 %</div>
            </div>
            <div class="callout">${ic('info')}<span>Envío estimado: 4 min a 10.000/min por proveedor, con colas separadas para Gmail, Yahoo, Outlook y Apple.</span></div>
            <button class="btn primary" style="height:42px;justify-content:center" data-toast="Envío programado para el martes 20 oct, 07:30">${ic('calendar')}Programar envío</button>
            <button class="btn ghost" style="justify-content:center">Guardar y salir</button>
          </div>
        </aside>
      </div>`;
    },
  };

  /* ===== 4. Audiencia ===== */
  const COND_DEFAULT = [
    ['', 'Nivel', 'es', 'Premium'],
    ['Y', 'Clic verificado', 'en los últimos', '3 envíos'],
  ];
  const COND_AI = [
    ['', 'Nivel', 'es', 'Premium'],
    ['Y', 'País', 'es', 'España'],
    ['Y', 'Clic verificado', 'en los últimos', '3 envíos'],
    ['Y', 'Compró producto', 'no es', 'Curso de growth'],
  ];
  function condRows(list) {
    return list.map(([c, f, o, v]) => `<div class="cond"><span class="conj">${c || 'Donde'}</span><select class="select"><option>${f}</option></select><select class="select"><option>${o}</option></select><input class="input" value="${v}"><button class="btn sm ghost icon" aria-label="Quitar">${ic('x')}</button></div>`).join('');
  }
  views.audiencia = {
    title: 'Audiencia',
    html() {
      const tierBadge = (t) => (t === 'Premium' ? 'accent' : t === 'Fundador' ? 'info' : '');
      return `
      <div class="page-head">
        <div><h1>Audiencia</h1><p class="sub">48.213 suscriptores activos · 1.142 de pago · 6.880 suprimidos</p></div>
        <div class="actions"><button class="btn">${ic('download')}Importar</button><button class="btn">${ic('download')}Exportar todo</button><button class="btn dark">${ic('plus')}Añadir suscriptor</button></div>
      </div>
      <section class="card" style="margin-bottom:var(--s-5)">
        <div class="card-h"><h2>Nuevo segmento</h2><span class="badge outline">Dinámico</span><div class="right"><span class="muted">Coinciden</span><b class="num" id="seg-count" style="font-size:18px">812</b><span class="muted">suscriptores</span><button class="btn sm" data-toast="Segmento guardado: Premium activos">Guardar segmento</button></div></div>
        <div class="card-b grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:var(--s-6)">
          <div>
            <form class="ai-input" id="seg-ai">${ic('sparkle')}<input id="seg-ai-q" aria-label="Describe el segmento en lenguaje natural" placeholder="Describe en lenguaje natural…" value="Premium de España que hicieron clic en los 3 últimos envíos y no han comprado el curso"><button class="btn sm primary" type="submit">Generar</button></form>
            <div class="cond-group" style="margin-top:12px" id="conds">${condRows(COND_DEFAULT)}</div>
            <div class="row" style="margin-top:8px"><button class="btn sm ghost">${ic('plus')}Condición</button><button class="btn sm ghost">${ic('plus')}Grupo (O)</button><button class="btn sm ghost">${ic('flow')}Usar conjunto guardado</button></div>
          </div>
          <div class="rp-sec" style="background:var(--surface-2)">
            <h4>Composición</h4>
            <div class="stack" style="gap:10px;font-size:var(--fs-sm)" id="seg-comp">
              <div><div class="row"><span>Engagement medio</span><span class="spacer"></span><b>86</b></div><div class="meter good"><span style="width:86%"></span></div></div>
              <div><div class="row"><span>Fuente principal</span><span class="spacer"></span><b>Recomendaciones</b></div></div>
              <div><div class="row"><span>MRR del segmento</span><span class="spacer"></span><b>4.872 €</b></div></div>
              <div class="hint">Se recalcula en tiempo real con cada evento.</div>
            </div>
          </div>
        </div>
      </section>
      <section class="card">
        <div class="toolbar">
          <div class="search">${ic('search')}<input class="input" placeholder="Buscar por email, nombre o campo…" aria-label="Buscar suscriptores"></div>
          <button class="btn sm">${ic('filter')}Fuente</button><button class="btn sm">${ic('filter')}Nivel</button><button class="btn sm">${ic('filter')}Engagement</button>
          <span class="spacer"></span><span class="muted">Mostrando 1–11 de 48.213</span>
        </div>
        <table class="t">
          <thead><tr><th style="width:36px"><input type="checkbox" aria-label="Seleccionar todo"></th><th>Suscriptor</th><th>Fuente de adquisición</th><th>Nivel</th><th>Engagement</th><th>Último clic verificado</th><th>Alta</th></tr></thead>
          <tbody>${SUBSCRIBERS.map(([n, e, src, t, sc, last, d]) => `
            <tr><td><input type="checkbox" aria-label="Seleccionar ${n}"></td>
            <td><div class="cell-main">${n}</div><div class="cell-sub">${e}</div></td>
            <td>${src}</td>
            <td><span class="badge ${tierBadge(t)}">${t}</span></td>
            <td><div class="eng"><div class="meter ${sc >= 75 ? 'good' : sc < 40 ? 'warn' : ''}"><span style="width:${sc}%"></span></div><b class="num">${sc}</b></div></td>
            <td class="muted">${last}</td><td class="muted">${d}</td></tr>`).join('')}
          </tbody>
        </table>
      </section>`;
    },
    mount() {
      $('#seg-ai').addEventListener('submit', (e) => {
        e.preventDefault();
        const c = $('#conds');
        c.innerHTML = condRows(COND_AI);
        c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
        $('#seg-count').textContent = '213';
        toast('Segmento generado a partir de tu descripción: 4 condiciones');
      });
    },
  };

  /* ===== 5. Automatizaciones ===== */
  let flowMode = 'draft';
  views.automatizaciones = {
    title: 'Automatizaciones',
    html() {
      const n = (cls, color, icon, type, title, body, stats, extra = '') =>
        `<div class="node ${cls}" data-node>${extra}<div class="nt"><span class="ni" style="background:${color}">${ic(icon)}</span>${type}</div><div class="nh">${title}</div><div class="muted" style="margin-top:2px">${body}</div>${stats ? `<div class="stats">${stats}</div>` : ''}</div>`;
      return `
      <div class="page-head">
        <div><h1>Bienvenida — nuevos suscriptores</h1><p class="sub">Activa desde el 3 mar · 2.318 personas en el flujo ahora</p></div>
        <div class="actions">
          <div class="seg" role="group" aria-label="Versión"><button data-mode="live" aria-pressed="${flowMode === 'live'}"><span class="dot good"></span>Live</button><button data-mode="draft" aria-pressed="${flowMode === 'draft'}">${ic('edit')}Borrador <span class="badge warn">3 cambios</span></button></div>
          <button class="btn primary only-draft-btn" data-toast="Borrador publicado. Los suscriptores en curso siguen su versión actual.">Publicar cambios</button>
        </div>
      </div>
      <div class="flow-shell flow-mode-${flowMode}" id="flow-shell">
        <div>
          <div class="mode-banner draft only-draft">${ic('edit')}<span><b>Editando borrador.</b> La versión live sigue ejecutándose sin cambios. Los cambios se marcan en el lienzo.</span></div>
          <div class="mode-banner live only-live">${ic('check')}<span><b>Versión live</b> · solo lectura. Las cifras son de los últimos 30 días.</span></div>
          <div class="canvas"><div class="flow" id="flow">
            <svg class="edges" id="edges"></svg>
            <div class="frow">${n('trigger', '#7c3aed', 'zap', 'Disparador', 'Se suscribe', 'Cualquier formulario o import · excluye fuente «API test»', '<span><b>1.284</b> entradas</span>')}</div>
            <div class="frow">${n('', 'var(--accent)', 'mail', 'Email', 'Bienvenida + 5 mejores posts', 'Asunto: «Bienvenido/a a La Brújula»', '<span>Apert. verif. <b>58 %</b></span><span>Clics <b>21 %</b></span>')}</div>
            <div class="frow">${n('changed', '#475569', 'clock', 'Espera', '<span class="only-live">Esperar 3 días</span><span class="only-draft"><del>3 días</del> <ins>2 días</ins></span>', 'Solo días laborables, 08:00 hora local', '', '<span class="diff badge warn only-draft">modificado</span>')}</div>
            <div class="frow">${n('', '#0369a1', 'branch', 'Condición', '¿Hizo clic en el email 1?', 'Usa el conjunto «Lector comprometido»', '')}</div>
            <div class="frow">${n('', 'var(--accent)', 'mail', 'Email · Sí', 'Guía: cómo leer la Brújula', 'Oferta Premium 14 días', '<span>Clics <b>17 %</b></span><span>Altas <b>4,2 %</b></span>')}
            ${n('changed', 'var(--accent)', 'mail', 'Email · No', '¿Seguimos en contacto?', '<span class="only-live">Asunto: «¿Te ha llegado bien?»</span><span class="only-draft">Asunto: <del>«¿Te ha llegado bien?»</del> <ins>«¿Lo dejamos aquí?»</ins></span>', '<span>Clics <b>6 %</b></span><span>Bajas <b>1,1 %</b></span>', '<span class="diff badge warn only-draft">modificado</span>')}</div>
            <div class="frow only-draft">${n('added', '#334155', 'webhook', 'Webhook', 'POST → CRM (HubSpot)', 'Reintentos automáticos · firma HMAC', '', '<span class="diff badge good">nuevo</span>')}<div class="ghost-slot"></div></div>
          </div></div>
        </div>
        <aside class="stack">
          <section class="card only-draft"><div class="card-h"><h3>Borrador vs. live</h3><span class="right badge warn">3 cambios</span></div>
            <div class="card-b" style="padding-top:8px;padding-bottom:8px">
              <div class="check"><span class="ci good">${ic('plus')}</span><span>Paso nuevo: <b>Webhook a HubSpot</b> tras el email «Sí»</span></div>
              <div class="check"><span class="ci warn">${ic('edit')}</span><span>Espera: 3 días → <b>2 días</b></span></div>
              <div class="check"><span class="ci warn">${ic('edit')}</span><span>Asunto del email «No» cambiado</span></div>
            </div>
          </section>
          <section class="card"><div class="card-h"><h3>Recorrido de un suscriptor</h3></div>
            <div class="card-b">
              <div class="row" style="margin-bottom:10px">${av('VR', '#be185d', 1)}<div><b>Valentina Rojas</b><div class="cell-sub">vrojas@gmail.com</div></div></div>
              <div class="check"><span class="ci good">${ic('check')}</span>Se suscribió · pop-up · 12 oct</div>
              <div class="check"><span class="ci good">${ic('check')}</span>Email de bienvenida · clic verificado</div>
              <div class="check"><span class="ci good">${ic('clock')}</span>Esperando · sale el 15 oct, 08:00</div>
            </div>
          </section>
          <section class="card"><div class="card-h"><h3>Rendimiento (30 días)</h3></div>
            <div class="card-b stack" style="gap:10px">
              <div class="row"><span class="muted">Completaron el flujo</span><span class="spacer"></span><b>71 %</b></div>
              <div class="row"><span class="muted">Altas a premium atribuidas</span><span class="spacer"></span><b>54</b></div>
              <div class="row"><span class="muted">Webhooks fallidos</span><span class="spacer"></span><b>0</b></div>
            </div>
          </section>
        </aside>
      </div>`;
    },
    mount() {
      drawEdges();
      $$('[data-mode]').forEach((b) => b.addEventListener('click', () => {
        flowMode = b.dataset.mode;
        $$('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', x === b));
        const s = $('#flow-shell');
        s.className = 'flow-shell flow-mode-' + flowMode;
        $('.only-draft-btn').style.visibility = flowMode === 'draft' ? 'visible' : 'hidden';
        drawEdges();
      }));
      $('.only-draft-btn').style.visibility = flowMode === 'draft' ? 'visible' : 'hidden';
    },
  };
  function drawEdges() {
    const flow = $('#flow'); if (!flow) return;
    const nodes = $$('[data-node]', flow);
    const fr = flow.getBoundingClientRect();
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height, vis: r.width > 0 }; };
    const b = nodes.map(box);
    const path = (a, c, cls = '', label = '') => {
      if (!a.vis || !c.vis) return '';
      const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = c.x + c.w / 2, y2 = c.y;
      const my = (y1 + y2) / 2;
      return `<path class="${cls}" d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}"/>` +
        (label ? `<text x="${(x1 + x2) / 2 + (x2 < x1 ? -18 : 18)}" y="${my + 4}" font-size="11" font-weight="600" fill="var(--ink-3)" text-anchor="middle">${label}</text>` : '');
    };
    $('#edges').innerHTML = path(b[0], b[1]) + path(b[1], b[2]) + path(b[2], b[3]) + path(b[3], b[4], '', 'Sí') + path(b[3], b[5], '', 'No') + path(b[4], b[6], 'added');
  }

  /* ===== 6. Entregabilidad ===== */
  views.entregabilidad = {
    title: 'Entregabilidad',
    html() {
      const prov = [
        ['Gmail', '#ea4335', 'G', 21480, 99.6, 0.08, 0.018, 97, 'good', 'Excelente'],
        ['Apple iCloud', '#1b1a17', 'A', 9012, 99.7, 0.05, 0.004, 98, 'good', 'Excelente'],
        ['Outlook / Hotmail', '#0078d4', 'O', 8640, 98.9, 0.31, 0.041, 91, 'warn', 'Vigilar'],
        ['Yahoo / AOL', '#6001d2', 'Y', 4210, 99.3, 0.22, 0.036, 94, 'good', 'Buena'],
        ['Corporativos y otros', '#64748b', '·', 4638, 98.4, 0.62, 0.012, 89, 'good', 'Buena'],
      ];
      const rate = (v, max, cls) => `<div class="rate"><span class="num">${v.toLocaleString('es-ES', { maximumFractionDigits: 3 })} %</span><div class="meter ${cls}"><span style="width:${Math.min(100, (v / max) * 100)}%"></span></div></div>`;
      const bls = ['Spamhaus ZEN', 'Spamhaus DBL', 'Barracuda', 'SpamCop', 'SURBL', 'UCEPROTECT L1'];
      return `
      <div class="page-head">
        <div><h1>Entregabilidad</h1><p class="sub">Último envío: 47.980 mensajes · dominio labrujula.tech · pool dedicado</p></div>
        <div class="actions"><select class="select" style="width:280px"><option>Post: El fin del clic gratis (13 oct)</option><option>Últimos 30 días</option></select></div>
      </div>
      <div class="grid g-4" style="margin-bottom:var(--s-5)">
        <div class="card kpi"><div class="k-label">Tasa de entrega</div><div class="k-val">99,4 %</div><div class="k-foot"><span class="badge good">${ic('check')}Saludable</span></div></div>
        <div class="card kpi"><div class="k-label">Tasa de quejas</div><div class="k-val">0,021 %</div><div class="k-foot">Kill-switch automático a 0,1 %</div></div>
        <div class="card kpi"><div class="k-label">Rebotes duros</div><div class="k-val">0,18 %</div><div class="k-foot">86 direcciones suprimidas para siempre</div></div>
        <div class="card kpi"><div class="k-label">Colocación en bandeja (estimada)</div><div class="k-val">95,6 %</div><div class="k-foot">Panel semilla de 120 buzones</div></div>
      </div>
      <section class="card" style="margin-bottom:var(--s-5)">
        <div class="card-h"><h2>Por proveedor</h2><span class="right muted">Feedback loops: Gmail Postmaster, Yahoo CFL, Microsoft SNDS/JMRP</span></div>
        <table class="t">
          <thead><tr><th>Proveedor</th><th class="r">Enviados</th><th class="r">Entregados</th><th class="r">Rebotes</th><th class="r">Quejas</th><th class="r">Bandeja</th><th>Estado</th></tr></thead>
          <tbody>${prov.map(([n, c, l, s, d, b, q, inbox, st, stl]) => `<tr>
            <td><div class="provider"><span class="pl" style="background:${c}">${l}</span><b>${n}</b></div></td>
            <td class="r num">${fmt(s)}</td>
            <td class="r">${rate(d, 100, 'good')}</td>
            <td class="r">${rate(b, 2, b > 0.5 ? 'warn' : '')}</td>
            <td class="r">${rate(q, 0.1, q > 0.03 ? 'warn' : 'good')}</td>
            <td class="r num"><b>${inbox} %</b></td>
            <td><span class="badge ${st}">${ic(st === 'good' ? 'check' : 'alert')}${stl}</span></td></tr>`).join('')}
          </tbody>
        </table>
        <div class="card-b" style="border-top:1px solid var(--border)"><div class="callout warn">${ic('alert')}<span><b>Outlook: quejas por encima de tu media.</b> El 64 % viene de suscriptores sin clics en 120 días. Recomendación: activar sunset a 90 días para dominios de Microsoft (−1.130 destinatarios).</span><button class="btn sm" style="margin-left:auto" data-toast="Sunset a 90 días aplicado a Outlook">Aplicar</button></div></div>
      </section>
      <div class="grid g-2" style="margin-bottom:var(--s-5)">
        <section class="card"><div class="card-h"><h2>Autenticación del dominio</h2><span class="right mono muted">labrujula.tech</span></div>
          <div class="card-b"><div class="auth-grid">
            <div class="auth"><div class="ah"><span class="badge good">${ic('check')}OK</span>SPF</div><code>v=spf1 include:_spf.tirada.email -all</code></div>
            <div class="auth"><div class="ah"><span class="badge good">${ic('check')}OK</span>DKIM</div><code>t1._domainkey · 2048 bits · rotada 2 sept</code></div>
            <div class="auth"><div class="ah"><span class="badge good">${ic('check')}OK</span>DMARC</div><code>p=quarantine; rua=… · alineado</code></div>
            <div class="auth"><div class="ah"><span class="badge warn">${ic('alert')}Falta</span>BIMI</div><code>Registro OK · sin certificado VMC</code></div>
          </div>
          <div class="row" style="margin-top:14px"><span class="muted">One-click unsubscribe (RFC 8058)</span><span class="spacer"></span><span class="badge good">${ic('check')}Activo</span></div>
          <div class="row" style="margin-top:8px"><span class="muted">Remitentes verificados</span><span class="spacer"></span><b>3</b></div>
          </div>
        </section>
        <section class="card"><div class="card-h"><h2>Pools de IP</h2></div>
          <div class="card-b" style="padding-top:4px;padding-bottom:4px">
            <div class="pool"><div><b>Dedicado · brujula-1</b> <span class="mono muted">185.42.17.0/29</span></div><span class="badge info">${ic('clock')}Calentando · día 18/30</span>
              <div class="warm" style="grid-column:1/-1" aria-label="Plan de calentamiento">${Array.from({ length: 30 }, (_, i) => `<i class="${i >= 18 ? 'future' : ''}" style="height:${10 + i * 3}%"></i>`).join('')}</div>
              <span class="hint" style="grid-column:1/-1">Hoy: hasta 30.000 envíos por IP. Gmail recibe primero a los más comprometidos.</span></div>
            <div class="pool"><div><b>Compartido · reputación alta</b><div class="hint">Tráfico excedente durante el calentamiento</div></div><span class="badge good">${ic('check')}Activo</span></div>
            <div class="pool"><div><b>Transaccional</b><div class="hint">Magic links, recibos, confirmaciones</div></div><span class="badge good">${ic('check')}Activo</span></div>
          </div>
        </section>
      </div>
      <div class="grid g-2">
        <section class="card"><div class="card-h"><h2>Monitor de listas negras</h2><span class="right muted">Comprobado hace 4 min · 24/7</span></div>
          <div class="card-b"><div class="bl">${bls.map((b) => `<div><span class="dot good"></span>${b}<span class="spacer"></span><span class="muted" style="font-size:11px">limpio</span></div>`).join('')}</div>
          <p class="hint" style="margin-top:12px">Si una IP aparece listada, se retira de rotación al instante y te avisamos.</p></div>
        </section>
        <section class="card"><div class="card-h"><h2>Supresiones</h2></div>
          <table class="t"><thead><tr><th>Capa</th><th class="r">Permanentes</th><th class="r">Temporales</th></tr></thead><tbody>
            <tr><td>Global (red Tirada)</td><td class="r num">3.912</td><td class="r num">—</td></tr>
            <tr><td>Publicación</td><td class="r num">2.640</td><td class="r num">318 <span class="muted">· expiran en 7 días</span></td></tr>
            <tr><td>Transaccional</td><td class="r num">10</td><td class="r num">0</td></tr>
          </tbody></table>
        </section>
      </div>`;
    },
  };

  /* ===== 7. Monetización ===== */
  views.monetizacion = {
    title: 'Monetización',
    html() {
      const offers = [
        ['#0f766e', 'N', 'Northwind Cloud', 'CPM 32 € · 2 inserciones · oct–nov', 'Garantizado', '1.530 €'],
        ['#7c3aed', 'L', 'Linear', 'CPC 2,10 € · solo clics humanos verificados', 'Estimado', '~840 €'],
        ['#b45309', 'F', 'Fundae Cursos', 'CPM 24 € · audiencia España', 'Garantizado', '620 €'],
        ['#1d4ed8', 'P', 'Pipedrive', 'CPA 18 € por prueba iniciada', 'Estimado', '~410 €'],
      ];
      return `
      <div class="page-head">
        <div><h1>Monetización</h1><p class="sub">0 % de comisión de Tirada en tus ventas. Stripe Connect con tu empresa como comerciante.</p></div>
        <div class="actions"><button class="btn">${ic('arrow-ur')}Abrir Stripe</button></div>
      </div>
      <div class="grid g-4" style="margin-bottom:var(--s-5)">
        <div class="card kpi"><div class="k-label">MRR suscripciones</div><div class="k-val">6.840 €</div><div class="k-foot"><span class="delta-up">▲ 4,1 %</span> · churn 2,3 %</div></div>
        <div class="card kpi"><div class="k-label">Anuncios (octubre)</div><div class="k-val">3.210 €</div><div class="k-foot">7 campañas · CPM medio 28 €</div></div>
        <div class="card kpi"><div class="k-label">Recomendaciones</div><div class="k-val">+412</div><div class="k-foot">suscriptores · 186 € pagados por otros</div></div>
        <div class="card kpi"><div class="k-label">Productos</div><div class="k-val">2.958 €</div><div class="k-foot">74 pedidos este mes</div></div>
      </div>
      <h2 class="serif" style="font-size:22px;margin-bottom:12px">Niveles</h2>
      <div class="grid g-3" style="margin-bottom:var(--s-6)">
        <div class="card tier"><div class="row"><b>Gratis</b><span class="spacer"></span><span class="badge">47.071</span></div><div class="price">0 €</div><ul><li>${ic('check')}Edición semanal</li><li>${ic('check')}Archivo público</li><li>${ic('check')}Con anuncios</li></ul></div>
        <div class="card tier featured"><div class="row"><b>Premium</b><span class="badge accent">Más popular</span><span class="spacer"></span><span class="badge">1.031</span></div><div class="price">6 € <small>/ mes · 60 €/año</small></div><ul><li>${ic('check')}Sin anuncios</li><li>${ic('check')}Sección de pago y audio</li><li>${ic('check')}Comunidad privada</li></ul></div>
        <div class="card tier"><div class="row"><b>Fundador</b><span class="spacer"></span><span class="badge">111</span></div><div class="price">120 € <small>/ año</small></div><ul><li>${ic('check')}Todo Premium</li><li>${ic('check')}Webinar mensual en directo</li><li>${ic('check')}Nombre en los créditos</li></ul></div>
      </div>
      <div class="grid g-main-side" style="margin-bottom:var(--s-5);align-items:start">
        <section class="card"><div class="card-h"><h2>Ofertas de la ad network</h2><span class="badge accent">3 nuevas</span><span class="right muted">Pagos verificados por clic humano</span></div>
          ${offers.map(([c, l, n, d, k, v]) => `<div class="offer"><span class="lg" style="background:${c}">${l}</span><div><b>${n}</b><div class="meta"><span>${d}</span><span>${k}: <b>${v}</b></span></div></div><button class="btn sm dark" data-toast="Oferta de ${n} reclamada. Se añadirá un hueco de anuncio a tus próximos posts.">Reclamar</button></div>`).join('')}
        </section>
        <section class="card"><div class="card-h"><h2>Productos y pedidos</h2></div>
          <table class="t"><thead><tr><th>Producto</th><th class="r">Pedidos</th><th class="r">Ingresos</th></tr></thead><tbody>
            <tr><td><div class="cell-main">Curso de growth</div><div class="cell-sub">Curso · 149 €</div></td><td class="r num">12</td><td class="r num">1.788 €</td></tr>
            <tr><td><div class="cell-main">Plantilla de media kit</div><div class="cell-sub">Descarga · 19 €</div></td><td class="r num">48</td><td class="r num">912 €</td></tr>
            <tr><td><div class="cell-main">Mentoría 1:1</div><div class="cell-sub">Cita 45 min · 129 €</div></td><td class="r num">2</td><td class="r num">258 €</td></tr>
            <tr><td><div class="cell-main">Guía de herramientas</div><div class="cell-sub">Ebook · gratis</div></td><td class="r num">12</td><td class="r num">0 €</td></tr>
          </tbody></table>
        </section>
      </div>
      <section class="card"><div class="card-h"><h2>Recomendaciones</h2><span class="right muted">Recomiendas y te recomiendan · un clic para el lector gracias a su identidad Tirada</span></div>
        <table class="t"><thead><tr><th>Publicación</th><th>Tipo</th><th class="r">Te enviaron</th><th class="r">Les enviaste</th><th class="r">Calidad (engagement 30 d)</th><th></th></tr></thead><tbody>
          <tr><td><div class="cell-main">Código Abierto</div><div class="cell-sub">9.870 suscriptores · misma cuenta</div></td><td><span class="badge">Mutua</span></td><td class="r num">214</td><td class="r num">188</td><td class="r"><span class="badge good">Alta · 81</span></td><td class="r"><button class="btn sm ghost">${ic('more')}</button></td></tr>
          <tr><td><div class="cell-main">Producto en Español</div><div class="cell-sub">31.200 suscriptores</div></td><td><span class="badge info">De pago · 1,20 €</span></td><td class="r num">155</td><td class="r num">—</td><td class="r"><span class="badge good">Alta · 77</span></td><td class="r"><button class="btn sm ghost">${ic('more')}</button></td></tr>
          <tr><td><div class="cell-main">Finanzas para Freelancers</div><div class="cell-sub">12.400 suscriptores</div></td><td><span class="badge">Mutua</span></td><td class="r num">43</td><td class="r num">97</td><td class="r"><span class="badge warn">Media · 52</span></td><td class="r"><button class="btn sm ghost">${ic('more')}</button></td></tr>
        </tbody></table>
      </section>`;
    },
  };

  /* ===== 8. Website ===== */
  let siteDevice = 'desktop';
  views.website = {
    title: 'Website', full: true,
    html() {
      const pages = [['Inicio', '/', 'Publicada', 'good'], ['Archivo', '/archivo', 'Publicada', 'good'], ['Premium', '/premium', 'Borrador', 'warn'], ['Sobre nosotros', '/sobre', 'Publicada', 'good'], ['Podcast', '/podcast', 'Auto', ''], ['Tienda', '/tienda', 'Publicada', 'good']];
      const posts = [['El fin del clic gratis', 'linear-gradient(135deg,#2b3a55,#c2410c)'], ['Lo que la IA no te va a contar', 'linear-gradient(135deg,#0f766e,#a3e635)'], ['50 herramientas que usamos', 'linear-gradient(135deg,#7c3aed,#f59e0b)']];
      return `
      <div class="site-shell">
        <aside class="site-left">
          <div class="side-h">Páginas</div>
          ${pages.map(([n, p, s, c], i) => `<div class="page-item${i === 0 ? ' on' : ''}">${ic('layout', 'muted')}<div>${n}<div class="cell-sub mono" style="font-size:11px">${p}</div></div><span class="badge ${c}">${s}</span></div>`).join('')}
          <button class="btn sm ghost" style="margin-top:6px">${ic('plus')}Nueva página</button>
          <div class="side-h">Bloques</div>
          <div class="blocklib">
            ${[['layout', 'Hero'], ['mail', 'Formulario'], ['columns', 'Grid de posts'], ['image', 'Carrusel'], ['play', 'YouTube'], ['bag', 'Tienda'], ['star', 'Testimonios'], ['code', 'HTML'], ['sparkle', 'Elemento IA']].map(([i, n]) => `<div>${ic(i)}${n}</div>`).join('')}
          </div>
          <div class="side-h">Ajustes del sitio</div>
          <ul class="plain" style="font-size:var(--fs-sm);display:flex;flex-direction:column;gap:6px">
            <li class="row">${ic('globe', 'muted')}labrujula.tech <span class="badge good" style="margin-left:auto">SSL</span></li>
            <li class="row">${ic('link', 'muted')}Redirecciones <b style="margin-left:auto">14</b></li>
            <li class="row">${ic('code', 'muted')}robots.txt</li>
          </ul>
        </aside>
        <section class="site-center">
          <div class="ed-toolbar" style="background:var(--surface-2)">
            <div class="seg" role="group" aria-label="Dispositivo de vista previa"><button data-dev="desktop" aria-pressed="${siteDevice === 'desktop'}">${ic('monitor')}Escritorio</button><button data-dev="mobile" aria-pressed="${siteDevice === 'mobile'}">${ic('phone')}Móvil</button></div>
            
            <span class="spacer"></span>
            <span class="badge warn">Borrador · 2 cambios</span>
            <button class="btn sm">${ic('clock')}Historial</button>
            <button class="btn sm ghost icon" aria-label="Editar con IA" title="Editar con IA" data-palette="Rediseña el hero para destacar el plan Premium">${ic('sparkle')}</button>
            <button class="btn sm primary" data-toast="Sitio publicado en labrujula.tech">Publicar</button>
          </div>
          <div class="site-stage">
            <div class="reader ${siteDevice === 'mobile' ? 'mobile' : ''}" id="reader">
              <div class="rnav"><span class="rlogo">La Brújula</span><span class="rlink">Archivo</span><span class="rlink">Podcast</span><span class="rlink">Tienda</span><span class="rcta">Suscríbete</span></div>
              <div class="rhero r-selected"><span class="r-label">Hero</span>
                <h2>Tecnología, sin humo.</h2>
                <p>Cada martes, lo que importa en producto, IA e infraestructura, explicado por gente que lo construye.</p>
                <div class="rform"><span>tu@email.com</span><b>Suscribirme gratis</b></div>
                <div class="rproof">Únete a 48.213 lectores · sin spam, baja en un clic</div>
              </div>
              <div class="rsec-h">Lo último</div>
              <div class="rposts">${posts.map(([t, g]) => `<div class="rp"><div class="ph" style="background:${g}"></div><h3>${t}</h3><p>Lucía Marín · 6 min</p></div>`).join('')}</div>
              <div class="rfoot"><span>© 2026 La Brújula Tech</span><span>Privacidad</span><span>RSS</span><span>Hecho con Tirada</span></div>
            </div>
          </div>
        </section>
        <aside class="site-right">
          <div class="side-h">Sección · Hero</div>
          <div class="stack" style="gap:14px">
            <div class="field"><label>Título</label><input class="input" value="Tecnología, sin humo."></div>
            <div class="field"><label>Fondo</label><div class="row"><span class="dot" style="width:22px;height:22px;background:#f4ecdf;box-shadow:inset 0 0 0 1px var(--border)"></span><span class="mono">--surface-alt</span></div></div>
            <div class="field"><label>Espaciado vertical</label><select class="select"><option>Generoso (56 px)</option></select></div>
            <div class="field"><label>Visible para</label><div class="row wrap"><button class="chip" aria-pressed="true">Visitantes</button><button class="chip" aria-pressed="false">Suscriptores free</button><button class="chip" aria-pressed="false">Premium</button></div></div>
          </div>
          <div class="side-h">Tema del sitio</div>
          <div class="stack" style="gap:10px;font-size:var(--fs-sm)">
            <div class="row"><span class="muted">Títulos</span><span class="spacer"></span>Georgia 600</div>
            <div class="row"><span class="muted">Texto</span><span class="spacer"></span>Inter 400</div>
            <div class="row"><span class="muted">Colores</span><span class="spacer"></span>${['#c2410c', '#1b1a17', '#f4ecdf', '#fffdf8'].map((c) => `<span class="dot" style="width:16px;height:16px;background:${c};box-shadow:inset 0 0 0 1px var(--border)"></span>`).join('')}</div>
            <div class="row"><span class="muted">Radio</span><span class="spacer"></span>8 px</div>
          </div>
          <div class="side-h">SEO de la página</div>
          <div class="stack" style="gap:10px">
            <div class="field"><label>Meta título</label><input class="input" value="La Brújula Tech — tecnología sin humo"></div>
            <div class="hint">LCP medido: 0,9 s (p75 móvil) · Schema de Google News activo</div>
          </div>
        </aside>
      </div>`;
    },
    mount() {
      $$('[data-dev]').forEach((b) => b.addEventListener('click', () => {
        siteDevice = b.dataset.dev;
        $$('[data-dev]').forEach((x) => x.setAttribute('aria-pressed', x === b));
        $('#reader').classList.toggle('mobile', siteDevice === 'mobile');
      }));
    },
  };

  /* ===== 9. Ajustes ===== */
  views.ajustes = {
    title: 'Ajustes',
    html() {
      const team = [
        ['LM', '#7c3aed', 'Lucía Marín', 'lucia@labrujula.tech', 'Admin', 'Workspace', 'ahora'],
        ['DS', '#2563eb', 'Diego Salas', 'diego@labrujula.tech', 'Miembro', 'Workspace', 'hace 12 min'],
        ['RP', '#0f766e', 'Rocío Pérez', 'rocio@labrujula.tech', 'Miembro', 'La Brújula Tech', 'hace 1 h'],
        ['MG', '#b45309', 'Marta Gil', 'marta@fintual.com', 'Colaborador', 'La Brújula Tech', 'hace 3 días'],
        ['AI', '#c2410c', 'Agente Tirada', 'agente IA · usa tus permisos', 'Miembro', 'Workspace', 'hace 2 min'],
      ];
      const log = [
        ['200', 'ok', 'subscriber.created', '14:02:11', '84 ms', 1],
        ['200', 'ok', 'post.sent', '13:58:40', '112 ms', 1],
        ['503', 'err', 'subscriber.upgraded', '13:41:07', '30.000 ms', 3],
        ['200', 'ok', 'subscriber.created', '13:40:55', '91 ms', 1],
        ['200', 'ok', 'order.paid', '13:12:02', '76 ms', 1],
      ];
      return `
      <div class="page-head"><div><h1>Ajustes</h1><p class="sub">Workspace «Brújula Media» · 3 publicaciones</p></div></div>
      <div class="settings">
        <nav class="subnav" aria-label="Secciones de ajustes">
          <a href="#/ajustes">General</a><a href="#/ajustes" class="on">Equipo y roles</a><a href="#/ajustes">Dominios</a><a href="#/ajustes">API y webhooks</a><a href="#/ajustes">Servidor MCP</a><a href="#/ajustes">Facturación</a><a href="#/ajustes">Exportar todo</a><a href="#/ajustes" style="color:var(--bad)">Transferir publicación</a>
        </nav>
        <div class="stack">
          <section class="card">
            <div class="card-h"><h2>Equipo</h2><div class="right"><input class="input" style="width:260px;height:32px" placeholder="email@dominio.com" aria-label="Email a invitar"><select class="select" style="width:140px;height:32px" aria-label="Rol"><option>Colaborador</option><option>Miembro</option><option>Admin</option></select><button class="btn sm dark" data-toast="Invitación enviada">Invitar</button></div></div>
            <table class="t"><thead><tr><th>Persona</th><th>Rol</th><th>Ámbito</th><th>Última actividad</th><th></th></tr></thead><tbody>
              ${team.map(([i, c, n, e, r, s, l]) => `<tr><td><div class="row">${av(i, c)}<div><div class="cell-main">${n}</div><div class="cell-sub">${e}</div></div></div></td><td><select class="select" style="width:150px;height:32px" aria-label="Rol de ${n}">${['Admin', 'Miembro', 'Colaborador'].map((o) => `<option${o === r ? ' selected' : ''}>${o}</option>`).join('')}</select></td><td>${s}</td><td class="muted">${l}</td><td class="r"><button class="btn sm ghost" aria-label="Quitar acceso">${ic('trash')}</button></td></tr>`).join('')}
            </tbody></table>
            <div class="card-b" style="border-top:1px solid var(--border)"><div class="grid g-3" style="font-size:var(--fs-sm)">
              <div><b>Admin</b><div class="muted">Facturación, exportaciones, integraciones, pagos y dominios.</div></div>
              <div><b>Miembro</b><div class="muted">Todo excepto permisos de admin.</div></div>
              <div><b>Colaborador</b><div class="muted">Solo borradores de posts y automatizaciones.</div></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-h"><h2>Claves de API</h2><div class="right"><button class="btn sm" data-toast="Clave creada. Cópiala ahora: no volverás a verla.">${ic('key')}Nueva clave</button></div></div>
            <table class="t"><thead><tr><th>Nombre</th><th>Clave</th><th>Permisos</th><th>Último uso</th><th></th></tr></thead><tbody>
              <tr><td class="cell-main">Producción · web</td><td><span class="key">trd_live_••••••••3f9a</span></td><td><span class="badge">subscribers:write</span> <span class="badge">posts:read</span></td><td class="muted">hace 2 min</td><td class="r"><button class="btn sm ghost" data-toast="Clave revocada">Revocar</button></td></tr>
              <tr><td class="cell-main">Zapier</td><td><span class="key">trd_live_••••••••a71c</span></td><td><span class="badge">subscribers:write</span></td><td class="muted">hace 5 h</td><td class="r"><button class="btn sm ghost" data-toast="Clave revocada">Revocar</button></td></tr>
              <tr><td class="cell-main">Claude (MCP)</td><td><span class="key">OAuth · Lucía</span></td><td><span class="badge accent">rol: Miembro</span></td><td class="muted">ayer</td><td class="r"><button class="btn sm ghost" data-toast="Acceso revocado">Revocar</button></td></tr>
            </tbody></table>
          </section>
          <section class="card">
            <div class="card-h"><h2>Webhooks</h2><div class="right"><button class="btn sm">${ic('plus')}Endpoint</button></div></div>
            <div class="card-b" style="padding-bottom:6px">
              <div class="row" style="padding-bottom:10px;border-bottom:1px solid var(--border)"><span class="dot good"></span><span class="mono">https://api.labrujula.tech/hooks/tirada</span><span class="badge">5 eventos</span><span class="spacer"></span><span class="muted">Éxito 24 h: <b>99,2 %</b></span></div>
              <div class="row" style="padding:10px 0"><span class="dot warn"></span><span class="mono">https://hooks.zapier.com/hooks/catch/88213/</span><span class="badge">2 eventos</span><span class="spacer"></span><span class="muted">Éxito 24 h: <b>94,0 %</b></span></div>
            </div>
            <table class="t"><thead><tr><th>Estado</th><th>Evento</th><th>Hora</th><th>Duración</th><th>Intentos</th><th></th></tr></thead><tbody>
              ${log.map(([c, k, e, h, d, n]) => `<tr><td><span class="status-code ${k}">${c}</span></td><td class="mono">${e}</td><td class="muted num">${h}</td><td class="num">${d}</td><td>${n > 1 ? `<span class="badge warn">${n} · reintentando</span>` : n}</td><td class="r"><button class="btn sm ghost" data-toast="Evento reenviado">Reenviar</button></td></tr>`).join('')}
            </tbody></table>
          </section>
        </div>
      </div>`;
    },
  };

  /* ---------------- router ---------------- */
  let current = null;
  function route() {
    const name = (location.hash.replace(/^#\/?/, '') || 'inicio').split('/')[0];
    const v = views[name] || views.inicio;
    const key = views[name] ? name : 'inicio';
    if (current && current.unmount) current.unmount();
    const el = $('#view');
    el.className = 'view' + (v.full ? ' full' : '');
    $('#app').classList.toggle('compact', !!v.full);
    el.innerHTML = v.html();
    $$('#nav a').forEach((a) => (a.dataset.route === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.title = `${v.title} · La Brújula Tech · Tirada`;
    current = v;
    if (v.mount) v.mount();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // Delegación global: toasts, paleta, segmentos simples, switches, chips
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toast]');
    if (t) toast(t.dataset.toast);
    const p = e.target.closest('[data-palette]');
    if (p) openPalette(p.dataset.palette);
    const sw = e.target.closest('.switch');
    if (sw) sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true');
    const chip = e.target.closest('.chip');
    if (chip) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
    const sb = e.target.closest('.seg button');
    if (sb && !sb.dataset.ch && !sb.dataset.mode && !sb.dataset.dev) $$('button', sb.parentElement).forEach((b) => b.setAttribute('aria-pressed', b === sb));
  });

  /* ---------------- selector de publicación ---------------- */
  const pubBtn = $('#pub-btn'), pubMenu = $('#pub-menu');
  pubBtn.addEventListener('click', (e) => { e.stopPropagation(); const o = pubMenu.hidden; pubMenu.hidden = !o; pubBtn.setAttribute('aria-expanded', o); });
  document.addEventListener('click', (e) => { if (!pubMenu.hidden && !pubMenu.contains(e.target)) { pubMenu.hidden = true; pubBtn.setAttribute('aria-expanded', 'false'); } });
  $$('.menu-item', pubMenu).forEach((m, i) => m.addEventListener('click', () => { if (i > 0) toast('En el prototipo solo está disponible La Brújula Tech'); pubMenu.hidden = true; }));

  /* ---------------- paleta Cmd+K / agente ---------------- */
  const PAL_ITEMS = [
    { g: 'Pregunta al agente', ai: 1, t: '¿Qué post tuvo más clics verificados este mes?', s: 'Consulta analítica · lectura' },
    { g: 'Pregunta al agente', ai: 1, t: 'Crea un segmento de lectores premium inactivos 60 días', s: 'Crea un segmento · requiere confirmación' },
    { g: 'Pregunta al agente', ai: 1, t: 'Compara los ingresos de anuncios de septiembre y octubre', s: 'Informe · lectura' },
    { g: 'Ir a', i: 'home', t: 'Inicio', r: 'inicio' },
    { g: 'Ir a', i: 'edit', t: 'Editor · El fin del clic gratis', r: 'editor' },
    { g: 'Ir a', i: 'send', t: 'Enviar', r: 'enviar' },
    { g: 'Ir a', i: 'users', t: 'Audiencia y segmentos', r: 'audiencia' },
    { g: 'Ir a', i: 'flow', t: 'Automatizaciones', r: 'automatizaciones' },
    { g: 'Ir a', i: 'shield', t: 'Entregabilidad', r: 'entregabilidad' },
    { g: 'Ir a', i: 'coin', t: 'Monetización', r: 'monetizacion' },
    { g: 'Ir a', i: 'globe', t: 'Website', r: 'website' },
    { g: 'Ir a', i: 'settings', t: 'Ajustes · equipo, API y webhooks', r: 'ajustes' },
    { g: 'Suscriptores', i: 'users', t: 'Ana Torres', s: 'ana.torres@gmail.com · Premium · engagement 94', r: 'audiencia' },
    { g: 'Suscriptores', i: 'users', t: 'Camila Herrera', s: 'camila@herrera.co · Fundador · engagement 98', r: 'audiencia' },
  ];
  const palette = $('#palette'), pin = $('#palette-input'), pbody = $('#palette-body');
  let palSel = 0, palList = [];
  function renderPalette() {
    const q = pin.value.trim().toLowerCase();
    palList = PAL_ITEMS.filter((it) => !q || (it.t + ' ' + (it.s || '')).toLowerCase().includes(q));
    if (q && !palList.some((it) => it.t.toLowerCase() === q)) palList.unshift({ g: 'Pregunta al agente', ai: 1, t: pin.value.trim(), s: 'Enviar al agente de Tirada', custom: 1 });
    palSel = Math.min(palSel, palList.length - 1);
    let g = '';
    pbody.innerHTML = palList.map((it, i) => {
      const head = it.g !== g ? `<div class="p-grp">${(g = it.g)}</div>` : '';
      return `${head}<div class="p-it${it.ai ? ' ai' : ''}${i === palSel ? ' active' : ''}" data-i="${i}"><span class="ic">${ic(it.ai ? 'sparkle' : it.i)}</span><div><span class="pt"></span>${it.s ? `<small>${it.s}</small>` : ''}</div><span class="go">${it.ai ? 'Preguntar ↵' : 'Abrir ↵'}</span></div>`;
    }).join('') || '<div class="p-grp">Sin resultados</div>';
    $$('.p-it', pbody).forEach((el) => { el.querySelector('.pt').textContent = palList[+el.dataset.i].t; });
  }
  function runItem(it) {
    if (!it) return;
    if (it.r) { closePalette(); location.hash = '#/' + it.r; return; }
    if (/segment/i.test(it.t)) {
      pbody.innerHTML = `<div class="ai-answer"><div class="bubble"><span class="avatar sm" style="background:#7c3aed">LM</span><div class="q"></div></div>
        <div class="tool">${ic('db')} segments.preview(conditions=[tier=premium, last_verified_click>60d]) · 88 ms</div>
        <div class="bubble"><span class="ic">${ic('sparkle')}</span><div><p>He preparado el segmento <b>«Premium inactivos 60 días»</b>: <b>137 suscriptores</b> (12 % de tu base de pago, 822 € de MRR en riesgo). Condiciones: nivel es Premium · sin clic verificado en 60 días · no suprimido.</p>
        <p class="hint" style="margin-top:6px">Crear segmentos es una escritura: necesito tu confirmación. Quedará en el audit log como «Agente Tirada en nombre de Lucía».</p>
        <div class="row" style="margin-top:10px"><button class="btn sm primary" data-toast="Segmento «Premium inactivos 60 días» creado">Confirmar y crear</button><button class="btn sm ghost" data-palette="">Cancelar</button></div></div></div></div>`;
      $('.ai-answer .q', pbody).textContent = it.t;
      return;
    }
    pbody.innerHTML = `<div class="ai-answer">
      <div class="bubble"><span class="avatar sm" style="background:#7c3aed">LM</span><div class="q"></div></div>
      <div class="tool">${ic('db')} analytics.posts.compare(range="30d", metric="verified_clicks") · 142 ms</div>
      <div class="bubble"><span class="ic">${ic('sparkle')}</span><div>
        <p>En los últimos 30 días, el post con más <b>clics humanos verificados</b> fue <b>«Especial: 50 herramientas que usamos de verdad»</b>: 6.034 clics (CTR verificado 12,7 %), un 31 % por encima de tu media.</p>
        <table class="t" style="margin-top:10px"><thead><tr><th>Post</th><th class="r">Clics verif.</th><th class="r">CTR</th></tr></thead><tbody>
          <tr><td>50 herramientas que usamos</td><td class="r num">6.034</td><td class="r">12,7 %</td></tr>
          <tr><td>El fin del clic gratis</td><td class="r num">4.702</td><td class="r">9,8 %</td></tr>
          <tr><td>Lo que la IA no te va a contar</td><td class="r num">3.864</td><td class="r">8,1 %</td></tr>
        </tbody></table>
        <div class="row" style="margin-top:10px"><button class="btn sm" data-toast="Informe guardado en Analítica">Guardar como informe</button><button class="btn sm ghost" data-toast="Segmento creado: hicieron clic en «50 herramientas»">Crear segmento con quienes hicieron clic</button></div>
      </div></div></div>`;
    $('.ai-answer .q', pbody).textContent = it.t;
  }
  function openPalette(prefill) {
    if (gateMQ.matches) return;
    palette.hidden = false;
    pin.value = prefill || '';
    palSel = 0;
    renderPalette();
    pin.focus();
  }
  function closePalette() { palette.hidden = true; }
  $('#cmdk-btn').addEventListener('click', () => openPalette());
  palette.addEventListener('click', (e) => {
    if (e.target === palette) return closePalette();
    const it = e.target.closest('.p-it');
    if (it) runItem(palList[+it.dataset.i]);
  });
  pin.addEventListener('input', () => { palSel = 0; renderPalette(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hidden ? openPalette() : closePalette();
      return;
    }
    if (palette.hidden) return;
    if (e.key === 'Escape') closePalette();
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      palSel = (palSel + (e.key === 'ArrowDown' ? 1 : -1) + palList.length) % palList.length;
      $$('.p-it', pbody).forEach((el) => el.classList.toggle('active', +el.dataset.i === palSel));
      const a = $('.p-it.active', pbody); if (a) a.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && document.activeElement === pin) {
      e.preventDefault();
      runItem(palList[palSel]);
    }
  });

  /* ---------------- arranque ---------------- */
  $$('#nav a').forEach((a) => { a.title = a.childNodes[1] ? a.childNodes[1].textContent.trim() : a.textContent.trim(); });
  applyGate();
  route();
  window.addEventListener('resize', () => { if ($('#flow')) drawEdges(); });
})();
