async function getAdminDashboard() {
	return apiRequest("/admin/dashboard");
}

async function getAdminAlerts(params) {
	return apiRequest(`/admin/alerts${queryString(params)}`);
}

async function getAdminAuditLogs(params) {
	return apiRequest(`/admin/audit-logs${queryString(params)}`);
}

async function ensureAdminAuth() {
	try {
		const user = await getCurrentUser();
		if (!user || !["PRAKHAND_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
			throw new Error("Unauthorized admin access");
		}
		return user;
	} catch (err) {
		console.warn("Admin authorization check failed:", err?.message || err);
		const path = (window.location.pathname || "").toLowerCase();
		window.location.href = path.includes("/admin/") ? "../admin_login.html" : "admin_login.html";
		return null;
	}
}

window.getAdminDashboard = getAdminDashboard;
window.getAdminAlerts = getAdminAlerts;
window.getAdminAuditLogs = getAdminAuditLogs;
window.ensureAdminAuth = ensureAdminAuth;

// Ensure Ask Samriddhi is loaded in Admin Portal
document.addEventListener("DOMContentLoaded", () => {
	if (!document.getElementById("samriddhi-trigger-btn") && !document.getElementById("samriddhi-script")) {
		const s = document.createElement("script");
		s.id = "samriddhi-script";
		s.src = window.location.pathname.includes("/admin/") ? "../js/core/ask-samriddhi.js" : "js/core/ask-samriddhi.js";
		document.body.appendChild(s);
	}
});


