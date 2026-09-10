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

	const topbar = document.querySelector(".topbar");
	const main = document.querySelector(".main");

	let toggleBtn = document.getElementById("sidebarToggleBtn") || document.querySelector(".sidebar-toggle-btn");

	if (topbar) {
		if (!toggleBtn) {
			toggleBtn = document.createElement("button");
			toggleBtn.type = "button";
			toggleBtn.className = "sidebar-toggle-btn";
			toggleBtn.id = "sidebarToggleBtn";
			toggleBtn.setAttribute("aria-label", "Open Navigation Menu");
			toggleBtn.setAttribute("title", "Menu");
			toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
			topbar.insertBefore(toggleBtn, topbar.firstChild);
		}
		// Ensure topbar has a logout button
		const topActions = topbar.querySelector(".top-actions");
		if (topActions && !topActions.querySelector("#topbarLogoutBtn") && !topActions.querySelector(".topbar-logout-btn")) {
			const topLogout = document.createElement("button");
			topLogout.type = "button";
			topLogout.className = "topbar-logout-btn logout-btn";
			topLogout.id = "topbarLogoutBtn";
			topLogout.title = "Logout";
			topLogout.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span>';
			topActions.appendChild(topLogout);
		}
	} else if (main && !document.querySelector(".universal-topbar")) {
		// Create universal sticky topbar for inner pages
		const uniBar = document.createElement("div");
		uniBar.className = "universal-topbar";

		const leftBox = document.createElement("div");
		leftBox.style.cssText = "display: flex; align-items: center; gap: 14px;";

		if (!toggleBtn) {
			toggleBtn = document.createElement("button");
			toggleBtn.type = "button";
			toggleBtn.className = "sidebar-toggle-btn";
			toggleBtn.id = "sidebarToggleBtn";
			toggleBtn.setAttribute("aria-label", "Open Navigation Menu");
			toggleBtn.setAttribute("title", "Menu");
			toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
		}
		leftBox.appendChild(toggleBtn);

		const brandTitle = document.createElement("span");
		brandTitle.style.cssText = "font-weight: 700; color: #16863b; font-size: 15px;";
		brandTitle.textContent = "Kisan Setu - Farmer Portal";
		leftBox.appendChild(brandTitle);

		const rightBox = document.createElement("div");
		rightBox.style.cssText = "display: flex; align-items: center; gap: 12px;";

		const topLogout = document.createElement("button");
		topLogout.type = "button";
		topLogout.className = "topbar-logout-btn logout-btn";
		topLogout.id = "topbarLogoutBtn";
		topLogout.title = "Logout";
		topLogout.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span>';
		rightBox.appendChild(topLogout);

		uniBar.appendChild(leftBox);
		uniBar.appendChild(rightBox);

		main.insertBefore(uniBar, main.firstChild);
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
		toggleBtn.removeEventListener("click", toggleSidebar);
		toggleBtn.addEventListener("click", toggleSidebar);
	}

	if (backdrop) {
		backdrop.addEventListener("click", closeSidebar);
	}

	// Auto close on regular navigation links (excluding logout)
	sidebar.querySelectorAll(".nav-item:not(.logout-btn):not(#logoutBtn)").forEach((item) => {
		item.addEventListener("click", closeSidebar);
	});

	// Robust logout binding on ALL logout buttons
	const handleLogoutClick = async (e) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		try {
			if (typeof logoutUser === "function") {
				await logoutUser();
			}
		} catch (err) {
			console.warn("Logout error:", err);
		}
		try {
			localStorage.removeItem("kisan_setu_user");
			localStorage.removeItem("kisan_setu_token");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("user");
		} catch {}
		const isInSubdir = window.location.pathname.includes("/farmer/") || window.location.pathname.includes("/buyer/");
		window.location.replace(isInSubdir ? "../index.html" : "index.html");
	};

	document.querySelectorAll("#logoutBtn, #topbarLogoutBtn, .topbar-logout-btn, .logout-btn").forEach((btn) => {
		btn.removeEventListener("click", handleLogoutClick);
		btn.addEventListener("click", handleLogoutClick);
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

