async function getBuyerProfile() {
	return apiRequest("/buyers/me");
}

async function updateBuyerProfile(profile) {
	return apiRequest("/buyers/me", { method: "PATCH", body: profile });
}

async function getBuyerDashboard() {
	return apiRequest("/buyers/me/dashboard");
}

async function syncBuyerSidebarProfile() {
	try {
		const sName = document.getElementById("buyerSidebarName");
		const sId = document.getElementById("buyerSidebarId");
		if (!sName && !sId) return;

		// Try quick sync from localStorage
		const rawUser = localStorage.getItem("kisan_setu_user");
		if (rawUser) {
			try {
				const u = JSON.parse(rawUser);
				if (sName && (u.businessName || u.name)) sName.textContent = u.businessName || u.name;
				if (sId && u.id) sId.textContent = `Buyer ID: BY-${String(u.id).substring(0, 6).toUpperCase()}`;
			} catch {}
		}

		// Background fetch real profile if available
		const user = await getCurrentUser();
		if (user) {
			const bName = user.buyerProfile?.businessName || user.name;
			if (sName && bName) sName.textContent = bName;
			if (sId && user.id) sId.textContent = `Buyer ID: BY-${String(user.id).substring(0, 6).toUpperCase()}`;
		}
	} catch (e) {
		console.debug("Sidebar buyer sync note:", e);
	}
}

if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", syncBuyerSidebarProfile);
	} else {
		syncBuyerSidebarProfile();
	}
}

window.getBuyerProfile = getBuyerProfile;
window.updateBuyerProfile = updateBuyerProfile;
window.getBuyerDashboard = getBuyerDashboard;
window.syncBuyerSidebarProfile = syncBuyerSidebarProfile;
