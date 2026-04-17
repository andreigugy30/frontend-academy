// ============================================================
// TASK ENTITY MODEL — src/entities/task/model/tasksSlice.ts
// ============================================================

//In Feature-slice Design, an ENTITY is a bussines object.
//The model layer holds: Redux state slice, selectors, async thunk

// ── CONCEPT: Redux Slice ─────────────────────────────────────
//A "slice" = `{name, initialState, reducers, extraReducers}`
//RTK uses Immer under the hood, can WRITE mutating code like `{state.items.push(smth)}` but it stays IMMUTABLE behind the scenes

import {
	createSlice,
	createAsyncThunk,
	createSelector,
	type PayloadAction,
} from "@reduxjs/toolkit";
import type {
	Task,
	CreateTaskInput,
	UpdateTaskInput,
} from "../../../shared/types";
import { generateId } from "../../../shared/utils";
import type { RootState } from "../../../shared/store";

// ── CONCEPT: State shape ─────────────────────────────────

interface TaskState {
	items: Task[];
	selectedId: string | null;
	loading: boolean;
	error: string | null;
}

//Using `JSONPlaceholder` as a mock API for demo (I don't have API endpoint for now!!!)

const API_ENDPOINT = "https://jsonplaceholder.typicode.com/todos?_limit=5";

//Seed data on first load (mocked data)
const SEED_TASKS: Task[] = [
	{
		id: "1",
		title: "Understand Redux data flow",
		description:
			"Action → Reducer → Store → Component. Data flows ONE direction. " +
			"Components dispatch actions, reducers handle them, store updates, " +
			"components re-render via selectors.",
		completed: false,
		priority: "high",
		category: "state",
		createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
	},
	{
		id: "2",
		title: "Learn createAsyncThunk for API calls",
		description:
			"createAsyncThunk generates pending/fulfilled/rejected actions " +
			"automatically. Use extraReducers to handle each lifecycle phase " +
			"and update loading/error state accordingly.",
		completed: false,
		priority: "high",
		category: "data-fetching",
		createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
	},
	{
		id: "3",
		title: "Master React Router v6",
		description:
			"Use <Routes> + <Route> for declarative routing. " +
			"useNavigate() for programmatic navigation. " +
			"useParams() to read dynamic segments like /tasks/:id.",
		completed: true,
		priority: "medium",
		category: "routing",
		createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
	},
	{
		id: "4",
		title: "React Hook Form + Zod validation",
		description:
			"react-hook-form manages form state without re-rendering on every keystroke. " +
			"Zod defines a schema that validates your data at runtime AND infers TypeScript types.",
		completed: false,
		priority: "medium",
		category: "forms",
		createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
	},
	{
		id: "5",
		title: "Explore Feature-Sliced Design",
		description:
			"FSD organises code in layers: app → pages → widgets → features → entities → shared. " +
			"Imports can only go DOWNWARD (pages can import features, never vice versa). " +
			"This prevents circular dependencies and keeps coupling explicit.",
		completed: false,
		priority: "high",
		category: "architecture",
		createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
	},
	{
		id: "6",
		title: "TypeScript utility types",
		description:
			"Partial<T>, Omit<T,K>, Pick<T,K>, Record<K,V>, ReturnType<F> — " +
			"these let you derive types from existing ones instead of duplicating them. " +
			"Reduces maintenance and drift.",
		completed: true,
		priority: "low",
		category: "typescript",
		createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
	},
	{
		id: "7",
		title: "Code splitting with React.lazy",
		description:
			"React.lazy() + Suspense let you split your bundle so users only download " +
			"the code for the page they are on. Large apps load faster.",
		completed: false,
		priority: "low",
		category: "performance",
		createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
	},
];

//Initial state

const initialState: TaskState = {
	items: SEED_TASKS,
	selectedId: null,
	loading: false,
	error: null,
};

// ── CONCEPT: createAsyncThunk ────────────────────────────────
//Handles async operations (API calls) with three lifecycle actions:
// `[name]/pending` -> request started
// `[name]/fullfilled` -> request succeeded
// `[name]/rejected` -> request failed
//The second argument is the "payload creator" - an async fn
//Will be handled in the `extraReducers`

export const fetchTasksFromAPI = createAsyncThunk(
	//This is the "action type" prefix
	//RTK will generate : `tasks/fetchFromApi/pending`, `tasks/fetchFromApi/fulfilled` and `tasks/fetchFromApi/rejected`
	"tasks/fetchFromApi",
	//This is the async fn that runs when the thunk is dispatched
	//Parameters: _ -> is the argument passed when dispatching (not used here) and `{ rejectWithValue }` → helper from Redux Toolkit
	// that let me send a "custom error payload" instead of a generic error
	async (_, { rejectWithValue }) => {
		try {
			//Use JSONPlaceholder as a mock API for demo API call
			const response = await fetch(API_ENDPOINT);
			//It check for HTTP errors -> `fetch` does NOT throw on HTTP errors like 404, 500
			if (!response.ok) throw new Error("Network response was not ok");
			const data = await response.json();

			//Transform external API  shape into Task shape
			return data.map(
				(item: { id: string; title: string; completed: boolean }) => ({
					id: `api-${item.id}`,
					title: item.title,
					description: "Fetched from JSONPlaceholder API - a real HTTP request",
					completed: item.completed,
					priority: "medium" as const,
					category: "general" as const,
					createdAt: new Date().toISOString(),
				}),
			) as Task[];
		} catch (error) {
			// rejectWithValue lets control the rejected action's payload
			return rejectWithValue((error as Error).message);
		}
	},
);

