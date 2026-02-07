import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getCharacterStrokes } from './letterStrokes';

interface Props {
  character: string;
}

const STROKE_DURATION = 900; // ms per stroke
const STROKE_GAP = 200;     // pause between strokes
const START_DELAY = 350;     // delay before animation starts

const WritingAnimation: React.FC<Props> = ({ character }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const [strokeLengths, setStrokeLengths] = useState<number[]>([]);
  const [progress, setProgress] = useState(-1);
  const [measured, setMeasured] = useState(false);

  const strokes = useMemo(() => getCharacterStrokes(character), [character]);

  const totalDuration = strokes
    ? strokes.length * STROKE_DURATION + Math.max(0, strokes.length - 1) * STROKE_GAP
    : 2200;

  // ---- Reset & measure stroke lengths ----
  useEffect(() => {
    setProgress(-1);
    setMeasured(false);
    setStrokeLengths([]);
    cancelAnimationFrame(animRef.current);

    if (!strokes) {
      setMeasured(true);
      return;
    }

    // Wait one frame so paths are rendered
    const raf = requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const lengths: number[] = strokes.map((_, i) => {
        const path = svg.querySelector(`[data-stroke="${i}"]`) as SVGPathElement | null;
        return path ? path.getTotalLength() : 100;
      });
      setStrokeLengths(lengths);
      setMeasured(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [character, strokes]);

  // ---- Run animation loop ----
  useEffect(() => {
    if (!measured) return;

    const timer = setTimeout(() => {
      startRef.current = 0;

      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now;
        const elapsed = now - startRef.current;
        const p = Math.min(elapsed / totalDuration, 1);
        setProgress(p);
        if (p < 1) {
          animRef.current = requestAnimationFrame(tick);
        }
      };

      animRef.current = requestAnimationFrame(tick);
    }, START_DELAY);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
    };
  }, [measured, totalDuration]);

  // ---- Per-stroke progress (0→1) ----
  const strokeProgress = useCallback(
    (index: number): number => {
      if (progress < 0) return 0;
      const start = index * (STROKE_DURATION + STROKE_GAP);
      const end = start + STROKE_DURATION;
      const t = progress * totalDuration;
      if (t <= start) return 0;
      if (t >= end) return 1;
      return (t - start) / STROKE_DURATION;
    },
    [progress, totalDuration],
  );

  // ---- Pen position ----
  const getPenPos = useCallback((): { x: number; y: number } | null => {
    if (!strokes || progress < 0 || progress >= 1) return null;
    const svg = svgRef.current;
    if (!svg) return null;

    for (let i = 0; i < strokes.length; i++) {
      const sp = strokeProgress(i);
      if (sp > 0 && sp < 1 && strokeLengths[i]) {
        const path = svg.querySelector(`[data-stroke="${i}"]`) as SVGPathElement | null;
        if (path) {
          const pt = path.getPointAtLength(sp * strokeLengths[i]);
          return { x: pt.x, y: pt.y };
        }
      }
    }
    return null;
  }, [strokes, progress, strokeProgress, strokeLengths]);

  const penPos = getPenPos();
  const isAnimating = progress >= 0 && progress < 1;

  // ===== RENDER: Path-based strokes =====
  if (strokes) {
    return (
      <div className="my-3 flex flex-col items-center">
        <div className="relative bg-amber-50 border-2 border-amber-200 rounded-xl w-48 h-48 flex items-center justify-center overflow-hidden">
          {/* Notebook ruled lines */}
          <NotebookLines />

          {/* Dashed guide outline */}
          <svg viewBox="0 0 100 100" className="absolute" style={svgStyle}>
            {strokes.map((d, i) => (
              <path
                key={`guide-${i}`}
                d={d}
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1.2"
                strokeDasharray="3 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {/* Animated ink strokes */}
          <svg ref={svgRef} viewBox="0 0 100 100" className="absolute" style={svgStyle}>
            {strokes.map((d, i) => {
              const sp = strokeProgress(i);
              const len = strokeLengths[i] || 300;
              return (
                <path
                  key={`stroke-${i}`}
                  data-stroke={i}
                  d={d}
                  fill="none"
                  stroke="#1e40af"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - sp)}
                />
              );
            })}
          </svg>

          {/* Pen cursor following stroke */}
          {penPos && isAnimating && (
            <PenCursor x={penPos.x} y={penPos.y} />
          )}
        </div>

        <span className="mt-2 text-xs text-slate-500 font-medium">
          ✏️ Пишем: «{character}»
        </span>
      </div>
    );
  }

  // ===== FALLBACK: Text-based stroke tracing (for unknown chars) =====
  return <FallbackWriting character={character} progress={progress} />;
};

// ---- Shared styles ----
const svgStyle: React.CSSProperties = {
  width: 144,
  height: 144,
  overflow: 'visible',
};

// ---- Sub-components ----

function NotebookLines() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-0 right-0 bottom-[30%] border-b-2 border-red-300/40" />
      <div className="absolute left-0 right-0 bottom-[50%] border-b border-blue-300/20" />
      <div className="absolute left-0 right-0 bottom-[70%] border-b border-blue-300/20" />
    </div>
  );
}

/**
 * Pen icon positioned in SVG-coordinate space.
 * Container is 192×192 (w-48 h-48), SVG is 144×144 centered.
 * SVG top-left = (24, 24). Scale = 144/100 = 1.44.
 */
function PenCursor({ x, y }: { x: number; y: number }) {
  const px = 24 + x * 1.44;
  const py = 24 + y * 1.44;

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: px,
        top: py,
        transformOrigin: '3px 21px',
        transform: 'translate(-3px, -21px) rotate(-35deg)',
      }}
    >
      <svg
        className="w-6 h-6 text-amber-700 drop-shadow-md"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </div>
  );
}

/** Fallback for characters without stroke-path data — thin text outline tracing */
function FallbackWriting({ character, progress }: { character: string; progress: number }) {
  const phase = progress >= 1 ? 'filled' : progress >= 0 ? 'tracing' : 'idle';

  return (
    <div className="my-3 flex flex-col items-center">
      <div className="relative bg-amber-50 border-2 border-amber-200 rounded-xl w-48 h-48 flex items-center justify-center overflow-hidden">
        <NotebookLines />

        {/* Dashed outline */}
        <svg viewBox="0 0 120 120" className="absolute w-32 h-32" style={{ overflow: 'visible' }}>
          <text
            x="50%" y="55%"
            dominantBaseline="middle" textAnchor="middle"
            fontSize="90" fontFamily="'Times New Roman', serif" fontWeight="bold"
            fill="none" stroke="#d1d5db" strokeWidth="1" strokeDasharray="3 3"
          >
            {character}
          </text>
        </svg>

        {/* Animated trace */}
        <svg viewBox="0 0 120 120" className="absolute w-32 h-32" style={{ overflow: 'visible' }}>
          <text
            x="50%" y="55%"
            dominantBaseline="middle" textAnchor="middle"
            fontSize="90" fontFamily="'Times New Roman', serif" fontWeight="bold"
            fill={phase === 'filled' ? '#1e40af' : 'none'}
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeDasharray="600"
            strokeDashoffset={phase === 'tracing' ? undefined : '0'}
            className={phase === 'tracing' ? 'animate-draw-stroke' : ''}
            style={{ transition: phase === 'filled' ? 'fill 0.5s ease-in' : undefined }}
          >
            {character}
          </text>
        </svg>
      </div>

      <span className="mt-2 text-xs text-slate-500 font-medium">
        ✏️ Пишем: «{character}»
      </span>
    </div>
  );
}

export default WritingAnimation;
