// Two imaginary roadies, safely on opposite sides of the cabinet.
export function pyroLayout(rect, viewportWidth, viewportHeight) {
  const margin = Math.max(0, Math.min(rect.left, viewportWidth - rect.right));
  const radius = Math.max(2, Math.min(34, (margin - 4) / 2));
  const y = Math.min(viewportHeight - 22, rect.bottom - 32);
  return {
    left: { x: margin / 2, y },
    right: { x: viewportWidth - margin / 2, y },
    radius,
    rise: Math.min(viewportHeight * .47, 270),
    sparkRise: Math.min(viewportHeight * .94, y - 8),
    sparkSpread: Math.min(14, Math.max(3, margin * .12)),
  };
}

export function burstEnvelope(progress) {
  if (progress < .08 || progress >= .85) return 0;
  if (progress < .23) return (progress - .08) / .15;
  if (progress < .55) return 1;
  return (.85 - progress) / .3;
}

export function sparkTravel(progress, rise, falling) {
  const climbed = Math.min(1, progress / .7) * rise;
  if (!falling || progress <= .7) return climbed;
  const descent = ((progress - .7) / .3) ** 2 * rise * .37;
  return climbed - descent;
}

function glowingOrb(ctx, x, y, radius, alpha, colors) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${colors[0]},${alpha})`);
  glow.addColorStop(.25, `rgba(${colors[1]},${alpha * .9})`);
  glow.addColorStop(.62, `rgba(${colors[2]},${alpha * .55})`);
  glow.addColorStop(1, `rgba(${colors[2]},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function paintStation(ctx, origin, layout, phase, energy, overdrive, side, ampRect, viewportWidth, viewportHeight) {
  ctx.save();
  ctx.beginPath();
  if (side === 0) ctx.rect(0, 0, Math.max(0, ampRect.left - 3), viewportHeight);
  else ctx.rect(Math.min(viewportWidth, ampRect.right + 3), 0, viewportWidth - ampRect.right, viewportHeight);
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';

  const pulse = burstEnvelope(phase);
  const radius = layout.radius * (1 + energy * .18);
  if (pulse > 0) {
    const rise = layout.rise * Math.pow(phase, .78);
    const ballY = origin.y - rise;
    const wander = Math.sin(phase * 21 + side * 3) * Math.min(4, radius * .14);
    for (let i = 15; i >= 0; i -= 1) {
      const lag = i / 16;
      const x = origin.x + wander * (1 - lag) + Math.sin(i * 2.1 + phase * 18 + side) * radius * .22;
      const y = Math.min(origin.y, ballY + i * Math.max(7, radius * .33));
      glowingOrb(ctx, x, y, radius * (1.2 - lag * .72), pulse * (.65 - lag * .35), ['255,245,178', '255,130,24', '215,30,15']);
    }
    glowingOrb(ctx, origin.x + wander, ballY, radius * 2.45, pulse * .5, ['255,239,146', '255,116,18', '225,34,9']);
    glowingOrb(ctx, origin.x + wander, ballY, radius * 1.1, pulse, ['255,255,239', '255,238,105', '255,74,11']);
  }

  // Cold sparks rise nearly the full height, not a sideways fountain.
  const sparkCount = overdrive ? 160 : 95;
  for (let i = 0; i < sparkCount; i += 1) {
    const t = (phase * 1.7 + i * .137 + side * .31) % 1;
    if (t > .98) continue;
    const spread = Math.sin(i * 74.61 + side * 3);
    const falling = i % 3 === 0;
    const distance = sparkTravel(t, layout.sparkRise * (.86 + (i % 7) * .02), falling);
    const x = origin.x + spread * t * layout.sparkSpread + (falling && t > .7 ? spread * (t - .7) * layout.sparkSpread : 0);
    const y = origin.y - distance;
    const alpha = Math.min(1, t * 8) * (1 - t) * (.65 + energy * .35);
    ctx.strokeStyle = `rgba(225,249,255,${alpha})`;
    ctx.shadowBlur = overdrive ? 16 : 11;
    ctx.shadowColor = '#a9eaff';
    ctx.lineWidth = i % 8 === 0 ? 2.7 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x - spread, y + (falling && t > .7 ? -14 : 11 + t * 14));
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function createPyroShow(canvas, amp) {
  const ctx = canvas.getContext('2d');
  let active = false;
  let frame = 0;
  let energy = .35;
  let overdrive = false;

  function render(now) {
    if (!active) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const rect = amp.getBoundingClientRect();
    const layout = pyroLayout(rect, width, height);
    const beat = now / 3000;
    paintStation(ctx, layout.left, layout, beat % 1, energy, overdrive, 0, rect, width, height);
    paintStation(ctx, layout.right, layout, (beat + .48) % 1, energy, overdrive, 1, rect, width, height);
    frame = requestAnimationFrame(render);
  }

  return {
    setActive(next) {
      if (active === next) return;
      active = next;
      if (active) frame = requestAnimationFrame(render);
      else {
        cancelAnimationFrame(frame);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    setEnergy(value) { energy = Math.max(0, Math.min(1, value)); },
    setOverdrive(value) { overdrive = Boolean(value); },
  };
}
