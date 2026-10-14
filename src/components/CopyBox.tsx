"use client";

import { useState } from "react";

export function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-console-line bg-console">
      <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-relaxed text-console-text whitespace-pre-wrap break-all">{text}</pre>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="w-full border-t border-console-line py-2 font-mono text-xs text-console-muted hover:text-accent"
      >
        {copied ? "Copied" : "Copy snippet"}
      </button>
    </div>
  );
}
