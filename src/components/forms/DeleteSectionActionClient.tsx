// src/components/forms/DeleteSectionActionClient.tsx
"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { deleteSectionFromForm } from "@/server/actions/workbenchFormActions";
import { deleteSectionFormInitialState } from "@/lib/formStates";
import type { DeleteSectionFormState } from "@/lib/formTypes";
import { useWorkbenchStore } from "@/lib/workbenchStore";

export default function DeleteSectionActionClient({
  sectionId,
  onDeleted,
  disabled = false,
  confirmText = "Удалить раздел и все его заметки?",
  className = "wb-icon-btn wb-icon-btn--danger",
  title = "Удалить раздел",
}: {
  sectionId: Id;
  onDeleted: () => void;
  disabled?: boolean;
  confirmText?: string;
  className?: string;
  title?: string;
}) {
  const store = useWorkbenchStore();
  const didConfirmRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction, isPending] = useActionState<DeleteSectionFormState, FormData>(
    deleteSectionFromForm,
    deleteSectionFormInitialState
  );

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.ok === false && state.error) {
      // вернёмся к серверной правде
      void store.refreshFromServer();
      didConfirmRef.current = false;
    }
  }, [state, store]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        e.stopPropagation();

        if (!didConfirmRef.current) {
          e.preventDefault();
          return;
        }

        didConfirmRef.current = false;

        startTransition(() => {
          store.removeSectionLocal(sectionId);
          onDeleted();
        });
      }}
    >
      <input type="hidden" name="sectionId" value={sectionId} />

      <button
        type="submit"
        className={`${className} ${isPending ? "opacity-60" : ""}`}
        title={title}
        disabled={disabled || isPending}
        onClick={(e) => {
          e.stopPropagation();

          if (disabled || isPending) {
            e.preventDefault();
            return;
          }

          const ok = window.confirm(confirmText);
          if (!ok) {
            didConfirmRef.current = false;
            e.preventDefault();
            return;
          }

          didConfirmRef.current = true;
        }}
      >
        {isPending ? (
          <span
            aria-label="Удаляем…"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"
          />
        ) : (
          "✕"
        )}
      </button>
    </form>
  );
}
