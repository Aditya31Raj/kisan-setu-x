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

		// Dynamic farmer stats
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

	tableBody.innerHTML = farmers.map((f) => {
		const farmerId = `FR-${f.id.substring(0, 5).toUpperCase()}`;
		const name = escapeHTML(f.name || "Unnamed Farmer");
		const loc = escapeHTML([f.farmerProfile?.village, f.farmerProfile?.district, f.farmerProfile?.state].filter(Boolean).join(", ") || "Bihar");
		const contact = escapeHTML(f.phone || f.email || "No contact");
		const date = formatDate(f.createdAt);
		const kycDoc = f.identity?.providerReference || f.identity?.maskedIdentifier || "Not submitted";
		const isVerified = Boolean(f.isVerified);
		const statusText = isVerified ? "Verified ✓" : "KYC Pending";
		const statusClass = isVerified ? "success" : "pending";

		return `
			<tr>
				<td><strong>${farmerId}</strong></td>
				<td>
					<strong>${name}</strong>
					<small style="display:block; color:#666; font-size:11px;">Doc: ${escapeHTML(kycDoc)}</small>
				</td>
				<td>${loc}</td>
				<td>${contact}</td>
				<td>${date}</td>
				<td><span class="status ${statusClass}">${statusText}</span></td>
				<td>
					<div style="display:flex; gap:6px; align-items:center;">
						<button type="button" class="admin-view-btn" onclick="openUserKycModal('${f.id}', 'farmer')">Details</button>
						${!isVerified ? `
							<button type="button" class="action-btn" onclick="authorizeUser('${f.id}', true, 'farmer')" style="background:#16a34a; color:#fff; border:none; padding:5px 10px; border-radius:5px; font-size:11px; cursor:pointer; font-weight:600; white-space:nowrap;">
								<i class="fa-solid fa-check"></i> Authorize
							</button>
						` : `
							<button type="button" class="action-btn" onclick="authorizeUser('${f.id}', false, 'farmer')" style="background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; padding:4px 8px; border-radius:5px; font-size:10px; cursor:pointer; font-weight:600;">
								Revoke
							</button>
						`}
					</div>
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
		if (status === "active") matchStatus = f.isActive === true && f.isVerified === true;
		if (status === "pending") matchStatus = f.isVerified === false;
		if (status === "suspended") matchStatus = f.isActive === false;

		return matchQuery && matchLoc && matchStatus;
	});

	renderFarmerRows(filtered);
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

		// Dynamic buyer stats
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
		const kycDoc = b.identity?.providerReference || b.identity?.maskedIdentifier || "Pending KYC";
		const isVerified = Boolean(b.isVerified);
		const statusText = isVerified ? "Verified ✓" : "KYC Pending";
		const statusClass = isVerified ? "success" : "pending";

		return `
			<tr>
				<td><strong>${buyerId}</strong></td>
				<td>
					<strong>${business}</strong>
					<small style="display:block; color:#777; font-size:11px;">Owner: ${contactPerson} &bull; Doc: ${escapeHTML(kycDoc)}</small>
				</td>
				<td>${loc}</td>
				<td>${contact}</td>
				<td>${date}</td>
				<td><span class="status ${statusClass}">${statusText}</span></td>
				<td>
					<div style="display:flex; gap:6px; align-items:center;">
						<button type="button" class="admin-view-btn" onclick="openUserKycModal('${b.id}', 'buyer')">Details</button>
						${!isVerified ? `
							<button type="button" class="action-btn" onclick="authorizeUser('${b.id}', true, 'buyer')" style="background:#16a34a; color:#fff; border:none; padding:5px 10px; border-radius:5px; font-size:11px; cursor:pointer; font-weight:600; white-space:nowrap;">
								<i class="fa-solid fa-check"></i> Authorize
							</button>
						` : `
							<button type="button" class="action-btn" onclick="authorizeUser('${b.id}', false, 'buyer')" style="background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; padding:4px 8px; border-radius:5px; font-size:10px; cursor:pointer; font-weight:600;">
								Revoke
							</button>
						`}
					</div>
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
		if (status === "active") matchStatus = b.isActive === true && b.isVerified === true;
		if (status === "pending") matchStatus = b.isVerified === false;
		if (status === "suspended") matchStatus = b.isActive === false;

		return matchQuery && matchLoc && matchStatus;
	});

	renderBuyerRows(filtered);
}

/* ==========================================================================
   USER AUTHORIZATION & MODAL
   ========================================================================== */
async function authorizeUser(userId, approve, roleType) {
	const actionText = approve ? "verify and authorize" : "revoke verification for";
	if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

	try {
		await updateAdminUser(userId, { isVerified: approve });
		alert(`User KYC status successfully updated to: ${approve ? "VERIFIED & AUTHORIZED" : "UNVERIFIED"}.`);
		if (roleType === "farmer") {
			await loadAdminFarmers();
		} else {
			await loadAdminBuyers();
		}
		closeUserKycModal();
	} catch (err) {
		console.error("Error authorizing user:", err);
		alert(`Action failed: ${friendlyErrorMessage(err)}`);
	}
}

