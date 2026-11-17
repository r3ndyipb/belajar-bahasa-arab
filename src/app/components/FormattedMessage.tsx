"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FormattedMessageProps {
  content: string;
  theme?: "sky" | "emerald" | "slate" | "amber";
}

// Helper to safely extract plain text from React nodes (handles strings, numbers, arrays, elements)
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node) && (node.props as { children?: React.ReactNode })?.children) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

// Pre-process markdown content to fix table parsing & LLM anomalies without breaking table syntax
function sanitizeMarkdown(content: string): string {
  if (!content) return "";

  let text = content.replace(/\r\n/g, "\n");

  // 1. Collapse accidental blank lines inside tables (between rows starting and ending with |)
  while (/(\|[^\n]+\|)[ \t]*\n[ \t]*\n+(?=[ \t]*\|)/.test(text)) {
    text = text.replace(/(\|[^\n]+\|)[ \t]*\n[ \t]*\n+(?=[ \t]*\|)/g, "$1\n");
  }

  // 2. Ensure blank line before table starts if previous line is non-empty text and not a table row
  text = text.replace(
    /([^\n|])[ \t]*\n(?=[ \t]*\|[^\n]+\|[ \t]*\n[ \t]*\|[ \t]*(?::?-+:?[ \t]*\|)+)/g,
    "$1\n\n"
  );

  // 3. Ensure blank line after table ends if next line is non-empty text and not a table row
  text = text.replace(
    /(^[ \t]*\|[^\n]+\|[ \t]*)\n(?![ \t]*\||\s*$)([^\n])/gm,
    "$1\n\n$2"
  );

  // 4. Clean up repetitive asterisks artifacts (e.g. ****text**** -> **text**)
  text = text.replace(/\*{3,}/g, "**");
  text = text.replace(/\*\*\s*\*\*/g, "");

  return text;
}

export default function FormattedMessage({
  content,
  theme = "sky",
}: FormattedMessageProps) {
  const sanitized = sanitizeMarkdown(content);

  const accentColor =
    theme === "emerald"
      ? "text-emerald-300"
      : theme === "amber"
      ? "text-amber-300"
      : theme === "slate"
      ? "text-teal-200"
      : "text-sky-300";

  const firstColColor =
    theme === "emerald"
      ? "first:text-emerald-300/90"
      : theme === "amber"
      ? "first:text-amber-300/90"
      : "first:text-sky-300/90";

  const tableHeaderBg =
    theme === "emerald"
      ? "bg-emerald-950/80 text-emerald-200 border-emerald-900/60"
      : theme === "amber"
      ? "bg-amber-950/80 text-amber-200 border-amber-900/60"
      : theme === "slate"
      ? "bg-slate-800 text-slate-200 border-slate-700"
      : "bg-sky-950/80 text-sky-200 border-sky-900/60";

  return (
    <div className="formatted-message-container text-xs sm:text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-md">
              <table className="w-full min-w-[340px] text-xs text-left border-collapse border-spacing-0">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              className={`${tableHeaderBg} border-b border-slate-700/80 font-semibold text-xs tracking-wide`}
            >
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/70">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-800/40 transition-colors odd:bg-slate-900/30 even:bg-slate-900/70">
              {children}
            </tr>
          ),
          th: ({ children }) => {
            const raw = extractText(children);
            const hasArabic = /[\u0600-\u06FF]/.test(raw);
            return (
              <th
                className={`px-3 py-2.5 font-bold text-xs border-r border-slate-800/80 last:border-r-0 ${accentColor} align-middle text-left`}
                dir={hasArabic ? "auto" : "ltr"}
              >
                {children}
              </th>
            );
          },
          td: ({ children }) => {
            const rawText = extractText(children);
            const arabicChars = rawText.match(/[\u0600-\u06FF]/g) || [];
            const latinChars = rawText.match(/[a-zA-Z]/g) || [];
            const isPureArabic = arabicChars.length > 0 && latinChars.length === 0;

            return (
              <td
                className={`px-3 py-2.5 text-slate-200 border-r border-slate-800/60 last:border-r-0 align-top leading-relaxed first:font-medium ${firstColColor} first:bg-slate-950/40 ${
                  isPureArabic
                    ? "font-serif text-sm sm:text-base text-emerald-300 font-semibold text-center leading-relaxed"
                    : "text-xs"
                }`}
                dir={isPureArabic ? "rtl" : "auto"}
              >
                {children}
              </td>
            );
          },
          p: ({ children }) => {
            const rawText = extractText(children);
            const arabicChars = rawText.match(/[\u0600-\u06FF]/g) || [];
            const latinChars = rawText.match(/[a-zA-Z]/g) || [];
            const isPureArabic = arabicChars.length > 0 && latinChars.length === 0;

            return (
              <p
                className={`mb-2 last:mb-0 ${
                  isPureArabic
                    ? "font-serif text-base sm:text-lg text-emerald-200 leading-loose text-right"
                    : "text-slate-200 leading-relaxed"
                }`}
                dir={isPureArabic ? "rtl" : "auto"}
              >
                {children}
              </p>
            );
          },
          strong: ({ children }) => (
            <strong className={`font-bold ${accentColor}`}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-teal-300 font-medium">{children}</em>
          ),
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-slate-100 mt-3 mb-1.5 border-b border-slate-800 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-slate-100 mt-2.5 mb-1 border-b border-slate-800/60 pb-0.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-xs sm:text-sm font-bold ${accentColor} mt-2 mb-1`}>
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-1 text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-1 text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-sky-500 pl-3 my-2 text-slate-300 italic bg-slate-900/50 py-1 rounded-r-lg">
              {children}
            </blockquote>
          ),
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
