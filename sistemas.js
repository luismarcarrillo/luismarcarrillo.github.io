(function () {
  'use strict';

  var canvas = document.getElementById('sistemas-canvas');
  if (!canvas) return;

  var context = canvas.getContext('2d');
  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var particles = [];
  var width = 0;
  var height = 0;
  var scale = 1;
  var animationFrame;
  var lastTime = 0;
  var colors = {
    ink: '#14161a',
    soft: '#8d7fce',
    faint: '#c3c6cc',
    accent: '#5f4fae',
    teal: '#4fb8c4'
  };

  function resize() {
    var box = canvas.getBoundingClientRect();
    scale = window.devicePixelRatio || 1;
    width = Math.max(320, box.width);
    height = Math.max(260, box.height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function field(x, y) {
    return { x: y, y: -0.8 * x - 0.18 * y };
  }

  function project(x, y) {
    var radius = Math.min(width, height) * 0.34;
    return {
      x: width / 2 + x * radius,
      y: height / 2 - y * radius
    };
  }

  function createParticles() {
    particles = [];
    for (var i = 0; i < 13; i += 1) {
      var angle = (Math.PI * 2 * i) / 13;
      particles.push({
        x: Math.cos(angle) * (0.7 + (i % 3) * 0.1),
        y: Math.sin(angle) * (0.7 + (i % 4) * 0.08),
        trail: [],
        color: i % 3 === 0 ? colors.teal : colors.accent
      });
    }
  }

  function drawArrow(x, y, vector) {
    var start = project(x, y);
    var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y) || 1;
    var size = 0.09;
    var end = project(x + (vector.x / length) * size, y + (vector.y / length) * size);
    var angle = Math.atan2(-(end.y - start.y), end.x - start.x);

    context.strokeStyle = colors.faint;
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();

    context.beginPath();
    context.moveTo(end.x, end.y);
    context.lineTo(end.x - 4 * Math.cos(angle - 0.5), end.y + 4 * Math.sin(angle - 0.5));
    context.moveTo(end.x, end.y);
    context.lineTo(end.x - 4 * Math.cos(angle + 0.5), end.y + 4 * Math.sin(angle + 0.5));
    context.stroke();
  }

  function drawBase() {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = colors.faint;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(18, height / 2);
    context.lineTo(width - 12, height / 2);
    context.moveTo(width / 2, 12);
    context.lineTo(width / 2, height - 12);
    context.stroke();

    for (var x = -1; x <= 1; x += 0.25) {
      for (var y = -1; y <= 1; y += 0.25) {
        drawArrow(x, y, field(x, y));
      }
    }

    context.fillStyle = colors.indigo || colors.accent;
    context.beginPath();
    context.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
    context.fill();
  }

  function drawParticles(delta) {
    particles.forEach(function (particle) {
      if (!reducedMotion) {
        var vector = field(particle.x, particle.y);
        particle.x += vector.x * delta * 0.18;
        particle.y += vector.y * delta * 0.18;
        if (Math.abs(particle.x) > 1.05 || Math.abs(particle.y) > 1.05) {
          particle.x *= -0.82;
          particle.y *= -0.82;
          particle.trail = [];
        }
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 55) particle.trail.shift();
      }

      context.strokeStyle = particle.color;
      context.globalAlpha = 0.7;
      context.lineWidth = 1.2;
      context.beginPath();
      particle.trail.forEach(function (point, index) {
        var position = project(point.x, point.y);
        if (index === 0) context.moveTo(position.x, position.y);
        else context.lineTo(position.x, position.y);
      });
      context.stroke();
      context.globalAlpha = 1;

      var current = project(particle.x, particle.y);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(current.x, current.y, 2.2, 0, Math.PI * 2);
      context.fill();
    });
  }

  function render(time) {
    var delta = Math.min((time - lastTime) / 16.67, 2) || 1;
    lastTime = time;
    drawBase();
    drawParticles(delta);
    if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  createParticles();
  window.requestAnimationFrame(render);
})();
