/* Shared client for the backend's cookie-based API. */
const API_BASE_URL =
    window.KISAN_SETU_API_BASE_URL || "http://localhost:5000/api/v1";
let csrfToken = null;

function friendlyErrorMessage(error, fallback = "Something went wrong. Please try again later.") {
	const rawMessage = typeof error === "string" ? error : error?.message;
	const message = String(rawMessage || "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!message || /Cannot\s+(GET|POST|PUT|PATCH|DELETE)\s+\//i.test(message) || message.length > 180) {
		return fallback;
	}
	return message;
}

function apiUrl(path) {
	return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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
		const error = new Error(friendlyErrorMessage(body.message || body.error, `Request failed (${response.status})`));
		error.status = response.status;
		error.requestId = body.requestId || response.headers.get("x-request-id");
		error.details = body.errors || body.details;
		throw error;
	}

	return body.data ?? body;
}

async function getCsrfToken() {
	const response = await fetch(apiUrl("/auth/csrf"), {
		method: "GET",
		credentials: "include",
		headers: { Accept: "application/json" }
	});
	const body = await readApiResponse(response);
	csrfToken = body.csrfToken || body.token || response.headers.get("x-csrf-token") || csrfToken;
	return csrfToken;
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

	let response = await fetch(apiUrl(path), requestOptions);
	if (response.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
		try {
			await fetch(apiUrl("/auth/refresh"), {
				method: "POST",
				credentials: "include",
				headers: { Accept: "application/json" }
			});
			response = await fetch(apiUrl(path), requestOptions);
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
