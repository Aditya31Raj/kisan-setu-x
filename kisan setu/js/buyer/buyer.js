async function getBuyerProfile() {
	return apiRequest("/buyers/me");
}

async function updateBuyerProfile(profile) {
	return apiRequest("/buyers/me", { method: "PATCH", body: profile });
}

async function getBuyerDashboard() {
	return apiRequest("/buyers/me/dashboard");
}

window.getBuyerProfile = getBuyerProfile;
window.updateBuyerProfile = updateBuyerProfile;
window.getBuyerDashboard = getBuyerDashboard;
