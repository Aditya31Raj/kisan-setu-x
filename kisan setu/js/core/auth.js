async function loginUser(credentials) {
	await getCsrfToken();
	return apiRequest("/auth/login", { method: "POST", body: credentials });
}

async function registerUser(userData) {
	await getCsrfToken();
	return apiRequest("/auth/register", { method: "POST", body: userData });
}

async function getCurrentUser() {
	return apiRequest("/auth/me");
}

async function refreshSession() {
	return apiRequest("/auth/refresh", { method: "POST" });
}

async function logoutUser() {
	await getCsrfToken();
	return apiRequest("/auth/logout", { method: "POST" });
}

async function changePassword(passwordData) {
	return apiRequest("/auth/change-password", {
		method: "POST",
		body: passwordData
	});
}

window.loginUser = loginUser;
window.registerUser = registerUser;
window.getCurrentUser = getCurrentUser;
window.refreshSession = refreshSession;
window.logoutUser = logoutUser;
window.changePassword = changePassword;
