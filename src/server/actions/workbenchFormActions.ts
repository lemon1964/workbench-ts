// src/server/actions/workbenchFormActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { readWorkbenchDb, writeWorkbenchDb } from "@/server/workbenchDb";
import { titleSchema } from "@/lib/schemas";
import type {
  CreateProjectFormState,
  CreateSectionFormState,
  CreateNoteFormState,
  RenameNoteFormState,
  RenameSectionFormState,
  DeleteSectionFormState,
  DeleteNoteFormState,
  RenameProjectFormState,
  DeleteProjectFormState,
} from "@/lib/formTypes";


const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export async function createProjectFromForm(
  _prev: CreateProjectFormState,
  formData: FormData
): Promise<CreateProjectFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const structure = String(formData.get("structure") ?? "entries") as "entries" | "sections";
  const clientIdRaw = String(formData.get("clientId") ?? "");
  const clientId = isUuid(clientIdRaw) ? clientIdRaw : crypto.randomUUID();

  if (title.length < 2) {
    return { ok: false, error: null, fieldErrors: { title: "Минимум 2 символа" } };
  }

  const db = await readWorkbenchDb();
  const projectId = `p-${clientId}`;

  // защита от дубля (если вдруг повторная отправка)
  if (!db.projects.some((p) => p.id === projectId)) {
    db.projects.unshift({
      id: projectId,
      title,
      structure,
      createdAt: new Date().toISOString(),
      isDemo: false,
    });
    await writeWorkbenchDb(db);
  }
  revalidatePath("/");
  return { ok: true, projectId, clientId };
}

export async function createSectionFromForm(
  _prev: CreateSectionFormState,
  formData: FormData
): Promise<CreateSectionFormState> {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const clientIdRaw = String(formData.get("clientId") ?? "");
  const clientId = isUuid(clientIdRaw) ? clientIdRaw : crypto.randomUUID();

  if (!projectId) {
    return { ok: false, error: "Нет projectId", fieldErrors: {} };
  }
  if (title.length < 2) {
    return { ok: false, error: null, fieldErrors: { title: "Минимум 2 символа" } };
  }

  const db = await readWorkbenchDb();
  const sectionId = `s-${clientId}`;

  if (!db.sections.some((s) => s.id === sectionId)) {
    db.sections.push({
      id: sectionId,
      projectId,
      title,
      order: db.sections.filter((s) => s.projectId === projectId).length + 1,
      createdAt: new Date().toISOString(),
    });
    await writeWorkbenchDb(db);
  }

  return { ok: true, sectionId, clientId };
}

