// ============================================================
// SHARED API — src/shared/api/index.ts
// ============================================================
// This is the HTTP client setup. All API calls go through here.
// Centralising this gives ONE place to:
//   - Set a base URL
//   - Attach auth tokens (interceptors)
//   - Handle errors globally
//   - Handle response transformation

import axios, {
	type AxiosInstance,
	AxiosError,
	type InternalAxiosRequestConfig,
} from "axios";

// ── CONCEPT: Axios Instance ──────────────────────────────────
// Instead of calling axios.get() directly, created a configured
// instance. This separates concerns: config lives here, not in
// every feature file.

export const apiClient: AxiosInstance = axios.create({
	baseURL:
		import.meta.env.VITE_API_URL ?? "https://jsonplaceholder.typicode.com",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
});

// ── CONCEPT: Interceptors ────────────────────────────────────
// Interceptors run on every request/response, like middleware.
// REQUEST interceptor: attach JWT token from localStorage

apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = localStorage.getItem("auth_token");
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

//RESPONSE interceptor: normalise errors

apiClient.interceptors.response.use(
	(response) => response, // 2xx -> pass through
	(error: AxiosError) => {
		//401 Unauthorized -> redirect to login page
		if (error.response?.status === 401) {
			localStorage.removeItem("auth_token");
			window.location.href = "/login";
		}

		//Tranform to a consistent error shape

		const message =
			(error.response?.data as { message?: string })?.message ??
			error.message ??
			"An unexpected error occured";
		return Promise.reject(new Error(message));
	},
);

// ── CONCEPT: Typed API helpers ───────────────────────────────
// These thin wrappers add TypeScript generics so every call site
// knows the shape of what it gets back.

export const api = {
	get: async <T>(url: string) => {
		const response = await apiClient.get<T>(url);
		return response.data;
	},
	post: async <T>(url: string, data: unknown) => {
		const response = await apiClient.post<T>(url, data);
		return response.data;
	},
	put: <T>(url: string, data: unknown) =>
		apiClient.put<T>(url, data).then((r) => r.data),
	patch: <T>(url: string, data: unknown) =>
		apiClient.patch<T>(url, data).then((r) => r.data),
	delete: <T>(url: string) => apiClient.delete<T>(url).then((r) => r.data),
};
