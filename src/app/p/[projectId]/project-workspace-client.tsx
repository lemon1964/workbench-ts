// src/app/p/[projectId]/project-workspace-client.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { prepareHtmlForPreview } from "@/lib/quillPreview";
import Button from "@/components/ui/Button";
import WorkspaceShell from "@/app/_ui/WorkspaceShell";
import ProjectTreeClient from "@/app/_ui/ProjectTreeClient";
import NoteEditorClient from "@/components/editor/NoteEditorClient";
import { useWorkbenchStore } from "@/lib/workbenchStore";
import { useUIShell } from "@/app/_ui/ui-shell-context";

export default function ProjectWorkspaceClient({ projectId }: { projectId: Id }) {
  const sp = useSearchParams();
  const noteId = sp.get("note") ?? "";
  const [mode, setMode] = useState<"edit" | "view">("edit");

  const { getProject, getNote, updateNoteContent, getNoteSaveInfo } = useWorkbenchStore();

  const note = noteId ? getNote(projectId, noteId) : undefined;
  const saveInfo = note ? getNoteSaveInfo(note.id) : { status: "idle" as const };

  const previewHtml = useMemo(() => {
    if (!note) return "";
    return prepareHtmlForPreview(note.contentHtml || "");
  }, [note]);

  const ui = useUIShell();
  const { focusMode } = ui.state;
  const sidebarHidden = focusMode && Boolean(note);

  const project = getProject(projectId);
  if (!project) {
    return (
      <div className="app-card">
        <div className="font-semibold">Проект не найден</div>
        <p className="muted mt-1 text-sm">
          Вернись на{" "}
          <Link className="app-link" href="/">
            главную
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <section className="app-section pb-0 flex-1 min-h-0">
      <WorkspaceShell
        sidebar={<ProjectTreeClient projectId={projectId} />}
        sidebarHidden={sidebarHidden}
        // sidebarHidden={focusMode}
        main={
          note ? (
            <div className="flex flex-col gap-3 h-full min-h-0">
              <div className="wb-note-head">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-100">{note.title}</div>
                    <div className="wb-tree-meta">
                      обновлено: {new Date(note.updatedAt).toLocaleString("ru-RU")}
                      {saveInfo.status === "saving" && " • сохранение…"}
                      {saveInfo.status === "saved" && " • сохранено"}
                      {saveInfo.status === "error" && " • ошибка сохранения"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`app-btn ${focusMode ? "app-btn--primary" : "app-btn--soft"}`}
                      onClick={ui.toggleFocusMode}
                      title="Экран: скрыть панель слева и оставить редактор"
                    >
                      Экран
                    </button>
                    <Button
                      variant="ghost"
                      onClick={() => setMode(m => (m === "edit" ? "view" : "edit"))}
                    >
                      {mode === "edit" ? "Просмотр" : "Редактор"}
                    </Button>
                  </div>

                  {/* здесь позже будут кнопки режимов */}
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {mode === "edit" ? (
                  <NoteEditorClient
                    key={note.id}
                    value={note.contentHtml}
                    onChange={next => updateNoteContent(note.id, next)}
                  />
                ) : (
                  <div key={note.id} className="wb-viewer ql-snow">
                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="app-card app-card--soft">
              <div className="font-semibold">Выберите заметку</div>
              <p className="muted mt-1 text-sm">Выберите заметку слева или используйте поиск.</p>
            </div>
          )
        }
      />
    </section>
  );
}
