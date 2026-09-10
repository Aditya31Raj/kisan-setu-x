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

function setupHamburgerSidebar() {
	const sidebar = document.querySelector(".sidebar");
	if (!sidebar) return;

	let backdrop = document.querySelector(".sidebar-backdrop");
	if (!backdrop) {
		backdrop = document.createElement("div");
		backdrop.className = "sidebar-backdrop";
		backdrop.id = "sidebarBackdrop";
		document.body.appendChild(backdrop);
	}

	const brand = sidebar.querySelector(".brand");
	if (brand && !brand.querySelector(".sidebar-close-btn")) {
		const closeBtn = document.createElement("button");
		closeBtn.type = "button";
		closeBtn.className = "sidebar-close-btn";
		closeBtn.id = "sidebarCloseBtn";
		closeBtn.setAttribute("aria-label", "Close Navigation");
		closeBtn.innerHTML = "&times;";
		closeBtn.addEventListener("click", closeSidebar);
		brand.appendChild(closeBtn);
	}

	let toggleBtn = document.getElementById("sidebarToggleBtn") || document.querySelector(".sidebar-toggle-btn");
	if (!toggleBtn) {
		const topbar = document.querySelector(".topbar");
		const pageHeader = document.querySelector(".page-header");
		const main = document.querySelector(".main");

		toggleBtn = document.createElement("button");
		toggleBtn.type = "button";
		toggleBtn.className = "sidebar-toggle-btn";
		toggleBtn.id = "sidebarToggleBtn";
		toggleBtn.setAttribute("aria-label", "Open Navigation Menu");
		toggleBtn.setAttribute("title", "Navigation Menu");
		toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';

		if (topbar) {
			topbar.insertBefore(toggleBtn, topbar.firstChild);
		} else if (pageHeader) {
			pageHeader.style.display = "flex";
			pageHeader.style.alignItems = "center";
			pageHeader.style.gap = "14px";
			pageHeader.insertBefore(toggleBtn, pageHeader.firstChild);
		} else if (main) {
			const topBar = document.createElement("div");
			topBar.style.cssText = "padding: 12px 20px; background: #ffffff; border-bottom: 1px solid #e2e9e3; display: flex; align-items: center; gap: 14px; position: sticky; top: 0; z-index: 100;";
			topBar.appendChild(toggleBtn);
			const titleSpan = document.createElement("span");
			titleSpan.style.cssText = "font-weight: 700; color: #16863b; font-size: 15px;";
			titleSpan.textContent = "Kisan Setu - Farmer Portal";
			topBar.appendChild(titleSpan);
			main.insertBefore(topBar, main.firstChild);
		}
	}

	function openSidebar() {
		sidebar.classList.add("active");
		sidebar.classList.add("open");
		if (backdrop) backdrop.classList.add("active");
		document.body.style.overflow = "hidden";
	}

	function closeSidebar() {
		sidebar.classList.remove("active");
		sidebar.classList.remove("open");
		if (backdrop) backdrop.classList.remove("active");
		document.body.style.overflow = "";
	}

	function toggleSidebar(e) {
		if (e) e.stopPropagation();
		if (sidebar.classList.contains("active") || sidebar.classList.contains("open")) {
			closeSidebar();
		} else {
			openSidebar();
		}
	}

	if (toggleBtn) {
		toggleBtn.addEventListener("click", toggleSidebar);
	}

	if (backdrop) {
		backdrop.addEventListener("click", closeSidebar);
	}

	sidebar.querySelectorAll(".nav-item").forEach((item) => {
		item.addEventListener("click", closeSidebar);
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeSidebar();
	});
}

if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			syncFarmerSidebarProfile();
			setupHamburgerSidebar();
		});
	} else {
		syncFarmerSidebarProfile();
		setupHamburgerSidebar();
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
window.setupHamburgerSidebar = setupHamburgerSidebar;

