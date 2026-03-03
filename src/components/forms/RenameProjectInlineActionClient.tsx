// src/components/forms/RenameProjectInlineActionClient.tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { renameProjectFromForm } from "@/server/actions/workbenchFormActions";
import { renameProjectFormInitialState } from "@/lib/formStates";
import type { RenameProjectFormState } from "@/lib/formTypes";
import { useWorkbenchStore } from "@/lib/workbenchStore";

export default function RenameProjectInlineActionClient({
  projectId,
  initialValue,
  onCancel,
  onPendingChange,
  className = "",
  inputClassName = "",
}: {
  projectId: Id;
  initialValue: string;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  className?: string;
  inputClassName?: string;
}) {
  const store = useWorkbenchStore();

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [state, formAction, isPending] = useActionState<
    RenameProjectFormState,
    FormData
  >(renameProjectFromForm, renameProjectFormInitialState);

  const router = useRouter();

  useEffect(() => {
    onPendingChange?.(isPending);
    return () => onPendingChange?.(false);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submitAndClose = () => {
    const raw = inputRef.current?.value ?? "";
    const t = raw.trim();
    if (t.length < 2) return;

    // optimistic — чтобы сразу обновился UI без refresh
    store.renameProjectLocal(projectId, t);

    // серверная фиксация
    formRef.current?.requestSubmit();
    router.refresh();
    // выходим из режима редактирования сразу
    onCancel();
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`${className} space-y-1 ${isPending ? "opacity-60" : ""}`}
    >
      <input type="hidden" name="projectId" value={projectId} />

      <div className="relative">
        <input
          ref={inputRef}
          name="title"
          defaultValue={initialValue}
          disabled={isPending}
          className={`${inputClassName} pr-9`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              submitAndClose();
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }
          }}
          onBlur={() => {
            submitAndClose();
          }}
        />

        {isPending && (
          <span
            aria-label="Сохраняем…"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"
          />
        )}
      </div>

      {/* Если вдруг сервер вернул ошибку — покажем, пока компонент ещё на экране (например, при очень быстром blur/enter это редко, но ок) */}
      {state.ok === false && state.fieldErrors?.title && (
        <div className="text-xs text-rose-300">{state.fieldErrors.title}</div>
      )}
      {state.ok === false && state.error && (
        <div className="text-xs text-rose-300">{state.error}</div>
      )}
    </form>
  );
}
