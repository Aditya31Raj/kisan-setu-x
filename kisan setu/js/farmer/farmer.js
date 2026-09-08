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

