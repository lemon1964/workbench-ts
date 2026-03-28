"use server";

import { readWorkbenchDb, writeWorkbenchDb } from "@/server/workbenchDb";

export async function getDbSnapshot(): Promise<WorkbenchDb> {
  return readWorkbenchDb();
}

export async function saveDbSnapshot(nextDb: WorkbenchDb): Promise<void> {
  await writeWorkbenchDb(nextDb);
}
