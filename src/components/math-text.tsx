"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
    };
  }
}

interface MathTextProps {
  value: string;
  className?: string;
}

const asInlineMath = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed.includes("\\(") || trimmed.includes("$$")) return trimmed;

  return `\\(${trimmed}\\)`;
};

export const MathText = ({ value, className }: MathTextProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  const renderMath = useCallback(() => {
    if (!ref.current) return;

    ref.current.textContent = asInlineMath(value);
    window.MathJax?.typesetPromise?.([ref.current]).catch(() => undefined);
  }, [value]);

  useEffect(() => {
    renderMath();
  }, [renderMath]);

  return (
    <>
      <Script id="mathjax-config" strategy="afterInteractive">
        {`
          window.MathJax = {
            tex: {
              inlineMath: [['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$']],
              processEscapes: true
            },
            svg: { fontCache: 'global' }
          };
        `}
      </Script>
      <Script
        id="mathjax-tex-svg"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        strategy="afterInteractive"
        onLoad={renderMath}
      />
      <span ref={ref} className={cn("inline-block", className)}>
        {asInlineMath(value)}
      </span>
    </>
  );
};
