"use client";

import katex from "katex";
import { Fragment, useMemo } from "react";

import { cn } from "@/lib/utils";

interface MathTextProps {
  value: string;
  className?: string;
  forceMath?: boolean;
}

type TextPart = { kind: "text"; value: string };
type MathPart = { kind: "math"; value: string; display: boolean };
type TablePart = { kind: "table"; rows: string[][] };
type Part = TextPart | MathPart | TablePart;

const mathDelimiterPattern = /(\\begin\{tabular\}\{[^}]*\}[\s\S]*?\\end\{tabular\}|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]*?\$)/g;

const removeSimpleMarkdown = (value: string) => value.replace(/\*\*([\s\S]*?)\*\*/g, "$1");

const parseTabular = (value: string) => value
  .replace(/^\\begin\{tabular\}\{[^}]*\}/, "")
  .replace(/\\end\{tabular\}$/, "")
  .split(/\\\\/)
  .map(row => row.replace(/\\hline/g, "").trim())
  .filter(Boolean)
  .map(row => row.split("&").map(cell => cell.trim()));

const splitMath = (value: string): Part[] => {
  const cleaned = removeSimpleMarkdown(value);
  const parts: Part[] = [];
  let cursor = 0;

  for (const match of Array.from(cleaned.matchAll(mathDelimiterPattern))) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ kind: "text", value: cleaned.slice(cursor, index) });

    const token = match[0];
    if (token.startsWith("\\begin{tabular}")) {
      parts.push({ kind: "table", rows: parseTabular(token) });
      cursor = index + token.length;
      continue;
    }
    const display = token.startsWith("$$") || token.startsWith("\\[");
    const expression = token.startsWith("$$")
      ? token.slice(2, -2)
      : token.startsWith("\\[") || token.startsWith("\\(")
        ? token.slice(2, -2)
        : token.slice(1, -1);

    parts.push({ kind: "math", value: expression.trim(), display });
    cursor = index + token.length;
  }

  if (cursor < cleaned.length) parts.push({ kind: "text", value: cleaned.slice(cursor) });
  return parts.length ? parts : [{ kind: "text", value: cleaned }];
};

const renderMath = (value: string, displayMode = false) => katex.renderToString(value, {
  displayMode,
  throwOnError: false,
  strict: "ignore",
  trust: false,
  output: "html",
});

export const MathText = ({ value, className, forceMath = false }: MathTextProps) => {
  const parts = useMemo<Part[]>(() => forceMath
    ? [{ kind: "math", value: value.replace(/^\$+|\$+$/g, "").trim(), display: false }]
    : splitMath(value), [forceMath, value]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, index) => part.kind === "text" ? (
        <Fragment key={`${index}-${part.value}`}>{part.value}</Fragment>
      ) : part.kind === "table" ? (
        <span key={`table-${index}`} className="my-4 block max-w-full overflow-x-auto rounded-md border">
          <table className="w-full min-w-[620px] border-collapse bg-background text-sm">
            <tbody>
              {part.rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join("-")}`} className={rowIndex === 0 ? "bg-muted/60 font-semibold" : "border-t"}>
                  {row.map((cell, cellIndex) => rowIndex === 0 ? (
                    <th key={`${cellIndex}-${cell}`} className="border-r px-3 py-2 text-center last:border-r-0">{cell}</th>
                  ) : (
                    <td key={`${cellIndex}-${cell}`} className={cn("border-r px-3 py-2 text-center last:border-r-0", cellIndex === 0 && "font-medium")}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </span>
      ) : (
        <span
          key={`${index}-${part.value}`}
          className={cn("max-w-full", part.display ? "my-2 block overflow-x-auto" : "inline")}
          dangerouslySetInnerHTML={{ __html: renderMath(part.value, part.display) }}
        />
      ))}
    </span>
  );
};
