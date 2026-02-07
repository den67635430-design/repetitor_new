import React from 'react';

interface MathData {
  left: number;
  operator: string;
  right: number;
  result: string; // number or "?"
  emoji: string;
}

interface Props {
  expression: string; // e.g. "4+4=?:🍎" or "3-1=2:🍬"
}

function parseExpression(expr: string): MathData | null {
  // Format: number±number=result:emoji
  const match = expr.match(/^(\d+)\s*([+\-])\s*(\d+)\s*=\s*(\?|\d+)\s*:\s*(.+)$/);
  if (!match) return null;

  return {
    left: parseInt(match[1], 10),
    operator: match[2] === '+' ? '+' : '−',
    right: parseInt(match[3], 10),
    result: match[4],
    emoji: match[5].trim(),
  };
}

function ObjectGroup({ count, emoji, startDelay = 0 }: { count: number; emoji: string; startDelay?: number }) {
  // Arrange objects in rows of 5
  const rows: number[] = [];
  let remaining = Math.min(count, 20); // Cap at 20
  while (remaining > 0) {
    const rowSize = Math.min(remaining, 5);
    rows.push(rowSize);
    remaining -= rowSize;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {rows.map((rowCount, rowIdx) => (
        <div key={rowIdx} className="flex gap-0.5">
          {Array.from({ length: rowCount }).map((_, i) => {
            const globalIndex = rows.slice(0, rowIdx).reduce((a, b) => a + b, 0) + i;
            return (
              <span
                key={i}
                className="text-2xl animate-pop-in inline-block"
                style={{
                  animationDelay: `${startDelay + globalIndex * 150}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      ))}
      <span className="text-xs font-bold text-slate-600 mt-0.5">{count}</span>
    </div>
  );
}

const MathVisualization: React.FC<Props> = ({ expression }) => {
  const data = parseExpression(expression);
  if (!data) return null;

  const rightDelay = data.left * 150 + 400;
  const resultDelay = rightDelay + data.right * 150 + 400;

  return (
    <div className="my-3">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Left group */}
          <ObjectGroup count={data.left} emoji={data.emoji} startDelay={200} />

          {/* Operator */}
          <span
            className="text-3xl font-bold text-blue-600 animate-pop-in"
            style={{ animationDelay: `${data.left * 150 + 300}ms`, animationFillMode: 'backwards' }}
          >
            {data.operator}
          </span>

          {/* Right group */}
          <ObjectGroup count={data.right} emoji={data.emoji} startDelay={rightDelay} />

          {/* Equals */}
          <span
            className="text-3xl font-bold text-blue-600 animate-pop-in"
            style={{ animationDelay: `${resultDelay - 200}ms`, animationFillMode: 'backwards' }}
          >
            =
          </span>

          {/* Result */}
          <span
            className="animate-pop-in"
            style={{ animationDelay: `${resultDelay}ms`, animationFillMode: 'backwards' }}
          >
            {data.result === '?' ? (
              <span className="text-4xl font-bold text-orange-500 animate-pulse">❓</span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-green-600">{data.result}</span>
                <span className="text-lg">✅</span>
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MathVisualization;
