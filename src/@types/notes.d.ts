// src/@types/notes.d.ts
export {};

declare global {
  type Id = string;

  // 2 уровня: project → notes
  // 3 уровня: project → sections → notes
  type ProjectStructure = "entries" | "sections";
  type NoteParentType = "project" | "section";

  interface Project {
    id: Id;
    title: string;
    createdAt: string;
    structure: ProjectStructure;
    isDemo?: boolean; // чтобы витрина всегда держала демо сверху
  }

  interface Section {
    id: Id;
    projectId: Id;
    title: string;
    order: number;
    createdAt?: string;
    updatedAt?: string;
  }

  interface Note {
    id: Id;
    projectId: Id;
    parentType: NoteParentType;
    parentId: Id; // projectId или sectionId
    title: string;
    contentHtml: string;
    updatedAt: string;
  }

  interface WorkbenchDb {
    projects: Project[];
    sections: Section[];
    notes: Note[];
  }
}
