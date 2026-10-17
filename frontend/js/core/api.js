/* Shared client for the backend's cookie + bearer token API. */
const PROD_API_URL = "https://kisan-setu-x.onrender.com/api/v1";
const LOCAL_API_URL = "http://localhost:5000/api/v1";

const isLocalhost = Boolean(
	typeof window !== "undefined" &&
	(window.location.hostname === "localhost" ||
	 window.location.hostname === "[::1]" ||
	 window.location.hostname === "127.0.0.1" ||
	 window.location.protocol === "file:")
);

const API_BASE_URL =
	window.KISAN_SETU_API_BASE_URL ||
	(isLocalhost ? LOCAL_API_URL : PROD_API_URL);

let csrfToken = null;
let authToken = null;
try {
	authToken = localStorage.getItem("kisan_setu_token") || null;
} catch {}

function setAuthToken(token) {
	authToken = token || null;
	try {
		if (token) {
			localStorage.setItem("kisan_setu_token", token);
		} else {
			localStorage.removeItem("kisan_setu_token");
		}
	} catch {}
}

function clearAuthToken() {
	setAuthToken(null);
}

function friendlyErrorMessage(error, fallback = "Something went wrong. Please try again later.") {
	if (error && typeof error === "object") {
		const fieldErrors = error.details?.fieldErrors || error.errors?.fieldErrors;
		if (fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0) {
			const msgs = Object.entries(fieldErrors)
				.map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`);
			return msgs.join('\n');
		}
	}
	const rawMessage = typeof error === "string" ? error : (error?.message || error?.error);
	const message = String(rawMessage || "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!message || /Cannot\s+(GET|POST|PUT|PATCH|DELETE)\s+\//i.test(message) || message.length > 180) {
		return fallback;
	}
	return message;
}

let currentApiBase = API_BASE_URL;

function apiUrl(path, base = currentApiBase) {
	return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readApiResponse(response) {
	const text = await response.text();
	let body = {};

	if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			body = { message: text };
		}
	}

	if (!response.ok) {
		let msg = body.error?.message || body.message || body.error;
		if (body.error?.details?.fieldErrors) {
			const list = Object.entries(body.error.details.fieldErrors)
				.map(([f, errs]) => `${f}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
				.join('; ');
			msg = `${msg || 'Validation error'}: ${list}`;
		}
		const error = new Error(friendlyErrorMessage(msg || body, `Request failed (${response.status})`));
		error.status = response.status;
		error.requestId = body.requestId || response.headers.get("x-request-id");
		error.details = body.error?.details || body.errors || body.details;
		throw error;
	}

	const data = body.data ?? body;
	if (data && typeof data === "object" && !response.url?.includes("/auth/csrf")) {
		const token = data.token || data.accessToken;
		if (token && typeof token === "string") {
			setAuthToken(token);
		}
	}

	return data;
}

async function getCsrfToken() {
	try {
		const response = await fetch(apiUrl("/auth/csrf"), {
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" }
		});
		const body = await readApiResponse(response);
		csrfToken = body?.token || body?.csrfToken || response.headers.get("x-csrf-token") || csrfToken;
		return csrfToken;
	} catch (err) {
		if (currentApiBase === LOCAL_API_URL && PROD_API_URL) {
			currentApiBase = PROD_API_URL;
			try {
				const response = await fetch(apiUrl("/auth/csrf"), {
					method: "GET",
					credentials: "include",
					headers: { Accept: "application/json" }
				});
				const body = await readApiResponse(response);
				csrfToken = body?.token || body?.csrfToken || response.headers.get("x-csrf-token") || csrfToken;
				return csrfToken;
			} catch {}
		}
		console.warn("Could not obtain CSRF token from server:", err?.message || err);
		return csrfToken;
	}
}

async function apiRequest(path, options = {}) {
	const method = (options.method || "GET").toUpperCase();
	const headers = new Headers(options.headers || {});
	const hasBody = options.body !== undefined && options.body !== null;
	const isJsonBody = hasBody && !(options.body instanceof FormData);

	headers.set("Accept", "application/json");
	if (isJsonBody) {
		headers.set("Content-Type", "application/json");
	}

	if (authToken) {
		headers.set("Authorization", `Bearer ${authToken}`);
	}

	if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
		if (!csrfToken) {
			await getCsrfToken();
		}
		if (csrfToken) {
			headers.set("X-CSRF-Token", csrfToken);
		}
	}

	const requestOptions = {
		...options,
		method,
		credentials: "include",
		headers,
		body: isJsonBody ? JSON.stringify(options.body) : options.body
	};

	let response;
	try {
		response = await fetch(apiUrl(path), requestOptions);
	} catch (netErr) {
		if (currentApiBase === LOCAL_API_URL && PROD_API_URL) {
			console.warn(`Local backend unreachable on port 5000. Failing over to production API (${PROD_API_URL}).`);
			currentApiBase = PROD_API_URL;
			csrfToken = null;
			if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
				await getCsrfToken();
				if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
			}
			response = await fetch(apiUrl(path), requestOptions);
		} else {
			throw netErr;
		}
	}
	if (response.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
		try {
			const refreshHeaders = new Headers({ Accept: "application/json" });
			if (authToken) refreshHeaders.set("Authorization", `Bearer ${authToken}`);
			const refreshRes = await fetch(apiUrl("/auth/refresh"), {
				method: "POST",
				credentials: "include",
				headers: refreshHeaders
			});
			if (refreshRes.ok) {
				const refreshData = await readApiResponse(refreshRes);
				if (refreshData?.token || refreshData?.accessToken) {
					headers.set("Authorization", `Bearer ${refreshData.token || refreshData.accessToken}`);
					requestOptions.headers = headers;
				}
				response = await fetch(apiUrl(path), requestOptions);
			}
		} catch {
			// Preserve the original unauthorized response for the caller.
		}
	}

	return readApiResponse(response);
}

function queryString(params = {}) {
	const search = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			search.set(key, value);
		}
	});
	const value = search.toString();
	return value ? `?${value}` : "";
}

window.apiUrl = apiUrl;
window.apiRequest = apiRequest;
window.getCsrfToken = getCsrfToken;
window.queryString = queryString;
window.friendlyErrorMessage = friendlyErrorMessage;
window.setAuthToken = setAuthToken;
window.clearAuthToken = clearAuthToken;
