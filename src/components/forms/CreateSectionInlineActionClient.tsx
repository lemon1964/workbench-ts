// src/components/forms/CreateSectionInlineActionClient.tsx
"use client";

import { useActionState, useEffect, useMemo, useRef, useTransition } from "react";
import { createSectionFromForm } from "@/server/actions/workbenchFormActions";
import { createSectionFormInitialState } from "@/lib/formStates";
import type { CreateSectionFormState } from "@/lib/formTypes";
import { useWorkbenchStore } from "@/lib/workbenchStore";

export default function CreateSectionInlineActionClient({
  projectId,
  onCreated,
  onCancel,
  onPendingChange,
  inputClassName = "",
}: {
  projectId: string;
  onCreated: (sectionId: string) => void;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  inputClassName?: string;
}) {
  const store = useWorkbenchStore();
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clientId = useMemo(() => crypto.randomUUID(), []);
  const optimisticId = `s-${clientId}`;

  const [state, formAction, isPending] = useActionState<CreateSectionFormState, FormData>(
    createSectionFromForm,
    createSectionFormInitialState
  );

  const [, startTransition] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // сообщаем наружу “pending”, чтобы можно было disabled “+ заметка”
  useEffect(() => {
    onPendingChange?.(isPending);
    return () => onPendingChange?.(false);
  }, [isPending, onPendingChange]);

  // success / rollback
  useEffect(() => {
    if (state.ok) {
      // ✅ сервер подтвердил создание: выбираем секцию и закрываем инлайн
      startTransition(() => {
        onCreated(state.sectionId);
        onCancel();
      });
      return;
    }

    if (state.ok === false && (state.error || state.fieldErrors?.title)) {
      // ❗ если optimistic вставили — убираем
      startTransition(() => store.removeSectionLocal(optimisticId));
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
  
        const nextOrder = store.getSections(projectId).length + 1;
  
        startTransition(() => {
          store.insertSectionLocal({
            id: optimisticId,
            projectId,
            title,
            order: nextOrder,
            createdAt: new Date().toISOString(),
          });
        });
      }}
      className={`space-y-1 ${isPending ? "opacity-60" : ""}`}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="projectId" value={projectId} />
  
      <div className="relative">
        <input
          ref={inputRef}
          name="title"
          placeholder="Новый раздел…"
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
