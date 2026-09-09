function escapeHTML(str) {
	return String(str ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
	if (!dateStr) return "N/A";
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return String(dateStr);
	return d.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric"
	});
}

async function getAdminUsers(params) {
	return apiRequest(`/admin/users${queryString(params)}`);
}

async function updateAdminUser(userId, changes) {
	return apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
		method: "PATCH",
		body: changes
	});
}

async function getAdminFarmers(params) {
	return apiRequest(`/admin/farmers${queryString(params)}`);
}

async function getAdminBuyers(params) {
	return apiRequest(`/admin/buyers${queryString(params)}`);
}

/* ==========================================================================
   FARMERS DIRECTORY (admin/farmers.html)
   ========================================================================== */
let allFarmers = [];

async function loadAdminFarmers() {
	const tableBody = document.getElementById("farmerTableBody") || document.querySelector(".admin-table tbody");
	const countBadge = document.getElementById("farmerTotalCount") || document.querySelector(".section-header .view-all");
	if (!tableBody) return;

	tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#666;">
		<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading live farmers...
	</td></tr>`;

	try {
		const res = await getAdminFarmers({ limit: 100 });
		allFarmers = res?.items || (Array.isArray(res) ? res : (res?.data?.items || []));

		renderFarmerRows(allFarmers);

		// Update dynamic farmer stats
		const totalEl = document.getElementById("adminStatTotalFarmers");
		const activeEl = document.getElementById("adminStatActiveFarmers");
		const pendingEl = document.getElementById("adminStatPendingFarmers");
		const suspendedEl = document.getElementById("adminStatSuspendedFarmers");
		if (totalEl) totalEl.textContent = allFarmers.length;
		if (activeEl) activeEl.textContent = allFarmers.filter(f => f.isActive).length;
		if (pendingEl) pendingEl.textContent = allFarmers.filter(f => !f.isVerified).length;
		if (suspendedEl) suspendedEl.textContent = allFarmers.filter(f => !f.isActive).length;

		if (countBadge) {
			countBadge.textContent = `${allFarmers.length} Farmer${allFarmers.length === 1 ? "" : "s"}`;
		}
	} catch (err) {
		console.error("Error loading farmers:", err);
		tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:#ba3d32;">
			<i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i> Failed to load farmers: ${escapeHTML(friendlyErrorMessage(err))}
		</td></tr>`;
	}
}

