// ============================================================
// REDUX STORE — src/shared/store/index.ts
// ============================================================

//The store is the SINGLE SOURCE of TRUTH for app global state
//Redux Toolkit (RTK) - it eliminates the boilerplate of redux: no action types, no switch statements, etc.

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
	type TypedUseSelectorHook,
	useDispatch,
	useSelector,
} from "react-redux";
import { tasksReducer } from "@entities/task/model/taskSlice";
// import { filtersReducer } from "../../features/filter-tasks/model/filtersSlice";
// import { authReducer } from "../../features/auth/model/authSlice";

// ── CONCEPT: combineReducers ─────────────────────────────────
//The state tree is composed of independent `slices`
//Each slice manages its  own piece of state
//The root reducer combines them into one object: `{task: TaskState, filters: FiltersState, auth: AuthState}`

const rootReducer = combineReducers({
	tasks: tasksReducer,
	// filters: filtersReducer,
	// auth: authReducer,
});

// ── CONCEPT: configureStore ──────────────────────────────────
//RTK's `configureStore` automatically:
// - Adds redux-thunk middleware(for async actions)
// - Enables Redux DevTools extension in dev mode
// - Sets up `Immer` for "mutating" state safely in reducers

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			// Warn if you accidentally put non-serializable values
			// (like Date objects or class instances) in Redux state.
			serializableCheck: {
				ignoredActions: [],
			},
		}),
});

// ── CONCEPT: RootState & AppDispatch ────────────────────────
//Infer types directly from the store - never drift out of sync

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ── CONCEPT: Typed hooks ─────────────────────────────────────
//Wrap the generic hooks with the app types so every component
//gets autocomplete and type safety for free.

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
