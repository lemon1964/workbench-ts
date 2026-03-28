// src/components/forms/CreateNoteInlineActionClient.tsx
"use client";

import { useActionState, useEffect, useMemo, useRef, useTransition } from "react";
import { createNoteFromForm } from "@/server/actions/workbenchFormActions";
import { createNoteFormInitialState } from "@/lib/formStates";
import type { CreateNoteFormState } from "@/lib/formTypes";
import { useWorkbenchStore } from "@/lib/workbenchStore";

export default function CreateNoteInlineActionClient({
  projectId,
  parentType,
  parentId,
  onCreated,
  onCancel,
  onPendingChange,
  inputClassName = "",
}: {
  projectId: string;
  parentType: "project" | "section";
  parentId: string;
  onCreated: (noteId: string) => void;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  inputClassName?: string;
}) {
  const store = useWorkbenchStore();
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clientId = useMemo(() => crypto.randomUUID(), []);
  const optimisticId = `n-${clientId}`;

  const [state, formAction, isPending] = useActionState<CreateNoteFormState, FormData>(
    createNoteFromForm,
    createNoteFormInitialState
  );

  const [, startTransition] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    onPendingChange?.(isPending);
    return () => onPendingChange?.(false);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (state.ok) {
      startTransition(() => {
        onCreated(state.noteId);
        onCancel();
      });
      return;
    }

    if (state.ok === false && (state.error || state.fieldErrors?.title)) {
      startTransition(() => store.removeNoteLocal(optimisticId));
    }
  }, [state, onCancel, onCreated, startTransition, store, optimisticId]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get("title") ?? "").trim();
        if (title.length < 2) return;

        const now = new Date().toISOString();

        startTransition(() => {
          store.insertNoteLocal({
            id: optimisticId,
            projectId,
            parentType,
            parentId,
            title,
            contentHtml: "<p><br></p>",
            updatedAt: now,
          });
        });
      }}
      className={`space-y-1 ${isPending ? "opacity-60" : ""}`}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="parentType" value={parentType} />
      <input type="hidden" name="parentId" value={parentId} />

      <div className="relative">
        <input
          ref={inputRef}
          name="title"
          placeholder="Новая заметка…"
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
    </form>
  );
}