// ── CONCEPT: Create slice ────────────────────────────────

//From this slice I will have automatically generated actions: `taskSlice.actions.addTask`, `taskSlice.actions.updateTask`, etc and reducer `taskSlice.reducer`
export const taskSlice = createSlice({
	//The slice name -> used to generate action types like: `tasks/addTask`, `tasks/updateTasks`, etc
	name: "tasks",
	initialState: initialState,
	//Reducers section where every key of the reducers object is a `reducer` function
	//RTK will create matching `action creators` and infer types automatically
	reducers: {
		// ── CONCEPT: PayloadAction<T> ──────────────────────────
		//`PayloadAction<T>` Types the action.payload - TS knows the shape of payload
		//`state` -> current slice state
		//`action.payload` -> typed as `CreateTaskInput`
		addTask(state, action: PayloadAction<CreateTaskInput>) {
			//Here reducer `addTask` look like "mutate the state", but it don't actually
			//Using "Immer"(built in Redux toolkit) this `state.items.unshift(...)` is converted into an 'immutable' update under the hood and
			//adds a new task at the beginning of  the array
			state.items.unshift({
				...action.payload,
				id: generateId(),
				completed: false,
				createdAt: new Date().toISOString(),
			});
		},
		//Here payload contains: `id` -> which task to update ; `changes` -> what to update
		updateTask(
			state,
			action: PayloadAction<{ id: string; changes: UpdateTaskInput }>,
		) {
			const task = state.items.find((item) => item.id === action.payload.id);
			//here if task is found, merges changes into the task and `Object.assign` updates multiple fields at once
			if (task) Object.assign(task, action.payload.changes);
		},

		deleteTask(state, action: PayloadAction<string>) {
			state.items = state.items.filter((item) => item.id !== action.payload);
		},
		toogleTask(state, action: PayloadAction<string>) {
			const task = state.items.find((item) => item.id === action.payload);
			if (task) task.completed = !task.completed;
		},
		selectTask(state, action: PayloadAction<string | null>) {
			state.selectedId = action.payload;
		},
		clearError(state) {
			state.error = null;
		},
	},
	// ── CONCEPT: extraReducers ───────────────────────────────
	//Handle actions from OUTSIDE this slice (e.g async thunks)
	extraReducers: (builder) => {
		// `extraReducers` lets this slice react to actions created elsewhere,
		// such as async thunk lifecycle actions from `createAsyncThunk`.

		builder
			// Runs immediately when `fetchTasksFromAPI()` is dispatched
			// and the async request has started.
			.addCase(fetchTasksFromAPI.pending, (state) => {
				// Mark the slice as loading so the UI can show a spinner/loading state.
				state.loading = true;

				// Clear any previous error before a fresh request starts.
				state.error = null;
			})

			// Runs when the async request succeeds.
			// `action.payload` contains the array returned by the thunk.
			.addCase(fetchTasksFromAPI.fulfilled, (state, action) => {
				// The request is finished, so loading stops.
				state.loading = false;

				// Build a Set of IDs already in the store.
				// This makes duplicate checks fast.
				const existingIds = new Set(state.items.map((item) => item.id));

				// Keep only tasks from the API that are not already in state.
				const newTasks = action.payload.filter((t) => !existingIds.has(t.id));

				// Add the new unique tasks to the end of the list.
				// This looks like mutation, but RTK uses Immer underneath,
				// so it still produces an immutable state update.
				state.items.push(...newTasks);
			})

			// Runs when the async request fails.
			.addCase(fetchTasksFromAPI.rejected, (state, action) => {
				// The request is finished, even though it failed.
				state.loading = false;

				// Save the error message in state.
				// If `rejectWithValue(...)` provided a payload, use it.
				// Otherwise fall back to a default message.
				state.error = (action.payload as string) ?? "Failed to fetch tasks";
			});
	},
});

export const {
	addTask,
	updateTask,
	deleteTask,
	toogleTask,
	selectTask,
	clearError,
} = taskSlice.actions;

export const tasksReducer = taskSlice.reducer;

// ── CONCEPT: Selectors ───────────────────────────────────────
//Selectors are functions that READ from the store
//They live with the slice
//Basic selectors: just picks a piece of state

export const selectAllTasks = (state: RootState) => state.tasks.items;
export const selectTasksLoading = (state: RootState) => state.tasks.loading;
export const selectTasksError = (state: RootState) => state.tasks.error;
export const selectSelectedId = (state: RootState) => state.tasks.selectedId;

// ── CONCEPT: createSelector (memoised selector) ─────────────
//`createSelector` takes input selectors + a "result function"
//The result is CACHED - only recomputed when inputs change.
//This avoid unnecessary re-renders when the store updates, but the derived value doesn't change

export const selectTaskById = (id: string) =>
	createSelector(selectAllTasks, (tasks) =>
		tasks.find((task: Task) => task.id === id),
	);

export const selectTaskStats = createSelector(selectAllTasks, (tasks) => ({
	total: tasks.length,
	completed: tasks.filter((task) => task.completed).length,
	pending: tasks.filter((task) => !task.completed).length,
	highPriority: tasks.filter(
		(task) => task.priority === "high" && !task.completed,
	).length,
}));

export const selectSelectedTask = createSelector(
	selectAllTasks,
	selectSelectedId,
	(tasks, id) => tasks.find((task) => task.id === id) ?? null,
);
