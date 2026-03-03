// src/components/forms/CreateProjectInlineActionClient.tsx
"use client";

import { useActionState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWorkbenchStore } from "@/lib/workbenchStore";
import { createProjectFromForm } from "@/server/actions/workbenchFormActions";
import { createProjectFormInitialState } from "@/lib/formStates";
import type { CreateProjectFormState } from "@/lib/formTypes";

export default function CreateProjectInlineActionClient({
  structure,
  onCancel,
  inputClassName = "",
}: {
  structure: "entries" | "sections";
  onCancel: () => void;
  inputClassName?: string;
}) {
  const store = useWorkbenchStore();
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clientId = useMemo(() => crypto.randomUUID(), []);
  const optimisticId = `p-${clientId}`;

  const [state, formAction, isPending] = useActionState<CreateProjectFormState, FormData>(
    createProjectFromForm,
    createProjectFormInitialState
  );

  const [, startTransition] = useTransition();

  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      startTransition(() => {
        // onCreated(state.projectId); // нету
        onCancel();                // есть
        router.refresh();
      });
    }
  }, [state, startTransition, router, onCancel]);
  

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // rollback / close
  useEffect(() => {
    if (state.ok) {
      startTransition(() => onCancel());
      return;
    }

    if (state.ok === false && (state.error || state.fieldErrors?.title)) {
      startTransition(() => store.removeProjectLocal(optimisticId));
    }
  }, [state, onCancel, startTransition, store, optimisticId]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get("title") ?? "").trim();
        if (title.length < 2) return; // сервер покажет ошибку, optimistic не делаем

        startTransition(() => {
          store.insertProjectLocal({
            id: optimisticId,
            title,
            structure,
            createdAt: new Date().toISOString(),
            isDemo: false,
          });
        });
      }}
      className={`space-y-1 ${isPending ? "opacity-60" : ""}`}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="structure" value={structure} />

      <div className="relative">
        <input
          ref={inputRef}
          name="title"
          placeholder="Новый блокнот…"
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
