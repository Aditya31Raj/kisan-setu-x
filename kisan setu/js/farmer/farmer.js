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
	let farmerId = params.farmerId;
	if (!farmerId) {
		try {
			const rawUser = localStorage.getItem("kisan_setu_user");
			if (rawUser) {
				const u = JSON.parse(rawUser);
				if (u && u.id) farmerId = u.id;
			}
		} catch {}
	}
	return apiRequest(`/produce${queryString({ ...params, ...(farmerId ? { farmerId } : {}) })}`);
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
		// Clean crop name (strip bracketed channel prefix if any, e.g. [Block Procurement / PACS] Rice -> Rice)
		const rawTitle = (produce.title || produce.name || "General").trim();
		const cleanCropName = rawTitle.replace(/\[[^\]]*\]/g, "").trim() || "Farm Produce";

		try {
			const crops = await getFarmerCrops();
			const cropList = Array.isArray(crops) ? crops : (crops?.items || crops?.data || []);

			// Try case-insensitive exact or substring match
			let matched = cropList.find((c) => c.name && c.name.toLowerCase() === cleanCropName.toLowerCase());
			if (!matched && cropList.length > 0) {
				matched = cropList.find((c) => c.name && (cleanCropName.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cleanCropName.toLowerCase())));
			}

			if (matched) {
				cropId = matched.id;
			} else {
				const newCrop = await createFarmerCrop({
					name: cleanCropName,
					variety: produce.category || "Standard",
					season: "Rabi"
				});
				cropId = newCrop?.id || newCrop?.data?.id || (newCrop?.data ? newCrop.data.id : null);
			}
		} catch (err) {
			console.warn("Could not auto-link crop:", err);
			// Fallback: if farmer has any crops, pick the first available one
			try {
				const crops = await getFarmerCrops();
				const cropList = Array.isArray(crops) ? crops : (crops?.items || crops?.data || []);
				if (cropList.length > 0) {
					cropId = cropList[0].id;
				}
			} catch {}
		}
	}

	// Final fallback if crop creation or linking had an issue
	if (!cropId) {
		const rawTitle = (produce.title || produce.name || "Produce").trim();
		const cleanCropName = rawTitle.replace(/\[[^\]]*\]/g, "").trim() || "General Crop";
		try {
			const emergencyCrop = await createFarmerCrop({
				name: cleanCropName,
				variety: produce.category || "Standard",
				season: "Rabi"
			});
			cropId = emergencyCrop?.id || emergencyCrop?.data?.id;
		} catch (err2) {
			throw new Error("Unable to create/link crop for this produce listing: " + friendlyErrorMessage(err2));
		}
	}

	const backendPayload = {
		cropId,
		title: produce.title || produce.name || "Produce",
		description: produce.description || undefined,
		location: produce.location || "Bihar",
		unit: String(produce.unit || "KG").toUpperCase(),
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

			const banner = document.getElementById("farmerKycStatusBanner");
			if (banner) {
				if (!user.isVerified) {
					banner.style.display = "block";
					banner.innerHTML = `
						<div style="background:linear-gradient(135deg, #fffbeb, #fef3c7); border:1px solid #f59e0b; color:#92400e; padding:14px 20px; border-radius:12px; display:flex; align-items:center; justify-content:space-between; gap:14px; box-shadow:0 4px 12px rgba(245,158,11,0.08);">
							<div style="display:flex; align-items:center; gap:12px;">
								<i class="fa-solid fa-clock-rotate-left" style="font-size:22px; color:#d97706;"></i>
								<div>
									<strong style="font-size:14px; display:block; color:#92400e;">KYC Verification Pending / सत्यापन प्रक्रियाधीन</strong>
									<span style="font-size:12px; color:#b45309;">Your KYC documents have been submitted to your Block Agriculture Admin for authorization. You will receive an in-app alert upon approval.</span>
								</div>
							</div>
							<span style="background:#f59e0b; color:white; font-size:11px; font-weight:700; padding:6px 12px; border-radius:20px; white-space:nowrap; letter-spacing:0.5px;">
								UNDER REVIEW
							</span>
						</div>
					`;
				} else {
					banner.style.display = "block";
					banner.innerHTML = `
						<div style="background:linear-gradient(135deg, #f0fdf4, #dcfce7); border:1px solid #86efac; color:#166534; padding:12px 20px; border-radius:12px; display:flex; align-items:center; justify-content:space-between; gap:14px;">
							<div style="display:flex; align-items:center; gap:10px;">
								<i class="fa-solid fa-circle-check" style="font-size:18px; color:#16a34a;"></i>
								<div>
									<strong style="font-size:13px; color:#15803d;"><span data-i18n="kyc_verified_farmer">KYC Verified Farmer Account</span></strong>
									<span style="font-size:11px; color:#166534; display:block;" data-i18n="kyc_verified_farmer_desc">Authorized for Open Market Trading, Block Procurement, and Subsidized Seeds/Fertilizer Quotas.</span>
								</div>
							</div>
							<span style="background:#16a34a; color:white; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; white-space:nowrap;">
								AUTHORIZED ✓
							</span>
						</div>
					`;
					if (window.i18n && typeof window.i18n.applyCurrentLanguage === "function") {
						window.i18n.applyCurrentLanguage();
					}
				}
			}
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

async function getFarmerInputs(params = {}) {
	try {
		return await apiRequest(`/input-requests${queryString(params)}`);
	} catch (err) {
		if (err && (err.status === 404 || String(err.message || "").includes("Route not found"))) {
			return await apiRequest(`/inputs${queryString(params)}`);
		}
		throw err;
	}
}

async function requestFarmerInput(data) {
	try {
		return await apiRequest("/input-requests", { method: "POST", body: data });
	} catch (err) {
		if (err && (err.status === 404 || String(err.message || "").includes("Route not found"))) {
			return await apiRequest("/inputs", { method: "POST", body: data });
		}
		throw err;
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
window.getFarmerInputs = getFarmerInputs;
window.requestFarmerInput = requestFarmerInput;
window.syncFarmerSidebarProfile = syncFarmerSidebarProfile;
window.setupHamburgerSidebar = setupHamburgerSidebar;

