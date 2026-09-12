async function loginUser(credentials) {
	await getCsrfToken();
	const res = await apiRequest("/auth/login", { method: "POST", body: credentials });
	if (res && res.user) {
		try {
			localStorage.setItem("kisan_setu_user", JSON.stringify(res.user));
			if (res.user.role) {
				localStorage.setItem("kisan_setu_role", res.user.role);
			}
		} catch {}
	}
	return res;
}

async function registerUser(userData) {
	await getCsrfToken();
	const res = await apiRequest("/auth/register", { method: "POST", body: userData });
	if (res && res.user) {
		try {
			localStorage.setItem("kisan_setu_user", JSON.stringify(res.user));
			if (res.user.role) {
				localStorage.setItem("kisan_setu_role", res.user.role);
			}
		} catch {}
	}
	return res;
}

async function getCurrentUser() {
	return apiRequest("/auth/me");
}

async function refreshSession() {
	return apiRequest("/auth/refresh", { method: "POST" });
}

async function requestServerLogout() {
	try {
		await getCsrfToken();
		return await apiRequest("/auth/logout", { method: "POST" });
	} catch (err) {
		console.warn("Server logout request error:", err?.message || err);
	}
}

async function performLogout(e) {
	if (e && typeof e.preventDefault === "function") {
		e.preventDefault();
	}
	if (e && typeof e.stopPropagation === "function") {
		e.stopPropagation();
	}
	try {
		await requestServerLogout();
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
		const isInSubdir = path.includes("/farmer/") || path.includes("/buyer/") || path.includes("/admin/");
		let targetUrl = "index.html";

		if (path.includes("farmer")) {
			targetUrl = isInSubdir ? "../farmer_login.html" : "farmer_login.html";
		} else if (path.includes("buyer")) {
			targetUrl = isInSubdir ? "../buyer_login.html" : "buyer_login.html";
		} else if (path.includes("admin")) {
			targetUrl = isInSubdir ? "../admin_login.html" : "admin_login.html";
		}

		window.location.replace(targetUrl);
	}
}