function openUserKycModal(userId, roleType) {
	const user = (roleType === "farmer" ? allFarmers : allBuyers).find(x => x.id === userId);
	if (!user) return;

	let modal = document.getElementById("adminUserKycModal");
	if (!modal) {
		modal = document.createElement("div");
		modal.id = "adminUserKycModal";
		modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;";
		document.body.appendChild(modal);
	}

	const docRef = user.identity?.providerReference || "Aadhaar / Gov ID";
	const maskedId = user.identity?.maskedIdentifier || user.phone || "Submitted with application";
	const verified = Boolean(user.isVerified);
	const loc = roleType === "farmer"
		? [user.farmerProfile?.village, user.farmerProfile?.district, user.farmerProfile?.state].filter(Boolean).join(", ")
		: [user.buyerProfile?.district, user.buyerProfile?.state].filter(Boolean).join(", ");

	modal.innerHTML = `
		<div style="background:white; border-radius:14px; width:520px; max-width:100%; box-shadow:0 20px 40px rgba(0,0,0,0.15); overflow:hidden; border:1px solid #e2e8e3; animation:fadeIn 0.2s ease;">
			<div style="background:linear-gradient(135deg, #10B981, #059669); color:white; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
				<h3 style="margin:0; font-size:18px; font-weight:700;">
					<i class="fa-solid fa-id-card" style="margin-right:8px;"></i> KYC Verification Review
				</h3>
				<button type="button" onclick="closeUserKycModal()" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;">&times;</button>
			</div>
			<div style="padding:22px 24px;">
				<div style="display:flex; align-items:center; gap:14px; margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid #edf0ee;">
					<div style="width:52px; height:52px; border-radius:50%; background:#dcfce7; color:#15803d; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700;">
						${(user.name || "U")[0].toUpperCase()}
					</div>
					<div>
						<h4 style="margin:0; font-size:17px; color:#1f2937;">${escapeHTML(user.name)}</h4>
						<p style="margin:2px 0 0; font-size:12px; color:#6b7280;">Role: <strong>${user.role}</strong> &bull; Registered: ${formatDate(user.createdAt)}</p>
					</div>
				</div>

				<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px; font-size:13px;">
					<div style="background:#f8faf9; padding:10px 14px; border-radius:8px;">
						<span style="color:#6b7280; font-size:11px; display:block;">Contact Info</span>
						<strong>${escapeHTML(user.phone || user.email || "N/A")}</strong>
					</div>
					<div style="background:#f8faf9; padding:10px 14px; border-radius:8px;">
						<span style="color:#6b7280; font-size:11px; display:block;">Jurisdiction / Location</span>
						<strong>${escapeHTML(loc || "Bihar")}</strong>
					</div>
				</div>

				<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:14px 18px; margin-bottom:20px;">
					<span style="font-size:11px; font-weight:700; color:#065f46; text-transform:uppercase; letter-spacing:0.5px;">Submitted KYC Documentation</span>
					<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
						<div>
							<strong style="font-size:14px; color:#047857; display:block;">${escapeHTML(docRef)}</strong>
							<span style="font-size:12px; color:#065f46;">ID Reference: ${escapeHTML(maskedId)}</span>
						</div>
						<span class="status ${verified ? 'success' : 'pending'}" style="font-size:11px; font-weight:700;">
							${verified ? 'AUTHORIZED ✓' : 'PENDING REVIEW'}
						</span>
					</div>
				</div>

				<div style="display:flex; gap:10px; justify-content:flex-end;">
					<button type="button" onclick="closeUserKycModal()" style="background:#e5e7eb; color:#374151; border:none; padding:9px 18px; border-radius:7px; font-weight:600; cursor:pointer; font-size:13px;">
						Close
					</button>
					${!verified ? `
						<button type="button" onclick="authorizeUser('${user.id}', true, '${roleType}')" style="background:#10b981; color:white; border:none; padding:9px 20px; border-radius:7px; font-weight:700; cursor:pointer; font-size:13px; display:flex; align-items:center; gap:6px;">
							<i class="fa-solid fa-check"></i> Authorize & Verify
						</button>
					` : `
						<button type="button" onclick="authorizeUser('${user.id}', false, '${roleType}')" style="background:#ef4444; color:white; border:none; padding:9px 18px; border-radius:7px; font-weight:700; cursor:pointer; font-size:13px;">
							Revoke Authorization
						</button>
					`}
				</div>
			</div>
		</div>
	`;
	modal.style.display = "flex";
}

function closeUserKycModal() {
	const modal = document.getElementById("adminUserKycModal");
	if (modal) modal.style.display = "none";
}

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
window.authorizeUser = authorizeUser;
window.openUserKycModal = openUserKycModal;
window.closeUserKycModal = closeUserKycModal;
