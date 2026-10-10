(function () {
  'use strict';

  var canvas = document.getElementById('sistemas-canvas');
  if (!canvas) return;

  var context = canvas.getContext('2d');
  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var width = 0;
  var height = 0;
  var scale = 1;
  var lastTime = 0;
  var particles = [];
  var colors = ['#5f4fae', '#8955ab', '#1c8f9e', '#4fb8c4'];

  function resize() {
    var box = canvas.getBoundingClientRect();
    scale = window.devicePixelRatio || 1;
    width = Math.max(320, box.width);
    height = Math.max(260, box.height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function lorenz(point, step) {
    return {
      x: 10 * (point.y - point.x) * step,
      y: (point.x * (28 - point.z) - point.y) * step,
      z: (point.x * point.y - (8 / 3) * point.z) * step
    };
  }

  function project(point) {
    var angle = -0.52;
    var rotatedX = point.x * Math.cos(angle) - point.z * Math.sin(angle);
    var rotatedZ = point.x * Math.sin(angle) + point.z * Math.cos(angle);
    var scaleFactor = Math.min(width / 52, height / 58);
    return {
      x: width / 2 + rotatedX * scaleFactor,
      y: height / 2 - (point.y * 0.72 + rotatedZ * 0.42) * scaleFactor,
      depth: rotatedZ
    };
  }

  function seedParticles() {
    particles = [];
    for (var i = 0; i < 7; i += 1) {
      particles.push({
        point: { x: 0.1 + i * 0.02, y: 1 + i * 0.08, z: 1 + i * 0.04 },
        trail: [],
        color: colors[i % colors.length]
      });
    }
  }

  function stepParticle(particle, delta) {
    var change = lorenz(particle.point, 0.005 * delta);
    particle.point.x += change.x;
    particle.point.y += change.y;
    particle.point.z += change.z;
    particle.trail.push({
      x: particle.point.x,
      y: particle.point.y,
      z: particle.point.z
    });
    if (particle.trail.length > 150) particle.trail.shift();
    if (Math.abs(particle.point.x) > 30 || Math.abs(particle.point.y) > 40) {
      particle.point = { x: 0.1, y: 1, z: 1 };
      particle.trail = [];
    }
  }

  function drawParticle(particle) {
    context.strokeStyle = particle.color;
    context.lineWidth = 1.2;
    context.globalAlpha = 0.68;
    context.beginPath();
    particle.trail.forEach(function (point, index) {
      var position = project(point);
      if (index === 0) context.moveTo(position.x, position.y);
      else context.lineTo(position.x, position.y);
    });
    context.stroke();
    context.globalAlpha = 1;

    var current = project(particle.point);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(current.x, current.y, 2.2, 0, Math.PI * 2);
    context.fill();
  }

  function render(time) {
    var delta = Math.min((time - lastTime) / 16.67, 2) || 1;
    lastTime = time;
    context.clearRect(0, 0, width, height);
    particles.forEach(function (particle) {
      if (!reducedMotion) stepParticle(particle, delta);
      drawParticle(particle);
    });
    if (!reducedMotion) window.requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  seedParticles();
  particles.forEach(function (particle) {
    for (var i = 0; i < 420; i += 1) stepParticle(particle, 1);
  });
  window.requestAnimationFrame(render);
})();
