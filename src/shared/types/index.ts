// SHARED TYPES — src/shared/types/index.ts
// ============================================================
// These are the "contracts" of the application.
// TypeScript interfaces/types define the shape of the data.
// Putting them in `shared` means any layer can import them.

// ── CONCEPT: Discriminated Unions ───────────────────────────
// A discriminated union uses a common field ("kind" / "status")
// to narrow a type. TypeScript can then check exhaustively.
export type AsyncState<T> =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; data: T }
	| { status: "error"; error: string };

// ── CONCEPT: String Literal Union (Enum alternative) ────────
// Prefer string literal unions over TypeScript `enum` — they
// are simpler, tree-shakeable, and interop better with JSON.
export type Priority = "low" | "medium" | "high";
export type Category =
	| "state"
	| "data-fetching"
	| "routing"
	| "forms"
	| "architecture"
	| "typescript"
	| "performance"
	| "general";

// ── CONCEPT: Interfaces vs Types ────────────────────────────
// `interface` = extendable (prefer for object shapes)
// `type` = flexible (use for unions, primitives, computed)
export interface Task {
	id: string;
	title: string;
	description: string;
	completed: boolean;
	priority: Priority;
	category: Category;
	createdAt: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
}

// ── CONCEPT: Utility Types ───────────────────────────────────
//   Partial<T>   — all fields optional
//   Required<T>  — all fields required
//   Pick<T, K>   — keep only keys K
//   Omit<T, K>   — remove keys K
//   Record<K, V> — map K → V
export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "completed">;
export type UpdateTaskInput = Partial<
	Pick<Task, "title" | "description" | "completed" | "priority">
>;

// ── CONCEPT: Generic Types ───────────────────────────────────
// Generics let you write reusable logic that works for any type.
export interface ApiResponse<T> {
	data: T;
	message: string;
	success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	total: number;
	page: number;
	pageSize: number;
}

export interface TaskFilters {
	search: string;
	priority: Priority | "all";
	category: Category | "all";
	showCompleted: boolean;
}
