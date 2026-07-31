import { useEffect, useRef } from 'react';

/**
 * AuthParticles — ambient canvas particle system for the auth background.
 * Renders ~40 floating golden orbs with gentle mouse-reactive parallax.
 * GPU-friendly: uses requestAnimationFrame, throttled to ~30fps.
 */
export function AuthParticles() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 30; // cap at 30fps

    // Sizing
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const onMouseMove = (e) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Particle pool
    const PARTICLE_COUNT = 42;
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.2 + Math.random() * 3.5,
      opacity: 0.025 + Math.random() * 0.1,
      vx: (Math.random() - 0.5) * 0.0004,
      vy: -0.0001 - Math.random() * 0.0004,
      parallax: 0.3 + Math.random() * 0.7,
      hue: 35 + Math.random() * 18, // warm gold range
    }));

    // A few larger "bokeh" orbs
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        r: 8 + Math.random() * 18,
        opacity: 0.012 + Math.random() * 0.025,
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00015,
        parallax: 0.15 + Math.random() * 0.3,
        hue: 38 + Math.random() * 12,
      });
    }

    const draw = (now) => {
      animId = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      const cw = w();
      const ch = h();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, cw, ch);

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }

        // Parallax offset from mouse
        const offsetX = (mx - 0.5) * 30 * p.parallax;
        const offsetY = (my - 0.5) * 20 * p.parallax;

        const drawX = p.x * cw + offsetX;
        const drawY = p.y * ch + offsetY;

        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);

        if (p.r > 7) {
          // Bokeh orbs get a radial gradient
          const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.r);
          grad.addColorStop(0, `hsla(${p.hue}, 72%, 62%, ${p.opacity * 1.6})`);
          grad.addColorStop(1, `hsla(${p.hue}, 72%, 62%, 0)`);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = `hsla(${p.hue}, 68%, 66%, ${p.opacity})`;
        }

        ctx.fill();
      }
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="auth-particles"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
