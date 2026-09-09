async function getFarmerProfile() {
	return apiRequest("/farmers/me");
}

async function updateFarmerProfile(profile) {
	return apiRequest("/farmers/me", { method: "PATCH", body: profile });
}

async function getFarmerDashboard() {
	return apiRequest("/farmers/me/dashboard");
}

async function getFarmerProduce(params = {}) {
	return apiRequest(`/produce${queryString(params)}`);
}

async function getFarmerCrops(params = {}) {
	return apiRequest(`/crops${queryString(params)}`);
}

async function createFarmerCrop(crop) {
	return apiRequest("/crops", { method: "POST", body: crop });
}

async function createFarmerProduce(produce) {
	let cropId = produce.cropId;
	if (!cropId) {
		try {
			const crops = await getFarmerCrops();
			const cropList = Array.isArray(crops) ? crops : (crops?.items || []);
			const cropName = (produce.title || produce.name || "General").trim();
			const matched = cropList.find((c) => c.name.toLowerCase() === cropName.toLowerCase());
			if (matched) {
				cropId = matched.id;
			} else {
				const newCrop = await createFarmerCrop({
					name: cropName,
					variety: produce.category || "Standard",
					season: "Rabi"
				});
				cropId = newCrop.id;
			}
		} catch (err) {
			console.warn("Could not auto-link crop:", err);
		}
	}

	const backendPayload = {
		cropId,
		title: produce.title || produce.name || "Produce",
		description: produce.description || undefined,
		location: produce.location || "Bihar",
		unit: produce.unit || "KG",
		availableQuantity: Number(produce.availableQuantity ?? produce.quantity ?? 100),
		pricePerUnit: Number(produce.pricePerUnit ?? produce.price ?? 25)
	};

	return apiRequest("/produce", { method: "POST", body: backendPayload });
}

async function deleteFarmerProduce(produceId) {
	return apiRequest(`/produce/${encodeURIComponent(produceId)}`, { method: "DELETE" });
}

async function getFarmerOrders(params = {}) {
	return apiRequest(`/farmers/me/orders${queryString(params)}`);
}

async function getFarmerPayments(params = {}) {
	return apiRequest(`/farmers/me/payments${queryString(params)}`);
}

async function getFarmerLogistics(params = {}) {
	return apiRequest(`/farmers/me/logistics${queryString(params)}`);
}

async function getFarmerHistory(params = {}) {
	return apiRequest(`/farmers/me/orders${queryString({ ...params, status: "COMPLETED" })}`);
}

async function getFarmerDisputes(params = {}) {
	return apiRequest(`/disputes${queryString(params)}`);
}

async function getFarmerNotifications(params = {}) {
	return apiRequest(`/notifications${queryString(params)}`);
}

async function syncFarmerSidebarProfile() {
	try {
		const sName = document.getElementById("farmerSidebarName");
		const sId = document.getElementById("farmerSidebarId");
		if (!sName && !sId) return;

		// Try quick sync from localStorage
		const rawUser = localStorage.getItem("kisan_setu_user");
		if (rawUser) {
			try {
				const u = JSON.parse(rawUser);
				if (sName && u.name) sName.textContent = u.name;
				if (sId && u.id) sId.textContent = `Farmer ID: KS-${String(u.id).substring(0, 6).toUpperCase()}`;
			} catch {}
		}

		// Background fetch real profile if available
		const user = await getCurrentUser();
		if (user) {
			if (sName && user.name) sName.textContent = user.name;
			if (sId && user.id) sId.textContent = `Farmer ID: KS-${String(user.id).substring(0, 6).toUpperCase()}`;
		}
	} catch (e) {
		console.debug("Sidebar farmer sync note:", e);
	}
}

if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", syncFarmerSidebarProfile);
	} else {
		syncFarmerSidebarProfile();
	}
}

window.getFarmerProfile = getFarmerProfile;
window.updateFarmerProfile = updateFarmerProfile;
window.getFarmerDashboard = getFarmerDashboard;
window.getFarmerCrops = getFarmerCrops;
window.createFarmerCrop = createFarmerCrop;
window.getFarmerProduce = getFarmerProduce;
window.createFarmerProduce = createFarmerProduce;
window.deleteFarmerProduce = deleteFarmerProduce;
window.getFarmerOrders = getFarmerOrders;
window.getFarmerPayments = getFarmerPayments;
window.getFarmerLogistics = getFarmerLogistics;
window.getFarmerHistory = getFarmerHistory;
window.getFarmerDisputes = getFarmerDisputes;
window.getFarmerNotifications = getFarmerNotifications;
window.syncFarmerSidebarProfile = syncFarmerSidebarProfile;

