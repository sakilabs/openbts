import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import notes from "./editor-notes.md?raw";

const PLUGINS = [remarkGfm];

export function EditorNotes() {
  return (
    <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto custom-scrollbar prose prose-sm prose-neutral dark:prose-invert max-w-none text-xs [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h1]:mb-2 [&_h2]:mb-1.5 [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:pl-4">
      <ReactMarkdown remarkPlugins={PLUGINS}>{notes}</ReactMarkdown>
    </div>
  );
}
