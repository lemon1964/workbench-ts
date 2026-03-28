// src/components/forms/RenameNoteInlineActionClient.tsx
"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { renameNoteFromForm } from "@/server/actions/workbenchFormActions";
import { renameNoteFormInitialState } from "@/lib/formStates";
import type { RenameNoteFormState } from "@/lib/formTypes";
import { useWorkbenchStore } from "@/lib/workbenchStore";

export default function RenameNoteInlineActionClient({
  noteId,
  initialValue,
  onCancel,
  onPendingChange,
  className = "",
  inputClassName = "",
}: {
  noteId: Id;
  initialValue: string;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  className?: string;
  inputClassName?: string;
}) {
  const store = useWorkbenchStore();

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // нужно для rollback при ошибке
  const prevTitleRef = useRef(initialValue);

  const [state, formAction, isPending] = useActionState<RenameNoteFormState, FormData>(
    renameNoteFromForm,
    renameNoteFormInitialState
  );

  const [, startTransition] = useTransition();

  useEffect(() => {
    prevTitleRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    onPendingChange?.(isPending);
    return () => onPendingChange?.(false);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (state.ok) {
      startTransition(() => onCancel());
      return;
    }

    if (state.ok === false && (state.error || state.fieldErrors?.title)) {
      // rollback
      startTransition(() => store.renameNoteLocal(noteId, prevTitleRef.current));
    }
  }, [state, noteId, store, onCancel, startTransition]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`${className} space-y-1 ${isPending ? "opacity-60" : ""}`}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const t = String(fd.get("title") ?? "").trim();
        if (t.length < 2) return;

        // optimistic rename (без updatedAt — чтобы не прыгал порядок в списке)
        startTransition(() => store.renameNoteLocal(noteId, t));
      }}
    >
      <input type="hidden" name="noteId" value={String(noteId)} />

      <div className="relative">
        <input
          ref={inputRef}
          name="title"
          defaultValue={initialValue}
          disabled={isPending}
          className={`${inputClassName} pr-9`}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          onBlur={() => {
            formRef.current?.requestSubmit();
          }}
        />

        {isPending && (
          <span
            aria-label="Сохраняем…"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"
          />
        )}
      </div>

      {state.ok === false && state.fieldErrors?.title && (
        <div className="text-xs text-rose-300">{state.fieldErrors.title}</div>
      )}
      {state.ok === false && state.error && (
        <div className="text-xs text-rose-300">{state.error}</div>
      )}
    </form>
  );
}
