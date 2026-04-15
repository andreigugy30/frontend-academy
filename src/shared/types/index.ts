// SHARED TYPES — src/shared/types/index.ts
// ============================================================
// These are the "contracts" of the application.
// TypeScript interfaces/types define the shape of the data.
// Putting them in `shared` means any layer can import them.

export type AsyncState<T> =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; data: T }
	| { status: "error"; error: string };

export type Priority = "low" | "medium" | "high";
export type ConceptCategory =
	| "state"
	| "data-fetching"
	| "routing"
	| "forms"
	| "architecture"
	| "typescript"
	| "performance"
	| "general";

export interface Task {
	id: string;
	title: string;
	description: string;
	completed: boolean;
	priority: Priority;
	category: ConceptCategory;
	createdAt: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
}

export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "completed">;
export type UpdateTaskInput = Partial<
	Pick<Task, "title" | "description" | "completed" | "priority">
>;
