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
			titleSpan.textContent = "Kisan Setu - Buyer Portal";
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
