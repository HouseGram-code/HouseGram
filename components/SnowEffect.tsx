
import React, { useMemo } from 'react';

const SnowEffect: React.FC = () => {
  // Generate static random values for snowflakes to prevent re-renders recalculating
  const snowflakes = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 5 + 8}s`, // 8-13 seconds (slower, smoother)
      animationDelay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.6 + 0.2, // Random opacity for depth
      size: `${Math.random() * 4 + 3}px`, // Varied sizes (3px - 7px)
      swayDuration: `${Math.random() * 3 + 2}s`
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-10px] rounded-full bg-white blur-[1px]"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animation: `snow-fall ${flake.animationDuration} linear infinite, snow-sway ${flake.swayDuration} ease-in-out infinite`,
            animationDelay: flake.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

export default SnowEffect;
