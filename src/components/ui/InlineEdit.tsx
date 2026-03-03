"use client";

import { useEffect, useRef, useState } from "react";

export default function InlineEdit({
  initialValue,
  onSave,
  onCancel,
  autoFocus = true,
  placeholder,
  className = "",
  inputClassName = "",
}: {
  initialValue: string;
  onSave: (nextValue: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement | null>(null);

  // чтобы не сохранять одно и то же
  const initialTrimmedRef = useRef(initialValue.trim());
  // чтобы не дублировать save
  const didFinishRef = useRef(false);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [autoFocus]);

  const finishSave = () => {
    if (didFinishRef.current) return;
    didFinishRef.current = true;

    const t = value.trim();
    if (!t) {
      onCancel?.();
      return;
    }

    // если не изменилось — просто закрываем
    if (t === initialTrimmedRef.current) {
      onCancel?.();
      return;
    }

    onSave(t);
  };

  const finishCancel = () => {
    if (didFinishRef.current) return;
    didFinishRef.current = true;
    onCancel?.();
  };

  return (
    <div className={className}>
      <input
        ref={ref}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          // важно: даём шанс внешнему клику сначала закрыть edit (setEditing(null))
          setTimeout(() => {
            // если компонент уже размонтирован — таймер просто не вызовет ничего
            finishSave();
          }, 0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finishSave();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            finishCancel();
          }
        }}
        className={inputClassName}
      />
    </div>
  );
}

