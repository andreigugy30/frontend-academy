// ============================================================
// SHARED HOOKS — src/shared/hooks/index.ts
// ============================================================
// Custom hooks are functions that START with "use" and can call
// other hooks. They let you EXTRACT and REUSE stateful logic.
//
// Rule: if you find yourself copy-pasting useState + useEffect
// across multiple components → extract a custom hook.

import { useState, useEffect, useRef, useCallback } from "react";

// ── CONCEPT: useLocalStorage ─────────────────────────────────
// Synchronises React state with localStorage.(`key`: the key used in `localStorage`)
// Generic <T> makes it work for any serializable value.

export function useLocalStorage<T>(key: string, initialValue: T) {
	//`useState` receives a function, not a value -> this is called `lazy initialization` = it runs only once (on mount) , not on every render
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			//try to read the value from `localStorage` using the provided `key`
			const item = localStorage.getItem(key);
			// `item` wil be: `string` if found or `initialValue` if not found
			return item ? (JSON.parse(item) as T) : initialValue;
			//If parsing fails (maybe a corrupted JSON) the fallback is thje `initialValue`
		} catch {
			return initialValue;
		}
	});

	//Create a memoized function (it won't be recreated unless dependencies changes) ->
	// heps avoid unnecessary RE-RENDERS when passed down as a prop
	const setValue = useCallback(
		//setter argument -> accepts either a direct value (eg. `setValue(10)`) or a function (eg. `setValue(prev=> prev + 1)`)
		(value: T | ((prev: T) => T)) => {
			//Update logic - it uses a fucntional upodate to ensure correct previous state
			setStoredValue((prev) => {
				//Resolve `next` value -> if `value` is a function it calls it with prev state
				//else it uses it directly
				const next = value instanceof Function ? value(prev) : value;
				//Sync with `localStorage` - uses `JSON.stringify` because `localStorage` only stores `strings`
				localStorage.setItem(key, JSON.stringify(next));
				//It returned new state
				return next;
			});
		},
		[key],
	);
	//Return value - a TUPLE
	//Returning a `TUPLE as const` ensures:
	//TS treats it as a tuple , and not as a generic `aray` and preserves correct types `([T, function])`
	return [storedValue, setValue] as const; // `as const` -> tuple, not array
}

// ── CONCEPT: useDebounce ─────────────────────────────────────
// Delays updating a value until the user stops typing.
// Crucial for search inputs — avoids firing a request on
// every keystroke.

export function useDebounce<T>(value: T, delay: number) {
	const [debounceValue, setDebounceValue] = useState<T>(value);

	useEffect(() => {
		//Set a timer to update after `delay`
		const timer = setTimeout(() => {
			setDebounceValue(value);
		}, delay);

		//Cleanup function -> if value changes before times fires, cancel the old timer
		//This is the  `debounce effect` - only the LAST value is taken into consideration(WINS)
		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debounceValue;
}

// ── CONCEPT: usePrevious ─────────────────────────────────────
// Returns the value from the previous render.
// Uses useRef because ref changes don't cause re-renders.

export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T | undefined>(undefined);
	useEffect(() => {
		ref.current = value;
	}); // no dependency array -> runs after every render
	return ref.current;
}

// ── CONCEPT: useToggle ───────────────────────────────────────
// Encapsulates boolean toggle logic.

export function useToggle(initial = false) {
	const [value, setValue] = useState(initial);
	const toggle = useCallback(() => setValue((v) => !v), []);
	const setTrue = useCallback(() => setValue(true), []);
	const setFalse = useCallback(() => setValue(false), []);
	return { value, toggle, setFalse, setTrue };
}

// ── CONCEPT: useClickOutside ─────────────────────────────────
// Fires a callback when the user clicks outside a ref'd element.
// Used for dropdowns, modals, tooltips.

export function useClickOutside<T extends HTMLElement>(handler: () => void) {
	const ref = useRef<T>(null);
	useEffect(() => {
		const listener = (e: MouseEvent) => {
			if (ref.current && ref.current.contains(e.target as Node)) {
				handler();
			}
		};
		document.addEventListener("mousedown", listener);
		return () => {
			document.removeEventListener("mousedown", listener);
		};
	}, [handler]);

	return ref;
}