export async function createNoteFromForm(
  _prev: CreateNoteFormState,
  formData: FormData
): Promise<CreateNoteFormState> {
  const projectId = String(formData.get("projectId") ?? "");
  const parentType = String(formData.get("parentType") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const clientIdRaw = String(formData.get("clientId") ?? "");
  const clientId = isUuid(clientIdRaw) ? clientIdRaw : crypto.randomUUID();

  if (!projectId) return { ok: false, error: "Нет projectId", fieldErrors: {} };
  if (parentType !== "project" && parentType !== "section") {
    return { ok: false, error: "Неверный parentType", fieldErrors: {} };
  }
  if (!parentId) return { ok: false, error: "Нет parentId", fieldErrors: {} };
  if (title.length < 2) {
    return { ok: false, error: null, fieldErrors: { title: "Минимум 2 символа" } };
  }

  const db = await readWorkbenchDb();
  const noteId = `n-${clientId}`;
  const now = new Date().toISOString();

  if (!db.notes.some((n) => n.id === noteId)) {
    db.notes.push({
      id: noteId,
      projectId,
      parentType: parentType as "project" | "section",
      parentId,
      title,
      contentHtml: "<p><br></p>",
      updatedAt: now,
    });
    await writeWorkbenchDb(db);
  }

  return { ok: true, noteId, clientId };
}

export async function renameNoteFromForm(
  _prev: RenameNoteFormState,
  formData: FormData
): Promise<RenameNoteFormState> {
  const noteId = String(formData.get("noteId") ?? "");
  const titleRaw = String(formData.get("title") ?? "");

  if (!noteId) {
    return { ok: false, error: "Нет noteId", fieldErrors: {} };
  }

  const parsed = titleSchema.safeParse(titleRaw);
  if (!parsed.success) {
    return {
      ok: false,
      error: null,
      fieldErrors: { title: parsed.error.issues[0]?.message ?? "Некорректное название" },
    };
  }

  const title = parsed.data; // уже trim()

  const db = await readWorkbenchDb();
  const n = db.notes.find((x) => x.id === noteId);

  if (!n) {
    return { ok: false, error: "Заметка не найдена", fieldErrors: {} };
  }

  n.title = title;
  n.updatedAt = new Date().toISOString();

  await writeWorkbenchDb(db);

  // clientId тут не нужен, но в твоём типе он есть — отдаём noteId, чтобы тип совпал
  return { ok: true, noteId, clientId: noteId };
}

export async function renameSectionFromForm(
  _prev: RenameSectionFormState,
  formData: FormData
): Promise<RenameSectionFormState> {
  const sectionId = String(formData.get("sectionId") ?? "");
  const titleRaw = String(formData.get("title") ?? "");

  if (!sectionId) {
    return { ok: false, error: "Нет sectionId", fieldErrors: {} };
  }

  const parsed = titleSchema.safeParse(titleRaw);
  if (!parsed.success) {
    return {
      ok: false,
      error: null,
      fieldErrors: {
        title: parsed.error.issues[0]?.message ?? "Некорректное название",
      },
    };
  }

  const title = parsed.data;

  const db = await readWorkbenchDb();
  const s = db.sections.find((x) => x.id === sectionId);

  if (!s) {
    return { ok: false, error: "Секция не найдена", fieldErrors: {} };
  }

  s.title = title;
  s.updatedAt = new Date().toISOString();

  await writeWorkbenchDb(db);

  return { ok: true, sectionId, clientId: sectionId };
}

export async function deleteSectionFromForm(
  _prev: DeleteSectionFormState,
  formData: FormData
): Promise<DeleteSectionFormState> {
  const sectionId = String(formData.get("sectionId") ?? "");

  if (!sectionId) {
    return { ok: false, error: "Нет sectionId" };
  }

  const db = await readWorkbenchDb();

  // idempotent: если уже нет — считаем успехом
  const existed = db.sections.some((s) => s.id === sectionId);

  if (existed) {
    db.sections = db.sections.filter((s) => s.id !== sectionId);
    db.notes = db.notes.filter(
      (n) => !(n.parentType === "section" && n.parentId === sectionId)
    );
    await writeWorkbenchDb(db);
  }

  return { ok: true, sectionId };
}

export async function deleteNoteFromForm(
  _prev: DeleteNoteFormState,
  formData: FormData
): Promise<DeleteNoteFormState> {
  const noteId = String(formData.get("noteId") ?? "");

  if (!noteId) {
    return { ok: false, error: "Нет noteId" };
  }

  const db = await readWorkbenchDb();

  // idempotent
  const existed = db.notes.some((n) => n.id === noteId);
  if (existed) {
    db.notes = db.notes.filter((n) => n.id !== noteId);
    await writeWorkbenchDb(db);
  }

  return { ok: true, noteId };
}

export async function renameProjectFromForm(
  _prev: RenameProjectFormState,
  formData: FormData
): Promise<RenameProjectFormState> {
  const projectId = String(formData.get("projectId") ?? "");
  const titleRaw = String(formData.get("title") ?? "");

  if (!projectId) {
    return { ok: false, error: "Нет projectId", fieldErrors: {} };
  }

  const parsed = titleSchema.safeParse(titleRaw);
  if (!parsed.success) {
    return {
      ok: false,
      error: null,
      fieldErrors: {
        title: parsed.error.issues[0]?.message ?? "Некорректное название",
      },
    };
  }

  const title = parsed.data;

  const db = await readWorkbenchDb();
  const p = db.projects.find((x) => x.id === projectId);

  if (!p) {
    return { ok: false, error: "Проект не найден", fieldErrors: {} };
  }

  p.title = title;
  await writeWorkbenchDb(db);
  revalidatePath("/");
  return { ok: true, projectId, clientId: projectId };
}

export async function deleteProjectFromForm(
  _prev: DeleteProjectFormState,
  formData: FormData
): Promise<DeleteProjectFormState> {
  const projectId = String(formData.get("projectId") ?? "");

  if (!projectId) {
    return { ok: false, error: "Нет projectId" };
  }

  const db = await readWorkbenchDb();

  const existed = db.projects.some((p) => p.id === projectId);
  if (existed) {
    db.projects = db.projects.filter((p) => p.id !== projectId);
    db.sections = db.sections.filter((s) => s.projectId !== projectId);
    db.notes = db.notes.filter((n) => n.projectId !== projectId);
    await writeWorkbenchDb(db);
  }
  revalidatePath("/");
  return { ok: true, projectId };
}
