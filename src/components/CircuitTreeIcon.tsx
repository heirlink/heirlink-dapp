"use client";

/**
 * Circuit-tree icon — стилизованное дерево в эстетике печатной платы.
 * Символизирует наследие (дерево) и технологии (схемы).
 */
export function CircuitTreeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Корни — переплетённые линии внизу */}
      <path
        d="M60 100 L45 130 M60 100 L55 130 M60 100 L75 130 M60 100 L65 130"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M60 100 L40 120 M60 100 L80 120"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Ствол */}
      <path
        d="M60 100 L60 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Ветви — как трассы на плате */}
      <path
        d="M60 50 L35 25 M60 50 L85 30 M60 50 L30 45 M60 50 L90 45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M60 50 L45 70 M60 50 L75 68"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Узлы — круги на концах ветвей */}
      <circle cx="35" cy="25" r="4" fill="currentColor" />
      <circle cx="85" cy="30" r="4" fill="currentColor" />
      <circle cx="30" cy="45" r="4" fill="currentColor" />
      <circle cx="90" cy="45" r="4" fill="currentColor" />
      <circle cx="45" cy="70" r="3" fill="currentColor" />
      <circle cx="75" cy="68" r="3" fill="currentColor" />
    </svg>
  );
}