async function logoutUser() {
	return performLogout();
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

// Global capture-phase listener guarantees logout works even if another script attaches a listener
document.addEventListener("click", function (e) {
	const btn = e.target && typeof e.target.closest === "function"
		? e.target.closest("#logoutBtn, #topbarLogoutBtn, .logout-btn, .logout a, .logout button, [data-action='logout'], .logout-action")
		: null;
	if (btn) {
		e.preventDefault();
		e.stopPropagation();
		performLogout();
	}
}, true);

function setupLoginHistoryGuard() {
	const path = (window.location.pathname || "").toLowerCase();
	const isLoginPage = path.includes("login.html") || path.endsWith("login");
	if (!isLoginPage) return;

	const isInSubdir = path.includes("/farmer/") || path.includes("/buyer/") || path.includes("/admin/");
	const indexPath = isInSubdir ? "../index.html" : "index.html";

	try {
		// Push state so clicking Browser Back triggers popstate
		window.history.pushState({ isLoginGuard: true }, "", window.location.href);

		window.addEventListener("popstate", function () {
			// When user hits Back from the login page, take them straight to index.html
			window.location.replace(indexPath);
		});
	} catch (err) {
		console.warn("History guard setup failed:", err);
	}
}

async function checkLoggedInRedirect() {
	const path = (window.location.pathname || "").toLowerCase();
	const isLoginPage = path.includes("login.html");
	const isIndexPage = path === "/" || path === "" || path.endsWith("/index.html") || path.endsWith("index.html") || path.endsWith("/kisan%20setu/") || path.endsWith("/kisan setu/");

	// Only trigger auto-redirect when visiting the landing page or login pages
	if (!isLoginPage && !isIndexPage) {
		return;
	}

	const token = localStorage.getItem("kisan_setu_token");
	if (!token) return;

	let role = localStorage.getItem("kisan_setu_role");
	if (!role) {
		try {
			const me = await getCurrentUser();
			if (me && me.role) {
				role = me.role;
				localStorage.setItem("kisan_setu_role", role);
				localStorage.setItem("kisan_setu_user", JSON.stringify(me));
			}
		} catch (err) {
			if (typeof clearAuthToken === "function") clearAuthToken();
			localStorage.removeItem("kisan_setu_token");
			localStorage.removeItem("kisan_setu_user");
			localStorage.removeItem("kisan_setu_role");
			return;
		}
	}

	if (!role) return;

	// If user is intentionally visiting a specific login page, DO NOT bounce them away if their role is different!
	// (e.g. A user with a buyer session visiting farmer_login.html wants to log into a farmer account).
	if (isLoginPage) {
		const isFarmerLogin = path.includes("farmer_login");
		const isBuyerLogin = path.includes("buyer_login");
		const isAdminLogin = path.includes("admin_login");

		if (isFarmerLogin && role !== "FARMER") return;
		if (isBuyerLogin && role !== "BUYER") return;
		if (isAdminLogin && !["PRAKHAND_ADMIN", "SUPER_ADMIN"].includes(role)) return;
	}

	const isInSubdir = path.includes("/farmer/") || path.includes("/buyer/") || path.includes("/admin/");
	let targetUrl = null;

	if (role === "FARMER") {
		targetUrl = isInSubdir ? "../farmer_dashboard.html" : "farmer_dashboard.html";
	} else if (role === "BUYER") {
		targetUrl = isInSubdir ? "../buyer_dashboard.html" : "buyer_dashboard.html";
	} else if (role === "PRAKHAND_ADMIN" || role === "SUPER_ADMIN") {
		targetUrl = isInSubdir ? "../admin_dashboard.html" : "admin_dashboard.html";
	}

	if (targetUrl) {
		window.location.replace(targetUrl);
	}
}

async function checkAllRouteGuards() {
	await checkLoggedInRedirect();

	const path = (window.location.pathname || "").toLowerCase();
	const isLoginPage = path.includes("login.html") || path.includes("register.html");
	const isIndexPage = path === "/" || path === "" || path.endsWith("/index.html") || path.endsWith("index.html") || path.endsWith("/kisan%20setu/") || path.endsWith("/kisan setu/");

	if (isLoginPage || isIndexPage) {
		return;
	}

	const isFarmerPortal = (path.includes("/farmer/") || path.includes("farmer_dashboard")) && !path.includes("login") && !path.includes("register");
	const isBuyerPortal = (path.includes("/buyer/") || path.includes("buyer_dashboard")) && !path.includes("login") && !path.includes("register");
	const isAdminPortal = (path.includes("/admin/") || path.includes("admin_dashboard")) && !path.includes("login");

	if (!isFarmerPortal && !isBuyerPortal && !isAdminPortal) {
		return;
	}

	const isInSubdir = path.includes("/farmer/") || path.includes("/buyer/") || path.includes("/admin/");
	const token = localStorage.getItem("kisan_setu_token");
	const role = localStorage.getItem("kisan_setu_role");

	// 1. If not logged in at all, redirect to respective login
	if (!token) {
		let target = "index.html";
		if (isFarmerPortal) target = isInSubdir ? "../farmer_login.html" : "farmer_login.html";
		else if (isBuyerPortal) target = isInSubdir ? "../buyer_login.html" : "buyer_login.html";
		else if (isAdminPortal) target = isInSubdir ? "../admin_login.html" : "admin_login.html";

		window.location.replace(target);
		return;
	}

	// 2. Role verification for Farmer portal
	if (isFarmerPortal && role && role !== "FARMER") {
		console.warn("Logged in role is " + role + ", but farmer account required for farmer portal. Redirecting to farmer login.");
		window.location.replace(isInSubdir ? "../farmer_login.html" : "farmer_login.html");
		return;
	}

	// 3. Role verification for Buyer portal
	if (isBuyerPortal && role && role !== "BUYER") {
		console.warn("Logged in role is " + role + ", but buyer account required for buyer portal. Redirecting to buyer login.");
		window.location.replace(isInSubdir ? "../buyer_login.html" : "buyer_login.html");
		return;
	}

	// 4. Role verification for Admin pages
	if (isAdminPortal) {
		try {
			const user = await getCurrentUser();
			if (!user || !["PRAKHAND_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
				throw new Error("Unauthorized");
			}
		} catch {
			window.location.replace(isInSubdir ? "../admin_login.html" : "admin_login.html");
		}
	}
}

function initAuth() {
	bindLogoutButtons();
	setupLoginHistoryGuard();
	checkAllRouteGuards();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initAuth);
} else {
	initAuth();
}

// Ensure Back/Forward cache (bfcache) triggers route validation
window.addEventListener("pageshow", function (event) {
	checkAllRouteGuards();
});

window.loginUser = loginUser;
window.registerUser = registerUser;
window.getCurrentUser = getCurrentUser;
window.refreshSession = refreshSession;
window.logoutUser = logoutUser;
window.performLogout = performLogout;
window.bindLogoutButtons = bindLogoutButtons;
window.changePassword = changePassword;

// Global Secret Admin Shortcut: Ctrl + Shift + A
window.addEventListener("keydown", function(e) {
	if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
		e.preventDefault();
		const path = (window.location.pathname || "").toLowerCase();
		if (path.includes("/admin/") || path.endsWith("admin_login.html")) return;
		window.location.href = path.includes("/farmer/") || path.includes("/buyer/") ? "../admin_login.html" : "admin_login.html";
	}
});


