/* Oso andino hecho de puntos y líneas que se deshace en estructuras geométricas y vuelve a formarse. */
(function () {
  'use strict';
  var cv = document.getElementById('oso-canvas');
  if (!cv) return;
  var cap = document.getElementById('oso-pie');
  var btn = document.getElementById('oso-sig');
  var ctx = cv.getContext('2d');
  var W = 360, H = 260;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Colores del sitio (variables de style.css) ---------- */
  var cs = getComputedStyle(document.documentElement);
  var v = function (n, f) { return (cs.getPropertyValue(n) || '').trim() || f; };
  var COL = [
    v('--ink', '#14161a'),            // 0 contorno del oso
    v('--indigo', '#5f4fae'),         // 1 ojos (anteojos)
    v('--violet', '#8955ab'),         // 2 hocico y peto claro
    v('--ink-faint', '#86898f'),      // 3 páramo (cordillera)
    v('--teal', '#1c8f9e'),           // 4 frailejones
    v('--line-strong', '#c3c6cc'),    // 5 suelo
    v('--indigo-soft', '#8d7fce'),    // 6 pelaje
    v('--ink-soft', '#4a4d54')        // 7 patas lejanas
  ];
  var GEO = v('--blue', '#3672b8');
  var GA = [1, 1, 1, 0.55, 0.9, 0.55, 0.75, 0.65];   // opacidad por grupo
  var GR = [2.3, 2, 2.1, 1.5, 1.8, 1.3, 1.7, 1.7];   // radio por grupo

  /* ---------- 1. El oso (y su páramo) ---------- */
  var P = [], EB = [];
  function pt(x, y, g) { P.push({ x: x, y: y, g: g }); return P.length - 1; }
  function poly(arr, g, closed) {
    var s = P.length;
    arr.forEach(function (q) { pt(q[0], q[1], g); });
    for (var i = 0; i < arr.length - 1; i++) EB.push({ a: s + i, b: s + i + 1, c: g });
    if (closed) EB.push({ a: s + arr.length - 1, b: s, c: g });
  }
  function ring(cx, cy, r, n, g) {
    var a = [];
    for (var k = 0; k < n; k++) a.push([cx + r * Math.cos(2 * Math.PI * k / n), cy + r * Math.sin(2 * Math.PI * k / n)]);
    poly(a, g, true);
  }
  function frailejon(x, base, alto, radio) {
    var b = pt(x, base, 4), c = pt(x, base - alto, 4);
    EB.push({ a: b, b: c, c: 4 });
    for (var d = 200; d <= 340; d += 20) {
      var t = pt(x + radio * Math.cos(d * Math.PI / 180), base - alto + radio * Math.sin(d * Math.PI / 180), 4);
      EB.push({ a: c, b: t, c: 4 });
    }
  }

  // contorno del cuerpo, de perfil mirando a la derecha
  poly([[64,112],[72,98],[94,88],[124,82],[154,80],[184,82],[206,86],[220,80],[227,66],[239,63],[245,75],
        [255,84],[269,92],[285,104],[297,114],[304,123],[300,132],[289,137],[275,139],[263,146],[251,156],
        [243,168],[243,196],[247,214],[251,218],[223,218],[223,198],[214,172],[204,166],[176,164],[146,166],
        [134,174],[134,210],[138,218],[108,218],[108,196],[100,176],[86,152],[70,130]], 0, true);
  // patas del lado lejano
  poly([[178,165],[180,212],[174,218],[198,218],[199,210],[199,165]], 7, false);
  poly([[150,167],[152,212],[146,218],[168,218],[169,210],[169,166]], 7, false);
  // anteojos, hocico claro y peto
  ring(263, 101, 7.5, 8, 1);
  pt(263, 101, 1);
  poly([[276,112],[290,119],[294,127],[284,131],[272,125]], 2, true);
  poly([[260,118],[256,134],[250,148],[244,160]], 2, false);
  // pelaje
  [[110,104],[135,98],[160,96],[186,98],[120,126],[150,122],[180,124],[205,112],[100,134],
   [130,148],[165,146],[198,146],[236,98],[232,130]].forEach(function (q) { pt(q[0], q[1], 6); });
  // páramo: cordillera, frailejones y suelo
  poly([[4,78],[28,54],[46,64],[78,30],[104,52],[124,42],[150,58],[180,36],[206,50],[232,30],[262,50],
        [290,26],[318,48],[338,38],[356,56]], 3, false);
  frailejon(28, 218, 32, 13);
  frailejon(334, 218, 38, 15);
  poly([[4,221],[60,221],[110,222],[170,221],[240,222],[300,221],[356,221]], 5, false);

  var N = P.length;
  var BEAR = P.map(function (p) { return [p.x, p.y]; });

  /* ---------- 2. Estructuras geométricas ---------- */
  var cx = W / 2, cy = 130;
  function prox(pos, thr) {
    var e = [];
    for (var i = 0; i < pos.length; i++) for (var j = i + 1; j < pos.length; j++) {
      if (Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]) < thr) e.push({ a: i, b: j, c: -1 });
    }
    return e;
  }
  var sub = function (k) { return String(k).split('').map(function (d) { return '₀₁₂₃₄₅₆₇₈₉'.charAt(d); }).join(''); };

  function hex() {
    var s = 21, pts = [];
    for (var i = -14; i <= 14; i++) for (var j = -10; j <= 10; j++) {
      pts.push([cx + (i + j / 2) * s, cy + j * s * Math.sqrt(3) / 2]);
    }
    pts.sort(function (p, q) {
      return Math.pow((p[0] - cx) / 1.45, 2) + Math.pow(p[1] - cy, 2) - Math.pow((q[0] - cx) / 1.45, 2) - Math.pow(q[1] - cy, 2);
    });
    var pos = pts.slice(0, N);
    return { pos: pos, edges: prox(pos, s * 1.15), text: 'Retícula triangular: cada punto tiene seis vecinos.' };
  }
  function circulo() {
    var pos = [], R = 112, m = Math.round(N * 0.36), e = [];
    for (var k = 0; k < N; k++) {
      var a = -Math.PI / 2 + 2 * Math.PI * k / N;
      pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    for (var k2 = 0; k2 < N; k2++) {
      e.push({ a: k2, b: (k2 + 1) % N, c: -1 });
      e.push({ a: k2, b: (k2 + m) % N, c: -1 });
    }
    return { pos: pos, edges: e, text: 'ℤ' + sub(N) + ': cada k se une con k + 1 y con k + ' + m + ' (mod ' + N + ').' };
  }
  function filotaxis() {
    var pos = [], c = 108 / Math.sqrt(N);
    for (var i = 0; i < N; i++) {
      var r = c * Math.sqrt(i + 0.5), a = i * 2.399963229728653;
      pos.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return { pos: pos, edges: prox(pos, c * 2.25), text: 'Filotaxis: cada punto gira el ángulo áureo, 137,5°.' };
  }

  // Reasigna cada punto del oso a su destino más cercano para que el movimiento sea corto y fluido
  function reasignar(geo) {
    var pairs = [], i, j;
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
      var dx = BEAR[i][0] - geo.pos[j][0], dy = BEAR[i][1] - geo.pos[j][1];
      pairs.push([dx * dx + dy * dy, i, j]);
    }
    pairs.sort(function (p, q) { return p[0] - q[0]; });
    var usedS = [], usedD = [], perm = [], inv = [];
    pairs.forEach(function (p) {
      if (!usedS[p[1]] && !usedD[p[2]]) { usedS[p[1]] = 1; usedD[p[2]] = 1; perm[p[1]] = p[2]; inv[p[2]] = p[1]; }
    });
    return {
      pos: BEAR.map(function (_, k) { return geo.pos[perm[k]]; }),
      edges: geo.edges.map(function (e) { return { a: inv[e.a], b: inv[e.b], c: -1 }; }),
      text: geo.text
    };
  }

  var S = [
    { pos: BEAR, edges: EB, text: 'Oso andino (Tremarctos ornatus) en el páramo.' },
    reasignar(hex()), reasignar(circulo()), reasignar(filotaxis())
  ];
  var SEQ = [0, 1, 0, 2, 0, 3];

  /* ---------- 3. Animación ---------- */
  var HOLD_OSO = 6500, HOLD_GEO = 3800, MORPH = 1900, DELMAX = 0.3;
  var seed = 7;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var DEL = [], SW = [], X = [], Y = [], OX = [], OY = [], PX = [], PY = [];
  for (var i = 0; i < N; i++) { DEL.push(rnd() * DELMAX); SW.push((rnd() - 0.5) * 36); X.push(0); Y.push(0); OX.push(0); OY.push(0); PX.push(0); PY.push(0); }

  var si = 0, mode = 'hold', tHold = 0, tMorph = 0, tgt = 0, clock = 0, mx = -999, my = -999;
  var smooth = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function startMorph() {
    tgt = SEQ[(si + 1) % SEQ.length];
    var A = S[SEQ[si]].pos, B = S[tgt].pos;
    for (var i = 0; i < N; i++) {
      var dx = B[i][0] - A[i][0], dy = B[i][1] - A[i][1], L = Math.hypot(dx, dy) || 1;
      PX[i] = -dy / L; PY[i] = dx / L;
    }
    mode = 'morph'; tMorph = 0;
    cap.textContent = S[tgt].text;
  }
  function llegar() {
    si = (si + 1) % SEQ.length;
    mode = 'hold'; tHold = 0;
  }
  function siguiente() {
    if (reduce) { si = (si + 1) % SEQ.length; mode = 'hold'; cap.textContent = S[SEQ[si]].text; dibujar(); return; }
    if (mode === 'morph') llegar();
    startMorph();
  }

  function posiciones() {
    var p = mode === 'morph' ? tMorph / MORPH : 0;
    var A = S[SEQ[si]].pos, B = mode === 'morph' ? S[tgt].pos : null;
    for (var i = 0; i < N; i++) {
      var x = A[i][0], y = A[i][1];
      if (B) {
        var tt = Math.min(1, Math.max(0, (p - DEL[i]) / (1 - DELMAX)));
        var e = tt * tt * (3 - 2 * tt), s = Math.sin(Math.PI * e) * SW[i];
        x += (B[i][0] - x) * e + PX[i] * s;
        y += (B[i][1] - y) * e + PY[i] * s;
      }
      if (!reduce) {
        x += Math.sin(clock * 0.0012 + i * 1.7) * 0.7;
        y += Math.cos(clock * 0.0010 + i * 2.3) * 0.7;
      }
      // repulsión suave del puntero
      var dx = x - mx, dy = y - my, d = Math.hypot(dx, dy), R = 46, tx = 0, ty = 0;
      if (d < R && d > 0.01) { var f = 1 - d / R; tx = dx / d * f * f * 16; ty = dy / d * f * f * 16; }
      OX[i] += (tx - OX[i]) * 0.18; OY[i] += (ty - OY[i]) * 0.18;
      X[i] = x + OX[i]; Y[i] = y + OY[i];
    }
    return p;
  }

  function aristas(lista, alfa) {
    if (alfa <= 0.01) return;
    ctx.lineCap = 'round';
    for (var k = 0; k < lista.length; k++) {
      var e = lista[k];
      ctx.globalAlpha = alfa * (e.c < 0 ? 0.55 : GA[e.c]);
      ctx.strokeStyle = e.c < 0 ? GEO : COL[e.c];
      ctx.lineWidth = e.c < 0 ? 1 : 1.4;
      ctx.beginPath(); ctx.moveTo(X[e.a], Y[e.a]); ctx.lineTo(X[e.b], Y[e.b]); ctx.stroke();
    }
  }

  function dibujar() {
    var p = posiciones();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (mode === 'morph') {
      aristas(S[SEQ[si]].edges, 1 - smooth(0, 0.35, p));
      aristas(S[tgt].edges, smooth(0.65, 1, p));
    } else {
      aristas(S[SEQ[si]].edges, 1);
    }
    for (var i = 0; i < N; i++) {
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = COL[P[i].g];
      ctx.beginPath(); ctx.arc(X[i], Y[i], GR[P[i].g], 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var raf = 0, last = 0, visible = true;
  function frame(ts) {
    var dt = Math.min(100, ts - last); last = ts; clock += dt;
    if (mode === 'hold') {
      tHold += dt;
      if (tHold >= (SEQ[si] === 0 ? HOLD_OSO : HOLD_GEO)) startMorph();
    } else {
      tMorph += dt;
      if (tMorph >= MORPH) llegar();
    }
    dibujar();
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  function iniciar() { if (!reduce && !raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ---------- 4. Tamaño, puntero y eventos ---------- */
  function ajustar() {
    var w = cv.clientWidth || W, dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr * H / W);
    dibujar();
  }
  function punto(ev) {
    var r = cv.getBoundingClientRect();
    mx = (ev.clientX - r.left) * W / r.width; my = (ev.clientY - r.top) * H / r.height;
    if (reduce) dibujar();
  }
  cv.addEventListener('pointermove', punto);
  cv.addEventListener('pointerleave', function () { mx = my = -999; });
  cv.addEventListener('click', siguiente);
  if (btn) btn.addEventListener('click', siguiente);
  if ('ResizeObserver' in window) new ResizeObserver(ajustar).observe(cv); else window.addEventListener('resize', ajustar);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) iniciar(); }).observe(cv);
  }

  cap.textContent = S[0].text;
  ajustar();
  iniciar();
})();
