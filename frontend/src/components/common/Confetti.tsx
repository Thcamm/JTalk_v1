"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  wobble: number;
  vWobble: number;
  opacity: number;
  shape: "rect" | "circle";
}

const FESTIVE_COLORS = [
  "#f43f5e", // Rose 500
  "#fb7185", // Rose 400
  "#f59e0b", // Amber 500
  "#fbbf24", // Amber 400
  "#10b981", // Emerald 500
  "#06b6d4", // Cyan 500
  "#6366f1", // Indigo 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
];

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  duration = 3500,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize confetti particles launched from 2 lower corners and center
    const particleCount = 100;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Half from left, half from right
      const fromLeft = i % 2 === 0;
      particles.push({
        x: fromLeft ? width * 0.15 : width * 0.85,
        y: height * 0.65,
        w: Math.random() * 8 + 6,
        h: Math.random() * 8 + 6,
        color: FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)],
        vx: (fromLeft ? 1 : -1) * (Math.random() * 7 + 4) + (Math.random() * 4 - 2),
        vy: -(Math.random() * 12 + 10),
        angle: Math.random() * Math.PI * 2,
        vAngle: Math.random() * 0.2 - 0.1,
        wobble: 0,
        vWobble: Math.random() * 0.1 + 0.05,
        opacity: 1,
        shape: Math.random() > 0.4 ? "rect" : "circle",
      });
    }

    const startTime = performance.now();
    let animId: number;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Apply physics: gravity + air friction
        p.vy += 0.38; // gravity
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.vAngle;
        p.wobble += p.vWobble;

        // Fade out in the last 25% of duration
        if (progress > 0.75) {
          p.opacity = Math.max(0, 1 - (progress - 0.75) / 0.25);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        const wobbleScale = Math.cos(p.wobble);

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.abs((p.w / 2) * wobbleScale), p.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(
            (-p.w / 2) * wobbleScale,
            -p.h / 2,
            p.w * wobbleScale,
            p.h
          );
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.clearRect(0, 0, width, height);
    };
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default Confetti;
