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

  // 0. Bersihkan semua variasi baris judul 'Catatan Kosakata / Kaidah' agar tidak dobel/tumpang-tindih
  text = text.replace(
    /^[ \t]*(?:[-*•]\s*)?(?:\*{1,3})?(?:💡|📖)?\s*(?:\*{1,3})?Catatan\s+(?:Kosakata|Kaidah|Mufradat)(?:[ \t]*[/&][ \t]*(?:Kosakata|Kaidah|Mufradat))?(?:[ \t]*\([^)]+\))?:?(?:\*{1,3})?[ \t]*\n*/gim,
    ""
  );

  // 1. Pisahkan bullet inline (misal "text. • Kata ...") menjadi baris baru list markdown (- )
  text = text.replace(/([.!?)]|[^\n])\s+[•●◦⁃]\s+/g, "$1\n\n- ");

  // 2. Ubah bullet di awal baris menjadi list item markdown (- )
  text = text.replace(/^[ \t]*[•●◦⁃][ \t]*/gm, "- ");

  // 3. Pastikan ada baris kosong sebelum list markdown agar tidak tergabung ke teks sebelumnya
  text = text.replace(/([^\n])\n(- [^\n]+)/g, "$1\n\n$2");

  // 4. Pastikan ada baris kosong sebelum Fokus Tata Bahasa
  text = text.replace(/([^\n])\n+(\*?\*?Fokus Tata Bahasa)/gi, "$1\n\n$2");

  // 5. Collapse accidental blank lines inside tables (between rows starting and ending with |)
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
    <div className="formatted-message-container text-xs sm:text-sm leading-relaxed break-words text-left" dir="ltr">
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

            const isFokusTataBahasa = /Fokus Tata Bahasa/i.test(rawText);
            if (isFokusTataBahasa && theme === "amber") {
              return (
                <div className="mt-3.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/35 text-amber-200 text-xs sm:text-sm leading-relaxed shadow-sm text-left" dir="ltr">
                  {children}
                </div>
              );
            }

            return (
              <p
                className={`mb-2 last:mb-0 text-left ${
                  isPureArabic
                    ? "font-serif text-base sm:text-lg text-emerald-200 leading-loose text-right"
                    : "text-slate-200 leading-relaxed text-left"
                }`}
                dir={isPureArabic ? "rtl" : "ltr"}
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
            <h1 className="text-base sm:text-lg font-bold text-slate-100 mt-3 mb-1.5 border-b border-slate-800 pb-1 text-left" dir="ltr">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-slate-100 mt-2.5 mb-1 border-b border-slate-800/60 pb-0.5 text-left" dir="ltr">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-xs sm:text-sm font-bold ${accentColor} mt-2 mb-1 text-left`} dir="ltr">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul
              className={
                theme === "amber"
                  ? "my-2.5 space-y-2 list-none p-0 text-left"
                  : "list-disc pl-5 my-1.5 space-y-1 text-slate-300 text-left"
              }
              dir="ltr"
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-1 text-slate-300 text-left" dir="ltr">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            if (theme === "amber") {
              return (
                <li className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-amber-500/25 text-slate-200 text-xs sm:text-sm shadow-sm hover:border-amber-500/40 transition-colors leading-relaxed flex items-start gap-2.5 text-left" dir="ltr">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0 text-left" dir="ltr">{children}</div>
                </li>
              );
            }
            return <li className="leading-relaxed text-left" dir="ltr">{children}</li>;
          },
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
