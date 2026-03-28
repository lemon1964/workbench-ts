// src/components/forms/RenameSectionInlineActionClient.tsx
"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { renameSectionFromForm } from "@/server/actions/workbenchFormActions";
import { renameSectionFormInitialState } from "@/lib/formStates";
import type { RenameSectionFormState } from "@/lib/formTypes";
import { useWorkbenchStore } from "@/lib/workbenchStore";

export default function RenameSectionInlineActionClient({
  sectionId,
  initialValue,
  onCancel,
  onPendingChange,
  className = "",
  inputClassName = "",
}: {
  sectionId: Id;
  initialValue: string;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  className?: string;
  inputClassName?: string;
}) {
  const store = useWorkbenchStore();

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // rollback при ошибке
  const prevTitleRef = useRef(initialValue);

  const [state, formAction, isPending] = useActionState<
    RenameSectionFormState,
    FormData
  >(renameSectionFromForm, renameSectionFormInitialState);

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
      startTransition(() => store.renameSectionLocal(sectionId, prevTitleRef.current));
    }
  }, [state, sectionId, store, onCancel, startTransition]);

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

        // optimistic rename
        startTransition(() => store.renameSectionLocal(sectionId, t));
      }}
    >
      <input type="hidden" name="sectionId" value={sectionId} />

      <div className="relative">
        <input
          ref={inputRef}
          name="title"
          defaultValue={initialValue}
          disabled={isPending}
          className={`${inputClassName} pr-9`}
          onKeyDown={(e) => {
            // важно: чтобы Enter/Escape не всплывали в родительский onKeyDown (строка секции)
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              formRef.current?.requestSubmit();
              return;
            }

            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
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
