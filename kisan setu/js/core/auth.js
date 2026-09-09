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

async function performLogout(e) {
	if (e && typeof e.preventDefault === "function") {
		e.preventDefault();
	}
	try {
		await logoutUser();
	} catch (err) {
		console.warn("Logout request failed or server unreachable:", err?.message || err);
	} finally {
		if (typeof clearAuthToken === "function") {
			clearAuthToken();
		}
		try {
			localStorage.removeItem("kisan_setu_token");
			localStorage.removeItem("kisan_setu_user");
			localStorage.removeItem("kisan_setu_role");
			sessionStorage.clear();
		} catch {}

		const path = (window.location.pathname || "").toLowerCase();
		if (path.includes("farmer")) {
			window.location.href = path.includes("/farmer/") ? "../farmer_login.html" : "farmer_login.html";
		} else if (path.includes("buyer")) {
			window.location.href = path.includes("/buyer/") ? "../buyer_login.html" : "buyer_login.html";
		} else if (path.includes("admin")) {
			window.location.href = path.includes("/admin/") ? "../admin_login.html" : "admin_login.html";
		} else {
			window.location.href = "index.html";
		}
	}
}

function bindLogoutButtons() {
	const selectors = [
		"#logoutBtn",
		"#topbarLogoutBtn",
		".logout-btn",
		".logout a",
		".logout button",
		"[data-action='logout']",
		".logout-action"
	];
	const elements = document.querySelectorAll(selectors.join(", "));
	elements.forEach((el) => {
		el.removeEventListener("click", performLogout);
		el.addEventListener("click", performLogout);
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", bindLogoutButtons);
} else {
	bindLogoutButtons();
}

window.loginUser = loginUser;
window.registerUser = registerUser;
window.getCurrentUser = getCurrentUser;
window.refreshSession = refreshSession;
window.logoutUser = logoutUser;
window.performLogout = performLogout;
window.bindLogoutButtons = bindLogoutButtons;
window.changePassword = changePassword;

