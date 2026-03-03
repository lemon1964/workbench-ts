// src/components/editor/NoteEditorClient.tsx
"use client";

import dynamic from "next/dynamic";
import hljs from "highlight.js";
import { useCallback, useEffect, useState } from "react";


// Quill Syntax модуль ожидает глобальный window.hljs
if (typeof window !== "undefined") {
  window.hljs = hljs;
}

const ReactQuill = dynamic(async () => (await import("react-quill-new")).default, {
  ssr: false,
});

type ToolbarCtx = {
  quill: {
    history: {
      undo: () => void;
      redo: () => void;
    };
  };
};

const modules = {
  syntax: true,

  toolbar: {
    container: [
      ["undo", "redo"],

      [{ header: [1, 2, 3, false] }, { font: [] }],

      ["bold", "italic", "underline", "strike", "code"],
      [{ script: "sub" }, { script: "super" }],

      [{ color: [] }, { background: [] }],

      ["blockquote", "code-block"],

      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],

      [{ align: [] }],

      ["link"],

      ["clean"],
    ],
    handlers: {
      undo: function (this: ToolbarCtx) {
        this.quill.history.undo();
      },
      redo: function (this: ToolbarCtx) {
        this.quill.history.redo();
      },
    },
  },

  history: {
    delay: 400,
    maxStack: 80,
    userOnly: true,
  },

  clipboard: {
    matchVisual: false,
  },
} as const;

export default function NoteEditorClient({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextHtml: string) => void;
}) {
  const [, setLocalValue] = useState(value);

  // когда пришёл другой value (например, переключили note) — обновляем локал
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // ВАЖНО: зависимость onChange обязательно!
  const handleChange = useCallback(
    (content: string) => {
      setLocalValue(content);
      onChange(content);
    },
    [onChange]
  );
  return (
    <div className="wb-editor">
      <ReactQuill theme="snow" value={value} onChange={handleChange} modules={modules} />
      {/* <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} /> */}
    </div>
  );
}
