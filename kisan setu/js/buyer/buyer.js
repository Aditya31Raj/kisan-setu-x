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
		brandTitle.textContent = "Kisan Setu - Buyer Portal";
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
			syncBuyerSidebarProfile();
			setupHamburgerSidebar();
		});
	} else {
		syncBuyerSidebarProfile();
		setupHamburgerSidebar();
	}
}

window.getBuyerProfile = getBuyerProfile;
window.updateBuyerProfile = updateBuyerProfile;
window.getBuyerDashboard = getBuyerDashboard;
window.syncBuyerSidebarProfile = syncBuyerSidebarProfile;
window.setupHamburgerSidebar = setupHamburgerSidebar;