function renderFarmerRows(farmers) {
	const tableBody = document.getElementById("farmerTableBody") || document.querySelector(".admin-table tbody");
	if (!tableBody) return;

	if (!farmers || farmers.length === 0) {
		tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:36px; color:#777;">
			<i class="fa-solid fa-user-slash" style="font-size:24px; margin-bottom:8px; display:block;"></i>
			No registered farmers found matching your criteria.
		</td></tr>`;
		return;
	}

	tableBody.innerHTML = farmers.map((f, idx) => {
		const farmerId = `FR-${f.id.substring(0, 5).toUpperCase()}`;
		const name = escapeHTML(f.name || "Unnamed Farmer");
		const loc = escapeHTML([f.farmerProfile?.village, f.farmerProfile?.district, f.farmerProfile?.state].filter(Boolean).join(", ") || "Bihar");
		const contact = escapeHTML(f.phone || f.email || "No contact");
		const date = formatDate(f.createdAt);
		const statusText = f.isActive ? (f.isVerified ? "Active" : "Active (Unverified)") : "Suspended";
		const statusClass = f.isActive ? (f.isVerified ? "success" : "pending") : "danger";

		return `
			<tr>
				<td><strong>${farmerId}</strong></td>
				<td>${name}</td>
				<td>${loc}</td>
				<td>${contact}</td>
				<td>${date}</td>
				<td><span class="status ${statusClass}">${statusText}</span></td>
				<td>
					<button type="button" class="admin-view-btn" onclick="showFarmerDetails('${f.id}')">View</button>
				</td>
			</tr>
		`;
	}).join("");
}

function filterFarmers() {
	const query = (document.getElementById("farmerSearch")?.value || "").toLowerCase().trim();
	const status = (document.getElementById("farmerStatus")?.value || "").toLowerCase().trim();
	const loc = (document.getElementById("farmerLocation")?.value || "").toLowerCase().trim();

	const filtered = allFarmers.filter((f) => {
		const name = (f.name || "").toLowerCase();
		const email = (f.email || "").toLowerCase();
		const phone = (f.phone || "").toLowerCase();
		const id = (f.id || "").toLowerCase();
		const location = [f.farmerProfile?.village, f.farmerProfile?.district, f.farmerProfile?.state].filter(Boolean).join(" ").toLowerCase();

		const matchQuery = !query || name.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
		const matchLoc = !loc || location.includes(loc);

		let matchStatus = true;
		if (status === "active") matchStatus = f.isActive === true;
		if (status === "pending") matchStatus = f.isVerified === false;
		if (status === "suspended") matchStatus = f.isActive === false;

		return matchQuery && matchLoc && matchStatus;
	});

	renderFarmerRows(filtered);
}

function showFarmerDetails(id) {
	const f = allFarmers.find((x) => x.id === id);
	if (!f) return;
	const details = `Farmer: ${f.name}\nEmail: ${f.email || "N/A"}\nPhone: ${f.phone || "N/A"}\nVillage: ${f.farmerProfile?.village || "N/A"}\nDistrict: ${f.farmerProfile?.district || "N/A"}\nStatus: ${f.isActive ? "Active" : "Suspended"}`;
	alert(details);
}

/* ==========================================================================
   BUYERS DIRECTORY (admin/buyers.html)
   ========================================================================== */
let allBuyers = [];

async function loadAdminBuyers() {
	const tableBody = document.getElementById("buyerTableBody") || document.querySelector(".admin-table tbody");
	const countBadge = document.getElementById("buyerTotalCount") || document.querySelector(".section-header .view-all");
	if (!tableBody) return;

	tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#666;">
		<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading live buyers...
	</td></tr>`;

	try {
		const res = await getAdminBuyers({ limit: 100 });
		allBuyers = res?.items || (Array.isArray(res) ? res : (res?.data?.items || []));

		renderBuyerRows(allBuyers);

		// Update dynamic buyer stats
		const totalEl = document.getElementById("adminStatTotalBuyers");
		const activeEl = document.getElementById("adminStatActiveBuyers");
		const pendingEl = document.getElementById("adminStatPendingBuyers");
		const suspendedEl = document.getElementById("adminStatSuspendedBuyers");
		const buyersBadge = document.getElementById("adminBuyersCountBadge");
		if (totalEl) totalEl.textContent = allBuyers.length;
		if (activeEl) activeEl.textContent = allBuyers.filter(b => b.isActive).length;
		if (pendingEl) pendingEl.textContent = allBuyers.filter(b => !b.isVerified).length;
		if (suspendedEl) suspendedEl.textContent = allBuyers.filter(b => !b.isActive).length;
		if (buyersBadge) buyersBadge.textContent = `${allBuyers.length} Buyer${allBuyers.length === 1 ? "" : "s"}`;

		if (countBadge) {
			countBadge.textContent = `${allBuyers.length} Buyer${allBuyers.length === 1 ? "" : "s"}`;
		}
	} catch (err) {
		console.error("Error loading buyers:", err);
		tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:#ba3d32;">
			<i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i> Failed to load buyers: ${escapeHTML(friendlyErrorMessage(err))}
		</td></tr>`;
	}
}

function renderBuyerRows(buyers) {
	const tableBody = document.getElementById("buyerTableBody") || document.querySelector(".admin-table tbody");
	if (!tableBody) return;

	if (!buyers || buyers.length === 0) {
		tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:36px; color:#777;">
			<i class="fa-solid fa-store-slash" style="font-size:24px; margin-bottom:8px; display:block;"></i>
			No registered buyers found matching your criteria.
		</td></tr>`;
		return;
	}

	tableBody.innerHTML = buyers.map((b) => {
		const buyerId = `BY-${b.id.substring(0, 5).toUpperCase()}`;
		const business = escapeHTML(b.buyerProfile?.businessName || b.name || "Independent Trader");
		const contactPerson = escapeHTML(b.name || "N/A");
		const loc = escapeHTML([b.buyerProfile?.district, b.buyerProfile?.state].filter(Boolean).join(", ") || "Bihar");
		const contact = escapeHTML(b.phone || b.email || "No contact");
		const date = formatDate(b.createdAt);
		const statusText = b.isActive ? (b.isVerified ? "Verified" : "Active") : "Suspended";
		const statusClass = b.isActive ? "success" : "danger";

		return `
			<tr>
				<td><strong>${buyerId}</strong></td>
				<td>
					<strong>${business}</strong>
					<small style="display:block; color:#777; font-size:11px;">Contact: ${contactPerson}</small>
				</td>
				<td>${loc}</td>
				<td>${contact}</td>
				<td>${date}</td>
				<td><span class="status ${statusClass}">${statusText}</span></td>
				<td>
					<button type="button" class="admin-view-btn" onclick="showBuyerDetails('${b.id}')">View</button>
				</td>
			</tr>
		`;
	}).join("");
}

function filterBuyers() {
	const query = (document.getElementById("buyerSearch")?.value || "").toLowerCase().trim();
	const status = (document.getElementById("buyerStatus")?.value || "").toLowerCase().trim();
	const loc = (document.getElementById("buyerLocation")?.value || "").toLowerCase().trim();

	const filtered = allBuyers.filter((b) => {
		const name = (b.name || "").toLowerCase();
		const business = (b.buyerProfile?.businessName || "").toLowerCase();
		const email = (b.email || "").toLowerCase();
		const phone = (b.phone || "").toLowerCase();
		const id = (b.id || "").toLowerCase();
		const location = [b.buyerProfile?.district, b.buyerProfile?.state].filter(Boolean).join(" ").toLowerCase();

		const matchQuery = !query || name.includes(query) || business.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
		const matchLoc = !loc || location.includes(loc);

		let matchStatus = true;
		if (status === "active") matchStatus = b.isActive === true;
		if (status === "pending") matchStatus = b.isVerified === false;
		if (status === "suspended") matchStatus = b.isActive === false;

		return matchQuery && matchLoc && matchStatus;
	});

	renderBuyerRows(filtered);
}

function showBuyerDetails(id) {
	const b = allBuyers.find((x) => x.id === id);
	if (!b) return;
	const details = `Business: ${b.buyerProfile?.businessName || "N/A"}\nOwner: ${b.name}\nEmail: ${b.email || "N/A"}\nPhone: ${b.phone || "N/A"}\nLocation: ${b.buyerProfile?.district || "Bihar"}\nStatus: ${b.isActive ? "Active" : "Suspended"}`;
	alert(details);
}

// Global initialization
// Global initialization
document.addEventListener("DOMContentLoaded", () => {
	const path = (window.location.pathname || "").toLowerCase();
	const hasFarmerTable = Boolean(document.getElementById("farmerTableBody") || document.getElementById("farmerSearch"));
	const hasBuyerTable = Boolean(document.getElementById("buyerTableBody") || document.getElementById("buyerSearch"));

	if (hasFarmerTable || path.includes("farmer")) {
		loadAdminFarmers();

		document.querySelector(".admin-search-btn")?.addEventListener("click", filterFarmers);
		document.getElementById("farmerSearch")?.addEventListener("input", filterFarmers);
		document.getElementById("farmerStatus")?.addEventListener("change", filterFarmers);
		document.getElementById("farmerLocation")?.addEventListener("input", filterFarmers);

		document.querySelector(".admin-clear-btn")?.addEventListener("click", () => {
			if (document.getElementById("farmerSearch")) document.getElementById("farmerSearch").value = "";
			if (document.getElementById("farmerStatus")) document.getElementById("farmerStatus").value = "";
			if (document.getElementById("farmerLocation")) document.getElementById("farmerLocation").value = "";
			renderFarmerRows(allFarmers);
		});
	}
	
	if (hasBuyerTable || path.includes("buyer")) {
		loadAdminBuyers();

		document.querySelector(".admin-search-btn")?.addEventListener("click", filterBuyers);
		document.getElementById("buyerSearch")?.addEventListener("input", filterBuyers);
		document.getElementById("buyerStatus")?.addEventListener("change", filterBuyers);
		document.getElementById("buyerLocation")?.addEventListener("input", filterBuyers);

		document.querySelector(".admin-clear-btn")?.addEventListener("click", () => {
			if (document.getElementById("buyerSearch")) document.getElementById("buyerSearch").value = "";
			if (document.getElementById("buyerStatus")) document.getElementById("buyerStatus").value = "";
			if (document.getElementById("buyerLocation")) document.getElementById("buyerLocation").value = "";
			renderBuyerRows(allBuyers);
		});
	}
});

window.getAdminUsers = getAdminUsers;
window.updateAdminUser = updateAdminUser;
window.getAdminFarmers = getAdminFarmers;
window.getAdminBuyers = getAdminBuyers;
window.loadAdminFarmers = loadAdminFarmers;
window.loadAdminBuyers = loadAdminBuyers;
window.showFarmerDetails = showFarmerDetails;
window.showBuyerDetails = showBuyerDetails;

