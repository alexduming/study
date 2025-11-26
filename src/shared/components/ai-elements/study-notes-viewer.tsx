'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { cn } from '@/shared/lib/utils';

interface StudyNotesViewerProps {
  content: string;
  className?: string;
}

interface ParsedSection {
  title: string;
  content: string;
}

interface ParsedNotes {
  title?: string;
  intro?: string;
  sections: ParsedSection[];
}

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 text-lg font-semibold text-purple-100">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-1 text-base font-semibold text-blue-100">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-gray-200">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-2 pl-5 text-sm text-gray-200">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-2 pl-5 text-sm text-gray-200">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-purple-400/60 bg-purple-400/5 px-4 py-3 text-sm italic text-purple-100">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-gray-900/60 px-2 py-1 text-xs text-purple-200">
        {children}
      </code>
    ) : (
      <code className="block rounded-lg bg-gray-900/60 p-4 text-xs text-purple-200">
        {children}
      </code>
    ),
};

/**
 * 将 AI 输出拆成“标题 + 简介 + 章节卡片”，方便做更优雅的排版
 */
const parseStudyNotes = (content: string): ParsedNotes => {
  const lines = content.split('\n');
  let docTitle: string | undefined;
  const introLines: string[] = [];
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  lines.forEach((rawLine) => {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith('# ')) {
      docTitle = line.replace(/^#\s*/, '').trim();
      return;
    }
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.trim(),
        });
      }
      currentSection = {
        title: line.replace(/^##\s*/, '').trim(),
        content: '',
      };
      return;
    }
    if (currentSection) {
      currentSection.content += `${line}\n`;
    } else {
      introLines.push(line);
    }
  });

  if (currentSection) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.trim(),
    });
  }

  return {
    title: docTitle,
    intro: introLines.join('\n').trim(),
    sections,
  };
};

export const StudyNotesViewer = React.forwardRef<HTMLDivElement, StudyNotesViewerProps>(
  ({ content, className }, ref) => {
    const parsed = useMemo(() => parseStudyNotes(content), [content]);
    const introExists = parsed.intro && parsed.intro.length > 0;
    const hasSections = parsed.sections.length > 0;

    return (
      <div
        ref={ref}
        className={cn(
          'study-notes-viewer space-y-6 text-base leading-relaxed text-gray-200',
          className
        )}
      >
        {parsed.title && (
          <div className="rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/20 p-6 shadow-inner shadow-purple-900/20">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-200">AI Study Notes</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{parsed.title}</h2>
          </div>
        )}

        {introExists && (
          <div className="rounded-2xl border border-purple-500/20 bg-gray-900/70 p-6 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.3em] text-gray-400">Overview</div>
            <div className="mt-3 text-sm text-gray-200">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {parsed.intro || ''}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {hasSections ? (
          <div className="grid gap-5 md:grid-cols-2">
            {parsed.sections.map((section, index) => (
              <div
                key={`${section.title}-${index}`}
                className="group rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/70 to-gray-950/80 p-5 shadow-lg shadow-black/20 transition hover:border-purple-400/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-200">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
                <div className="mt-4 text-gray-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    );
  }
);

StudyNotesViewer.displayName = 'StudyNotesViewer';

