// ============================================================
// SHARED UTILS — src/shared/utils/index.ts
// ============================================================
// Pure functions — no side effects, no React.
// Easy to unit-test in isolation.

import type { Task, TaskFilters } from "@shared/types";
import { type ClassValue, clsx } from "clsx";

// CONCEPT: cn() helper
// Merges Tailwinf/CSS class strings conditionally
// clsx handles arrays, objects, falsy values.
export function cn(...inputs: ClassValue[]): string {
	return clsx(inputs);
}

// ── CONCEPT: Pure filtering logic ───────────────────────────
// Business logic extracted from components — testable in isolation.

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
	return tasks.filter((task) => {
		const matchesSearch =
			!filters.search ||
			task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
			task.description.toLowerCase().includes(filters.search.toLowerCase());
		const matchesPriority =
			filters.priority === "all" || task.priority === filters.priority;
		const matchesCategory =
			filters.category === "all" || task.category === filters.category;
		const matchesCompleted = filters.showCompleted || !task.completed;

		return (
			matchesSearch && matchesPriority && matchesCategory && matchesCompleted
		);
	});
}

// ── CONCEPT: ID generation ───────────────────────────────────
// Simple client-side ID when there's no backend to assign one.

export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── CONCEPT: Date formatting ───────────────────────────────────

export function formatDate(date: string): string {
	return new Date(date).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

// ── CONCEPT: Type guard ───────────────────────────────────
// A type guard is a function that returns `value is SomeType`.After calling it in an `if`, TS narrows the type

export function isApiError(error: unknown): error is { message: string } {
	return (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as Record<string, unknown>).message === "string"
	);
}

//Priority -> color mapping

export const PRIORITY_COLORS: Record<string, string> = {
	low: "#22c55e",
	medium: "#f59e0b",
	high: "#ef4444",
};

export const CATEGORY_LABELS: Record<string, string> = {
	state: "State Management",
	"data-fetching": "Data Fetching",
	routing: "Routing",
	forms: "Forms",
	architecture: "Architecture",
	typescript: "TypeScript",
	performance: "Performance",
	general: "General",
};
