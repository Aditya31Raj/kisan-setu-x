async function getAdminDashboard() {
	return apiRequest("/admin/dashboard");
}

async function getAdminAlerts(params) {
	return apiRequest(`/admin/alerts${queryString(params)}`);
}

async function getAdminAuditLogs(params) {
	return apiRequest(`/admin/audit-logs${queryString(params)}`);
}

window.getAdminDashboard = getAdminDashboard;
window.getAdminAlerts = getAdminAlerts;
window.getAdminAuditLogs = getAdminAuditLogs;
