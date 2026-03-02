"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";

interface EditorPanelProps {
  problemId: string | null;
  roomId: string;
  onRun: (code: string, language: string) => Promise<void>;
  onSubmit: (code: string, language: string) => Promise<void>;
  disabled?: boolean;
}

const DEFAULT_CODE: Record<string, string> = {
  python: "# Write your code here\n",
  javascript: "// Write your code here\n",
  typescript: "// Write your code here\n",
  java: "// Write your code here\n",
  cpp: "// Write your code here\n",
  c: "// Write your code here\n",
  csharp: "// Write your code here\n",
  go: "// Write your code here\n",
  rust: "// Write your code here\n",
  ruby: "# Write your code here\n",
  php: "<?php\n// Write your code here\n",
  swift: "// Write your code here\n",
};

export function EditorPanel({
  problemId,
  roomId,
  onRun,
  onSubmit,
  disabled = false,
}: EditorPanelProps) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE[language] ?? "// Write your code here\n");
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      await onRun(code, language);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setRunning(true);
    try {
      await onSubmit(code, language);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-muted/30">
      <div className="flex items-center gap-2 p-2 border-b bg-background">
        <LanguageSelector
          value={language}
          onChange={(lang) => {
            setLanguage(lang);
            if (!code.trim() || code === DEFAULT_CODE[language]) {
              setCode(DEFAULT_CODE[lang] ?? "// Write your code here\n");
            }
          }}
          disabled={disabled}
        />
        <Button size="sm" onClick={handleRun} disabled={!problemId || disabled || running}>
          Run
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSubmit} disabled={!problemId || disabled || running}>
          Submit
        </Button>
      </div>
      <div className="flex-1 min-h-[300px]">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          height="100%"
          readOnly={disabled}
        />
      </div>
    </div>
  );
}
