/* Õpetaja Abiline – the arrow tour.
   Dims the page, rings the real button with a scribbled marker line and draws a hand-drawn arrow
   from a speech bubble to it. It never clicks anything for the teacher. */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var NS = 'http://www.w3.org/2000/svg';
  var steps = [], idx = 0, active = false, goFn = null, onClose = null, raf = 0, lastTarget = null;

  /* small deterministic "shaky hand" so the same step always looks the same */
  function rng(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && el.offsetParent !== null || (el && getComputedStyle(el).position === 'fixed' && r.width > 2);
  }

  function addPath(d, cls) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('class', cls || '');
    $('#tourSvg').appendChild(p);
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 4); } catch (e) { /* ignore */ }
    return p;
  }

  /* a rectangle drawn with a marker, a bit crooked, going round about 1.1 times */
  function scribbleRect(x, y, w, h, seed, shift) {
    var r = rng(seed + (shift ? 7 : 0)), j = function (n) { return (r() - .5) * n; };
    var pts = [
      [x + j(8), y + j(8)], [x + w + j(8), y + j(8)], [x + w + j(8), y + h + j(8)], [x + j(8), y + h + j(8)], [x + j(8), y + j(8) + 6], [x + w * .35 + j(8), y + j(8) - 1]
    ];
    var d = 'M' + (pts[0][0] - 10) + ' ' + (pts[0][1] + 6);
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[i + 1] || null;
      if (i === 0) d += ' L' + a[0].toFixed(1) + ' ' + a[1].toFixed(1);
      if (b) {
        var mx = (a[0] + b[0]) / 2 + j(10), my = (a[1] + b[1]) / 2 + j(10);
        d += ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
      }
    }
    return d;
  }

  function arrow(sx, sy, ex, ey, seed) {
    var dx = ex - sx, dy = ey - sy, dist = Math.hypot(dx, dy) || 1;
    var nx = -dy / dist, ny = dx / dist, bend = Math.min(60, dist * .28) * (seed % 2 ? 1 : -1);
    var cx = (sx + ex) / 2 + nx * bend, cy = (sy + ey) / 2 + ny * bend;
    addPath('M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), 'arrow');
    var ang = Math.atan2(ey - cy, ex - cx), L = 17, sp = .52;
    var a1 = [ex - L * Math.cos(ang - sp), ey - L * Math.sin(ang - sp)], a2 = [ex - L * Math.cos(ang + sp), ey - L * Math.sin(ang + sp)];
    addPath('M' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + ' L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ' L' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1), 'head');
  }

  function nearestOnRect(rc, px, py) {
    return [Math.max(rc.left, Math.min(rc.right, px)), Math.max(rc.top, Math.min(rc.bottom, py))];
  }

  function place() {
    if (!active) return;
    var st = steps[idx], tour = $('#tour'), svg = $('#tourSvg'), bub = $('#tourBubble'), hole = $('#tourHole');
    svg.innerHTML = '';
    var target = st.sel ? document.querySelector(st.sel) : null;
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!visible(target)) target = null;
    lastTarget = target;
    var bw = bub.offsetWidth, bh = bub.offsetHeight, bx, by;

    if (!target) {
      tour.classList.add('nohole');
      bub.style.left = Math.max(12, (vw - bw) / 2) + 'px'; bub.style.top = Math.max(12, (vh - bh) / 2) + 'px';
      return;
    }
    tour.classList.remove('nohole');
    var rc = target.getBoundingClientRect(), pad = 8;
    var hx = Math.max(4, rc.left - pad), hy = Math.max(4, rc.top - pad);
    var hw = Math.min(vw - 8, rc.width + pad * 2) , hh = rc.height + pad * 2;
    hole.style.left = hx + 'px'; hole.style.top = hy + 'px'; hole.style.width = hw + 'px'; hole.style.height = hh + 'px';
    var box = { left: hx, top: hy, right: hx + hw, bottom: hy + hh };

    /* where does the bubble go: below, else above, else on the free side of the screen */
    var gap = 74, cxm = (box.left + box.right) / 2;
    var roomBelow = vh - box.bottom, roomAbove = box.top;
    if (roomBelow >= bh + gap) { by = box.bottom + gap; bx = cxm - bw / 2; }
    else if (roomAbove >= bh + gap) { by = box.top - gap - bh; bx = cxm - bw / 2; }
    else { by = roomBelow > roomAbove ? vh - bh - 14 : 14; bx = cxm - bw / 2; }
    bx = Math.max(12, Math.min(vw - bw - 12, bx));
    by = Math.max(12, Math.min(vh - bh - 12, by));
    bub.style.left = bx + 'px'; bub.style.top = by + 'px';

    /* marker ring (two passes) and the arrow */
    var seed = idx + 3;
    addPath(scribbleRect(box.left - 4, box.top - 4, hw + 8, hh + 8, seed), 'circle');
    addPath(scribbleRect(box.left - 8, box.top - 7, hw + 16, hh + 14, seed, true), 'circle two');

    var bc = [bx + bw / 2, by + bh / 2];
    var end = nearestOnRect({ left: box.left - 10, right: box.right + 10, top: box.top - 10, bottom: box.bottom + 10 }, bc[0], bc[1]);
    var start = nearestOnRect({ left: bx, right: bx + bw, top: by, bottom: by + bh }, end[0], end[1]);
    var overlaps = !(bx > box.right || bx + bw < box.left || by > box.bottom || by + bh < box.top);
    if (!overlaps && Math.hypot(end[0] - start[0], end[1] - start[1]) > 24) {
      var dx = end[0] - start[0], dy = end[1] - start[1], d = Math.hypot(dx, dy);
      arrow(start[0] + dx / d * 6, start[1] + dy / d * 6, end[0] - dx / d * 6, end[1] - dy / d * 6, seed);
    }
  }

  function schedulePlace() { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); }

  function show(i) {
    idx = Math.max(0, Math.min(steps.length - 1, i));
    var st = steps[idx];
    if (st.go && goFn) goFn(st.go, true);
    $('#tourStep').textContent = I18N.t('tour.step', { n: idx + 1, total: steps.length });
    $('#tourText').textContent = st.text;
    $('#tourPrev').style.visibility = idx === 0 ? 'hidden' : 'visible';
    $('#tourNext').textContent = idx === steps.length - 1 ? I18N.t('tut.done') : I18N.t('tut.next');
    $('#tourSkip').style.visibility = idx === steps.length - 1 ? 'hidden' : 'visible';
    var target = st.sel ? document.querySelector(st.sel) : null;
    if (target && visible(target)) { try { target.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) { target.scrollIntoView(); } }
    else if (!st.sel) window.scrollTo(0, 0);
    schedulePlace();
    setTimeout(place, 120);   // once more, after layout and scrolling settle
    setTimeout(place, 420);
  }

  function start(list, opts) {
    steps = list; opts = opts || {};
    goFn = opts.go || null; onClose = opts.onClose || null;
    active = true;
    $('#tour').classList.remove('hidden');
    document.body.classList.add('noscroll');
    show(0);
  }

  function stop() {
    if (!active) return;
    active = false;
    $('#tour').classList.add('hidden'); $('#tourSvg').innerHTML = '';
    document.body.classList.remove('noscroll');
    if (onClose) onClose();
  }

  function next() { if (idx >= steps.length - 1) stop(); else show(idx + 1); }
  function prev() { if (idx > 0) show(idx - 1); }

  function init() {
    $('#tourNext').addEventListener('click', next);
    $('#tourPrev').addEventListener('click', prev);
    $('#tourSkip').addEventListener('click', stop);
    window.addEventListener('resize', schedulePlace);
    window.addEventListener('scroll', schedulePlace, { passive: true });
    document.addEventListener('keydown', function (ev) {
      if (!active) return;
      if (ev.key === 'Escape') stop();
      else if (ev.key === 'ArrowRight' || ev.key === 'Enter') { ev.preventDefault(); next(); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); prev(); }
    });
  }

  window.Tour = { init: init, start: start, stop: stop, get active() { return active; }, refresh: schedulePlace };
})();
