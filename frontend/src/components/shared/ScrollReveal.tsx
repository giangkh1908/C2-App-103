"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: "fadeUp" | "fadeIn" | "scaleIn";
  delay?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  animation = "fadeUp",
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add("visible");
          }, delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const animClass =
    animation === "fadeUp"
      ? "reveal"
      : animation === "fadeIn"
        ? "reveal reveal-fade"
        : "reveal reveal-scale";

  return (
    <div ref={ref} className={`${animClass} ${className}`}>
      {children}
    </div>
  );
}
