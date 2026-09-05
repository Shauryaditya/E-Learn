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
  forceMath?: boolean;
}

const mathPattern = /\\\(|\\\[|\$\$|\\(?:frac|sqrt|sum|int|lim|theta|alpha|beta|gamma|delta|lambda|phi|pi|times|div|cdot|leq|geq|neq|approx|sin|cos|tan|log|ln|vec|overline|underline|hat|bar|left|right|begin|end)\b|[_^]\{/;

const shouldRenderAsMath = (value: string) => mathPattern.test(value);

const asInlineMath = (value: string, forceMath = false) => {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (!forceMath && !shouldRenderAsMath(trimmed)) return trimmed;
  if (trimmed.includes("\\(") || trimmed.includes("$$")) return trimmed;

  return `\\(${trimmed}\\)`;
};

export const MathText = ({ value, className, forceMath = false }: MathTextProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  const renderMath = useCallback(() => {
    if (!ref.current) return;

    ref.current.textContent = asInlineMath(value, forceMath);

    if (!forceMath && !shouldRenderAsMath(value)) {
      return;
    }

    window.MathJax?.typesetPromise?.([ref.current]).catch(() => undefined);
  }, [forceMath, value]);

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
        {asInlineMath(value, forceMath)}
      </span>
    </>
  );
};
