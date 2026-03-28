"use server";

import { revalidatePath } from "next/cache";
import {
  CreateNotePayloadSchema,
  CreateProjectPayloadSchema,
  CreateSectionPayloadSchema,
  DeleteNotePayloadSchema,
  DeleteProjectPayloadSchema,
  DeleteSectionPayloadSchema,
  RenameNotePayloadSchema,
  RenameProjectPayloadSchema,
  RenameSectionPayloadSchema,
  UpdateNoteContentPayloadSchema,
} from "@/lib/schemas";

// ⚠️ подставь реальный путь/имена из твоего Шага C2
import { readWorkbenchDb, writeWorkbenchDb } from "@/server/workbenchDb";

type Ok = { ok: true };
type Fail = { ok: false; error: string };
type Result = Ok | Fail;

async function mutateDb(mutator: (db: WorkbenchDb) => void): Promise<Result> {
  try {
    const db = await readWorkbenchDb();
    const next: WorkbenchDb = structuredClone(db);
    mutator(next);
    await writeWorkbenchDb(next);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/* =========================
   Projects
========================= */

export async function createProjectAction(payload: unknown): Promise<Result> {
  const parsed = CreateProjectPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { project } = parsed.data;

  const res = await mutateDb((db) => {
    if (db.projects.some((p) => p.id === project.id)) return;
    db.projects.push(project);
  });

  if (res.ok) revalidatePath("/");
  return res;
}

export async function renameProjectAction(payload: unknown): Promise<Result> {
  const parsed = RenameProjectPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { projectId, title } = parsed.data;

  const res = await mutateDb((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return;
    if (p.isDemo) return; // демо не переименовываем
    p.title = title;
  });

  if (res.ok) revalidatePath("/");
  return res;
}

export async function deleteProjectAction(payload: unknown): Promise<Result> {
  const parsed = DeleteProjectPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { projectId } = parsed.data;

  const res = await mutateDb((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return;
    if (p.isDemo) return; // демо не удаляем

    db.projects = db.projects.filter((x) => x.id !== projectId);
    db.sections = db.sections.filter((s) => s.projectId !== projectId);
    db.notes = db.notes.filter((n) => n.projectId !== projectId);
  });

  if (res.ok) revalidatePath("/");
  return res;
}

/* =========================
   Sections
========================= */

export async function createSectionAction(payload: unknown): Promise<Result> {
  const parsed = CreateSectionPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { section } = parsed.data;

  const res = await mutateDb((db) => {
    // проект должен существовать
    if (!db.projects.some((p) => p.id === section.projectId)) return;

    if (db.sections.some((s) => s.id === section.id)) return;
    db.sections.push(section);
  });

  if (res.ok) revalidatePath(`/p/${section.projectId}`);
  return res;
}

export async function renameSectionAction(payload: unknown): Promise<Result> {
  const parsed = RenameSectionPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { sectionId, title } = parsed.data;

  let projectId: string | null = null;

  const res = await mutateDb((db) => {
    const s = db.sections.find((x) => x.id === sectionId);
    if (!s) return;
    projectId = s.projectId;
    s.title = title;
  });

  if (res.ok && projectId) revalidatePath(`/p/${projectId}`);
  return res;
}

export async function deleteSectionAction(payload: unknown): Promise<Result> {
  const parsed = DeleteSectionPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { sectionId } = parsed.data;
  let projectId: string | null = null;

  const res = await mutateDb((db) => {
    const s = db.sections.find((x) => x.id === sectionId);
    if (!s) return;
    projectId = s.projectId;

    db.sections = db.sections.filter((x) => x.id !== sectionId);
    db.notes = db.notes.filter((n) => !(n.parentType === "section" && n.parentId === sectionId));
  });

  if (res.ok && projectId) revalidatePath(`/p/${projectId}`);
  return res;
}

/* =========================
   Notes
========================= */

export async function createNoteAction(payload: unknown): Promise<Result> {
  const parsed = CreateNotePayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { note } = parsed.data;

  const res = await mutateDb((db) => {
    // проект должен существовать
    if (!db.projects.some((p) => p.id === note.projectId)) return;

    // parent валидируем минимально
    if (note.parentType === "project") {
      if (note.parentId !== note.projectId) return;
    } else {
      const sec = db.sections.find((s) => s.id === note.parentId);
      if (!sec) return;
      if (sec.projectId !== note.projectId) return;
    }

    if (db.notes.some((n) => n.id === note.id)) return;
    db.notes.push(note);
  });

  if (res.ok) revalidatePath(`/p/${note.projectId}`);
  return res;
}

export async function renameNoteAction(payload: unknown): Promise<Result> {
  const parsed = RenameNotePayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { noteId, title } = parsed.data;
  let projectId: string | null = null;

  const res = await mutateDb((db) => {
    const n = db.notes.find((x) => x.id === noteId);
    if (!n) return;
    projectId = n.projectId;
    n.title = title;
    n.updatedAt = new Date().toISOString();
  });

  if (res.ok && projectId) revalidatePath(`/p/${projectId}`);
  return res;
}

export async function deleteNoteAction(payload: unknown): Promise<Result> {
  const parsed = DeleteNotePayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { noteId } = parsed.data;
  let projectId: string | null = null;

  const res = await mutateDb((db) => {
    const n = db.notes.find((x) => x.id === noteId);
    if (!n) return;
    projectId = n.projectId;

    db.notes = db.notes.filter((x) => x.id !== noteId);
  });

  if (res.ok && projectId) revalidatePath(`/p/${projectId}`);
  return res;
}

export async function updateNoteContentAction(payload: unknown): Promise<Result> {
  const parsed = UpdateNoteContentPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { noteId, contentHtml, updatedAt } = parsed.data;
  let projectId: string | null = null;

  const res = await mutateDb((db) => {
    const n = db.notes.find((x) => x.id === noteId);
    if (!n) return;
    projectId = n.projectId;

    n.contentHtml = contentHtml;
    n.updatedAt = updatedAt;
  });

  if (res.ok && projectId) revalidatePath(`/p/${projectId}`);
  return res;
}
