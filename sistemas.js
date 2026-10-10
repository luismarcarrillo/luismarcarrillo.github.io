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
  var colors = ['#2b0057', '#4b005c', '#79004d', '#a41f36', '#d3521b', '#f59b15', '#fce854'];

  function resize() {
    var box = canvas.getBoundingClientRect();
    scale = window.devicePixelRatio || 1;
    width = Math.max(320, box.width);
    height = Math.max(260, box.height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function thomas(point, step) {
    var b = 0.208186;
    return {
      x: (Math.sin(point.y) - b * point.x) * step,
      y: (Math.sin(point.z) - b * point.y) * step,
      z: (Math.sin(point.x) - b * point.z) * step
    };
  }

  function project(point) {
    var angle = -0.52;
    var rotatedX = point.x * Math.cos(angle) - point.z * Math.sin(angle);
    var rotatedZ = point.x * Math.sin(angle) + point.z * Math.cos(angle);
    var scaleFactor = Math.min(width / 10, height / 10);
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
        point: { x: 0.1 + i * 0.05, y: 0.1 + i * 0.05, z: 0.1 },
        trail: [],
        color: colors[i % colors.length]
      });
    }
  }

  function stepParticle(particle, delta) {
    var change = thomas(particle.point, 0.1 * delta);
    particle.point.x += change.x;
    particle.point.y += change.y;
    particle.point.z += change.z;
    particle.trail.push({
      x: particle.point.x,
      y: particle.point.y,
      z: particle.point.z
    });
    if (particle.trail.length > 200) particle.trail.shift();
    if (Math.abs(particle.point.x) > 10 || Math.abs(particle.point.y) > 10) {
      particle.point = { x: 0.1, y: 0.1, z: 0.1 };
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
