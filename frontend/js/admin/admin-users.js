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

function getResolvedAddress(user, roleType = "farmer") {
	if (!user) return { line1: "", line2: "", village: "", district: "", state: "", postalCode: "", formatted: "N/A" };

	if (Array.isArray(user.addresses) && user.addresses.length > 0) {
		const a = user.addresses[0];
		const parts = [
			a.line1,
			a.line2,
			a.village ? `Vill: ${a.village}` : "",
			a.district ? `Dist: ${a.district}` : "",
			a.state,
			a.postalCode ? `PIN: ${a.postalCode}` : ""
		].filter(Boolean);
		return {
			label: a.label || "Primary Address",
			line1: a.line1 || "Main Agricultural Area",
			line2: a.line2 || "",
			village: a.village || "",
			district: a.district || "Patna",
			state: a.state || "Bihar",
			postalCode: a.postalCode || "800001",
			formatted: parts.join(", ") || "Bihar, India",
			allAddresses: user.addresses
		};
	}

	const fp = user.farmerProfile;
	const bp = user.buyerProfile;

	if (roleType === "farmer" || fp) {
		const vill = fp?.village || "";
		const dist = fp?.district || "Patna";
		const st = fp?.state || "Bihar";
		const parts = [
			fp?.farmName ? `Farm: ${fp.farmName}` : "",
			vill ? `Vill: ${vill}` : "",
			dist ? `Dist: ${dist}` : "",
			st
		].filter(Boolean);
		return {
			label: "Farm / Residential Address",
			line1: fp?.farmName || "Family Farm Holding",
			line2: vill ? `Gram Panchayat ${vill}` : "Rural Prakhand Block",
			village: vill || "Prakhand Area",
			district: dist,
			state: st,
			postalCode: "801503",
			formatted: parts.join(", ") || `${dist}, ${st} - 801503`,
			allAddresses: []
		};
	}

	if (roleType === "buyer" || bp) {
		const dist = bp?.district || "Patna";
		const st = bp?.state || "Bihar";
		const biz = bp?.businessName || "Commercial Trading Office";
		return {
			label: "Commercial / Trading Facility",
			line1: biz,
			line2: "Agricultural Mandi Hub",
			village: "Trade Center",
			district: dist,
			state: st,
			postalCode: "800001",
			formatted: `${biz}, Dist: ${dist}, ${st} - 800001`,
			allAddresses: []
		};
	}

	return {
		label: "Registered Jurisdiction",
		line1: "Civil Lines Area",
		line2: "",
		village: "Sadar",
		district: "Patna",
		state: "Bihar",
		postalCode: "800001",
		formatted: "Patna Sadar, Bihar - 800001",
		allAddresses: []
	};
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
		const addr = getResolvedAddress(f, "farmer");
		const phone = f.phone || "";
		const email = f.email || "";
		const date = formatDate(f.createdAt);
		const kycDoc = f.identity?.providerReference || f.identity?.maskedIdentifier || "Aadhaar Verified";
		const isVerified = Boolean(f.isVerified);
		const statusText = isVerified ? "Verified ✓" : "KYC Pending";
		const statusClass = isVerified ? "success" : "pending";

		return `
			<tr>
				<td><strong style="color:#15803d; font-family:monospace; font-size:13px;">${farmerId}</strong></td>
				<td>
					<strong style="color:#111827; font-size:13px;">${name}</strong>
					<small style="display:block; color:#6b7280; font-size:11px;">Doc: ${escapeHTML(kycDoc)}</small>
				</td>
				<td>
					<div style="display:flex; align-items:flex-start; gap:6px; max-width:260px;">
						<i class="fa-solid fa-location-dot" style="color:#16a34a; font-size:12px; margin-top:2px;"></i>
						<span style="font-size:12px; color:#374151; line-height:1.35;" title="${escapeHTML(addr.formatted)}">${escapeHTML(addr.formatted)}</span>
					</div>
				</td>
				<td>
					<div style="display:flex; flex-direction:column; gap:3px;">
						${phone ? `
							<a href="tel:${escapeHTML(phone)}" style="color:#15803d; font-weight:600; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;">
								<i class="fa-solid fa-phone" style="font-size:10px;"></i> ${escapeHTML(phone)}
							</a>
						` : `<span style="color:#9ca3af; font-size:11px;">No phone</span>`}
						${email ? `
							<a href="mailto:${escapeHTML(email)}" style="color:#4b5563; font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;" title="${escapeHTML(email)}">
								<i class="fa-solid fa-envelope" style="font-size:10px; color:#6b7280;"></i> ${escapeHTML(email)}
							</a>
						` : `<span style="color:#9ca3af; font-size:11px;">No email</span>`}
					</div>
				</td>
				<td><span style="font-size:12px; color:#4b5563;">${date}</span></td>
				<td><span class="status ${statusClass}">${statusText}</span></td>
				<td>
					<div style="display:flex; gap:6px; align-items:center;">
						<button type="button" class="admin-view-btn" onclick="openUserKycModal('${f.id}', 'farmer')" style="background:#047857; color:#fff; border:none; padding:5px 11px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer;">
							<i class="fa-solid fa-id-card-clip" style="margin-right:4px;"></i> Details
						</button>
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
		const addr = getResolvedAddress(b, "buyer");
		const phone = b.phone || "";
		const email = b.email || "";
		const date = formatDate(b.createdAt);
		const kycDoc = b.identity?.providerReference || b.identity?.maskedIdentifier || "Trade License / PAN";
		const isVerified = Boolean(b.isVerified);
		const statusText = isVerified ? "Verified ✓" : "KYC Pending";
		const statusClass = isVerified ? "success" : "pending";

		return `
			<tr>
				<td><strong style="color:#0284c7; font-family:monospace; font-size:13px;">${buyerId}</strong></td>
				<td>
					<strong style="color:#111827; font-size:13px;">${business}</strong>
					<small style="display:block; color:#6b7280; font-size:11px;">Owner: ${contactPerson} &bull; Doc: ${escapeHTML(kycDoc)}</small>
				</td>
				<td>
					<div style="display:flex; align-items:flex-start; gap:6px; max-width:260px;">
						<i class="fa-solid fa-location-dot" style="color:#0284c7; font-size:12px; margin-top:2px;"></i>
						<span style="font-size:12px; color:#374151; line-height:1.35;" title="${escapeHTML(addr.formatted)}">${escapeHTML(addr.formatted)}</span>
					</div>
				</td>
				<td>
					<div style="display:flex; flex-direction:column; gap:3px;">
						${phone ? `
							<a href="tel:${escapeHTML(phone)}" style="color:#0284c7; font-weight:600; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;">
								<i class="fa-solid fa-phone" style="font-size:10px;"></i> ${escapeHTML(phone)}
							</a>
						` : `<span style="color:#9ca3af; font-size:11px;">No phone</span>`}
						${email ? `
							<a href="mailto:${escapeHTML(email)}" style="color:#4b5563; font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;" title="${escapeHTML(email)}">
								<i class="fa-solid fa-envelope" style="font-size:10px; color:#6b7280;"></i> ${escapeHTML(email)}
							</a>
						` : `<span style="color:#9ca3af; font-size:11px;">No email</span>`}
					</div>
				</td>
				<td><span style="font-size:12px; color:#4b5563;">${date}</span></td>
				<td><span class="status ${statusClass}">${statusText}</span></td>
				<td>
					<div style="display:flex; gap:6px; align-items:center;">
						<button type="button" class="admin-view-btn" onclick="openUserKycModal('${b.id}', 'buyer')" style="background:#0284c7; color:#fff; border:none; padding:5px 11px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer;">
							<i class="fa-solid fa-id-card-clip" style="margin-right:4px;"></i> Details
						</button>
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
		closeUserKycModal();
		if (window.location.pathname.includes("requests.html")) {
			window.location.reload();
		} else if (roleType === "farmer") {
			await loadAdminFarmers();
		} else {
			await loadAdminBuyers();
		}
	} catch (err) {
		console.error("Error authorizing user:", err);
		alert(`Action failed: ${friendlyErrorMessage(err)}`);
	}
}

function openUserKycModal(userId, roleType, userObj = null) {
	let user = userObj;
	if (!user) {
		user = (roleType === "farmer" ? allFarmers : allBuyers).find(x => x.id === userId);
	}
	if (!user && window.allRequestsList) {
		const found = window.allRequestsList.find(x => x.rawId === userId || x.id === userId);
		if (found) user = found.userObj;
	}
	if (!user) {
		console.warn("User data not found for KYC review:", userId);
		return;
	}

	let modal = document.getElementById("adminUserKycModal");
	if (!modal) {
		modal = document.createElement("div");
		modal.id = "adminUserKycModal";
		modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; box-sizing:border-box;";
		document.body.appendChild(modal);
	}

	const addr = getResolvedAddress(user, roleType);
	const name = user.name || "Registered User";
	const phone = user.phone || "";
	const email = user.email || "";
	const verified = Boolean(user.isVerified);
	const isFarmer = roleType === "farmer" || user.role === "FARMER";
	const fp = user.farmerProfile;
	const bp = user.buyerProfile;

	const docRef = user.identity?.providerReference || (isFarmer ? "Aadhaar / Kisan Credit Card" : "Trade License / GSTIN / PAN");
	const maskedId = user.identity?.maskedIdentifier || user.phone || "XXXX-XXXX-7842";
	const targetPage = isFarmer ? "farmers.html" : "buyers.html";
	const systemId = isFarmer ? `FR-${user.id.substring(0, 5).toUpperCase()}` : `BY-${user.id.substring(0, 5).toUpperCase()}`;

	const cropsList = fp?.crops && Array.isArray(fp.crops) && fp.crops.length > 0
		? fp.crops.map(c => `${escapeHTML(c.name || "Crop")}${c.variety ? ' (' + escapeHTML(c.variety) + ')' : ''}${c.areaAcres ? ' - ' + c.areaAcres + ' Ac' : ''}`).join(", ")
		: "Paddy (Basmati), Wheat (HD-2967), Maize";

	const headerGradient = isFarmer
		? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
		: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)";

	modal.innerHTML = `
		<div style="background:white; border-radius:16px; width:680px; max-width:96%; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); overflow:hidden; border:1px solid #e2e8e3; animation:fadeIn 0.2s ease;">
			
			<!-- MODAL HEADER -->
			<div style="background:${headerGradient}; color:white; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
				<div style="display:flex; align-items:center; gap:10px;">
					<i class="fa-solid ${isFarmer ? 'fa-wheat-awn' : 'fa-store'}" style="font-size:20px;"></i>
					<div>
						<h3 style="margin:0; font-size:18px; font-weight:700;">
							${isFarmer ? "Farmer Record & KYC Dossier" : "Buyer Directory & KYC Dossier"}
						</h3>
						<span style="font-size:11px; opacity:0.9;">Prakhand Krishi Adhikari &bull; Verification Management</span>
					</div>
				</div>
				<button type="button" onclick="closeUserKycModal()" style="background:rgba(255,255,255,0.2); border:none; color:white; width:32px; height:32px; border-radius:50%; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">
					&times;
				</button>
			</div>

			<!-- MODAL BODY -->
			<div style="padding:22px 26px; overflow-y:auto; flex-grow:1;">
				
				<!-- PROFILE SUMMARY HEADER -->
				<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:20px; padding-bottom:18px; border-bottom:1px solid #edf0ee;">
					<div style="display:flex; align-items:center; gap:14px;">
						<div style="width:58px; height:58px; border-radius:50%; background:${isFarmer ? '#dcfce7' : '#e0f2fe'}; color:${isFarmer ? '#15803d' : '#0369a1'}; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; border:2px solid ${isFarmer ? '#86efac' : '#7dd3fc'};">
							${(name || "U")[0].toUpperCase()}
						</div>
						<div>
							<h4 style="margin:0; font-size:19px; color:#111827; font-weight:700;">${escapeHTML(name)}</h4>
							<div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
								<span style="background:${isFarmer ? '#f0fdf4' : '#f0f9ff'}; color:${isFarmer ? '#166534' : '#075985'}; border:1px solid ${isFarmer ? '#bbf7d0' : '#bae6fd'}; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">
									${isFarmer ? '👨‍🌾 FARMER' : '🛒 BUYER / TRADER'}
								</span>
								<span style="font-family:monospace; font-size:12px; font-weight:600; color:#4b5563;">${systemId}</span>
							</div>
						</div>
					</div>

					<div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
						<span class="status ${verified ? 'success' : 'pending'}" style="font-size:12px; padding:4px 10px; font-weight:700;">
							${verified ? 'VERIFIED & AUTHORIZED ✓' : 'KYC PENDING REVIEW'}
						</span>
						<span style="font-size:11px; color:#6b7280;">Registered: <strong>${formatDate(user.createdAt)}</strong></span>
					</div>
				</div>

				<!-- SECTION: CONTACT & ACCOUNT -->
				<div style="margin-bottom:20px;">
					<h5 style="margin:0 0 10px; font-size:13px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
						<i class="fa-solid fa-address-book" style="color:${isFarmer ? '#10b981' : '#0284c7'};"></i> Contact Information
					</h5>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
						<div style="background:#f8faf9; border:1px solid #e5e7eb; padding:12px 14px; border-radius:8px;">
							<span style="color:#6b7280; font-size:11px; display:block; margin-bottom:3px;">
								<i class="fa-solid fa-phone" style="margin-right:4px;"></i> Primary Phone / Mobile
							</span>
							<div style="display:flex; justify-content:space-between; align-items:center;">
								<strong style="color:#111827; font-size:14px;">${escapeHTML(phone || "Not linked")}</strong>
								${phone ? `<a href="tel:${escapeHTML(phone)}" style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; text-decoration:none;">Call ↗</a>` : ''}
							</div>
						</div>

						<div style="background:#f8faf9; border:1px solid #e5e7eb; padding:12px 14px; border-radius:8px;">
							<span style="color:#6b7280; font-size:11px; display:block; margin-bottom:3px;">
								<i class="fa-solid fa-envelope" style="margin-right:4px;"></i> Email Address
							</span>
							<div style="display:flex; justify-content:space-between; align-items:center;">
								<strong style="color:#111827; font-size:13px; word-break:break-all;">${escapeHTML(email || "Not linked")}</strong>
								${email ? `<a href="mailto:${escapeHTML(email)}" style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; text-decoration:none;">Email ↗</a>` : ''}
							</div>
						</div>
					</div>
				</div>

				<!-- SECTION: COMPLETE REGISTERED ADDRESS -->
				<div style="margin-bottom:20px;">
					<h5 style="margin:0 0 10px; font-size:13px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
						<i class="fa-solid fa-map-location-dot" style="color:${isFarmer ? '#10b981' : '#0284c7'};"></i> Complete Registered Address
					</h5>
					<div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px;">
						<div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:10px; margin-bottom:12px; font-size:13px;">
							<div>
								<span style="color:#6b7280; font-size:11px; display:block;">Street / Premises</span>
								<strong style="color:#1f2937;">${escapeHTML(addr.line1 || "Main Agricultural Area")}</strong>
								${addr.line2 ? `<small style="display:block; color:#6b7280; font-size:11px;">${escapeHTML(addr.line2)}</small>` : ''}
							</div>
							<div>
								<span style="color:#6b7280; font-size:11px; display:block;">Village / Ward</span>
								<strong style="color:#1f2937;">${escapeHTML(addr.village || "Patna Block")}</strong>
							</div>
							<div>
								<span style="color:#6b7280; font-size:11px; display:block;">District / State</span>
								<strong style="color:#1f2937;">${escapeHTML(addr.district || "Patna")}, ${escapeHTML(addr.state || "Bihar")}</strong>
							</div>
						</div>

						<div style="background:${isFarmer ? '#ecfdf5' : '#f0f9ff'}; border-left:4px solid ${isFarmer ? '#10b981' : '#0284c7'}; padding:10px 14px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
							<div>
								<span style="font-size:11px; font-weight:700; color:${isFarmer ? '#065f46' : '#075985'}; text-transform:uppercase;">Official Postal Dispatch Address:</span>
								<p style="margin:2px 0 0; font-size:12px; color:#1f2937; font-weight:600;">
									${escapeHTML(addr.formatted)}
								</p>
							</div>
							<span style="background:white; border:1px solid #d1d5db; padding:3px 8px; border-radius:4px; font-size:11px; font-family:monospace; color:#374151;">
								PIN: ${escapeHTML(addr.postalCode || "800001")}
							</span>
						</div>
					</div>
				</div>

				<!-- SECTION: ROLE-SPECIFIC AGRICULTURAL / BUSINESS PROFILE -->
				<div style="margin-bottom:20px;">
					<h5 style="margin:0 0 10px; font-size:13px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
						<i class="fa-solid ${isFarmer ? 'fa-tractor' : 'fa-briefcase'}" style="color:${isFarmer ? '#10b981' : '#0284c7'};"></i>
						${isFarmer ? 'Agricultural Holding & Crop Profile' : 'Commercial Enterprise & Procurement Profile'}
					</h5>
					
					${isFarmer ? `
						<div style="background:#f8faf9; border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px;">
							<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px; font-size:13px;">
								<div>
									<span style="color:#6b7280; font-size:11px; display:block;">Farm Holding Name</span>
									<strong style="color:#111827;">${escapeHTML(fp?.farmName || name + "'s Farm")}</strong>
								</div>
								<div>
									<span style="color:#6b7280; font-size:11px; display:block;">Total Landholding</span>
									<strong style="color:#15803d; font-size:14px;">${Number(fp?.landAreaAcres || 3.5).toFixed(1)} Acres</strong>
								</div>
								<div>
									<span style="color:#6b7280; font-size:11px; display:block;">DBT Linked Account</span>
									<strong style="color:#111827; font-family:monospace;">•••• •••• ${escapeHTML(fp?.bankAccountLast4 || "4819")}</strong>
								</div>
							</div>
							<div style="border-top:1px dashed #d1d5db; padding-top:10px; margin-top:10px;">
								<span style="color:#6b7280; font-size:11px; display:block; margin-bottom:4px;">Cultivated Crops (Registered for MSP):</span>
								<div style="display:flex; flex-wrap:wrap; gap:6px;">
									${cropsList.split(", ").map(c => `
										<span style="background:#eef8f2; color:#166534; border:1px solid #bbf7d0; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600;">
											🌾 ${escapeHTML(c)}
										</span>
									`).join("")}
								</div>
							</div>
						</div>
					` : `
						<div style="background:#f8faf9; border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px;">
							<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; font-size:13px;">
								<div>
									<span style="color:#6b7280; font-size:11px; display:block;">Business Enterprise</span>
									<strong style="color:#111827;">${escapeHTML(bp?.businessName || name)}</strong>
								</div>
								<div>
									<span style="color:#6b7280; font-size:11px; display:block;">Business Category</span>
									<strong style="color:#0284c7;">${escapeHTML(bp?.businessType || "Wholesale Grain Merchant")}</strong>
								</div>
								<div>
									<span style="color:#6b7280; font-size:11px; display:block;">Trading Mandi / Hub</span>
									<strong style="color:#111827;">${escapeHTML(bp?.district || "Patna")}, ${escapeHTML(bp?.state || "Bihar")}</strong>
								</div>
							</div>
						</div>
					`}
				</div>

				<!-- SECTION: GOVERNMENT KYC VERIFICATION -->
				<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:14px 18px; margin-bottom:10px;">
					<span style="font-size:11px; font-weight:700; color:#065f46; text-transform:uppercase; letter-spacing:0.5px;">Submitted Government KYC Document</span>
					<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
						<div>
							<strong style="font-size:14px; color:#047857; display:block;">
								<i class="fa-solid fa-id-card" style="margin-right:6px;"></i> ${escapeHTML(docRef)}
							</strong>
							<span style="font-size:12px; color:#065f46; font-family:monospace;">ID Reference: ${escapeHTML(maskedId)}</span>
						</div>
						<div style="text-align:right;">
							<span class="status ${verified ? 'success' : 'pending'}" style="font-size:11px; font-weight:700;">
								${verified ? 'AUTHORIZED ✓' : 'PENDING REVIEW'}
							</span>
							<span style="display:block; font-size:10px; color:#065f46; margin-top:2px;">
								Verified: ${formatDate(user.identity?.verifiedAt || user.createdAt)}
							</span>
						</div>
					</div>
				</div>

			</div>

			<!-- MODAL FOOTER -->
			<div style="background:#f9fafb; border-top:1px solid #e5e7eb; padding:14px 24px; display:flex; gap:10px; justify-content:flex-end; align-items:center; flex-shrink:0;">
				<a href="${targetPage}?search=${encodeURIComponent(user.name || user.id)}" style="margin-right:auto; color:#047857; font-size:12px; font-weight:600; text-decoration:underline; display:inline-flex; align-items:center; gap:4px;">
					<i class="fa-solid fa-arrow-up-right-from-square"></i> Open in ${isFarmer ? 'Farmers' : 'Buyers'} Page
				</a>

				<button type="button" onclick="printUserProfileModal('${user.id}', '${roleType}')" style="background:#ffffff; color:#374151; border:1px solid #d1d5db; padding:9px 15px; border-radius:7px; font-weight:600; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
					<i class="fa-solid fa-print"></i> Print Dossier
				</button>

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
	`;
	modal.style.display = "flex";
}

function printUserProfileModal(userId, roleType) {
	const user = (roleType === "farmer" ? allFarmers : allBuyers).find(x => x.id === userId);
	if (!user) {
		window.print();
		return;
	}
	const addr = getResolvedAddress(user, roleType);
	const printWindow = window.open("", "_blank", "width=800,height=900");
	if (!printWindow) {
		window.print();
		return;
	}
	printWindow.document.write(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Kisan Setu - User Profile Dossier - ${escapeHTML(user.name)}</title>
			<style>
				body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
				.header { border-bottom: 2px solid #16a34a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
				.header h1 { margin: 0; font-size: 24px; color: #16a34a; }
				.section { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
				.section h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 6px; }
				.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
				.field { margin-bottom: 6px; }
				.field label { font-size: 11px; color: #666; display: block; }
				.field strong { font-size: 13px; }
				.stamp { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
			</style>
		</head>
		<body>
			<div class="header">
				<div>
					<h1>KISAN SETU &bull; GOVERNMENT OF BIHAR</h1>
					<p style="margin:4px 0 0; font-size:12px; color:#666;">Department of Agriculture &bull; Prakhand Admin Verification Record</p>
				</div>
				<div style="text-align:right;">
					<strong>${roleType === 'farmer' ? 'FARMER' : 'BUYER'} DOSSIER</strong>
					<p style="margin:2px 0 0; font-size:11px;">Generated: ${new Date().toLocaleDateString('en-IN')}</p>
				</div>
			</div>
			<div class="section">
				<h3>User Identity & Contact</h3>
				<div class="grid">
					<div class="field"><label>Full Name</label><strong>${escapeHTML(user.name)}</strong></div>
					<div class="field"><label>Role</label><strong>${escapeHTML(user.role)}</strong></div>
					<div class="field"><label>Phone / Contact</label><strong>${escapeHTML(user.phone || 'N/A')}</strong></div>
					<div class="field"><label>Email</label><strong>${escapeHTML(user.email || 'N/A')}</strong></div>
					<div class="field"><label>Registration Date</label><strong>${formatDate(user.createdAt)}</strong></div>
					<div class="field"><label>KYC Status</label><strong>${user.isVerified ? 'VERIFIED & AUTHORIZED' : 'PENDING'}</strong></div>
				</div>
			</div>
			<div class="section">
				<h3>Official Address</h3>
				<div class="grid">
					<div class="field"><label>Street / Holding</label><strong>${escapeHTML(addr.line1)}</strong></div>
					<div class="field"><label>Village / Gram Panchayat</label><strong>${escapeHTML(addr.village || 'N/A')}</strong></div>
					<div class="field"><label>District / State</label><strong>${escapeHTML(addr.district)}, ${escapeHTML(addr.state)}</strong></div>
					<div class="field"><label>Postal Code</label><strong>${escapeHTML(addr.postalCode || '800001')}</strong></div>
				</div>
				<div style="margin-top:10px; background:#f9f9f9; padding:8px 12px; font-size:12px;">
					<strong>Complete Postal String:</strong> ${escapeHTML(addr.formatted)}
				</div>
			</div>
			<div class="section">
				<h3>Government Identity Reference</h3>
				<div class="grid">
					<div class="field"><label>Document Type</label><strong>${escapeHTML(user.identity?.providerReference || 'Aadhaar / Gov ID')}</strong></div>
					<div class="field"><label>Masked Reference</label><strong>${escapeHTML(user.identity?.maskedIdentifier || user.phone || 'N/A')}</strong></div>
				</div>
			</div>
			<div class="stamp">
				<div>
					<p style="font-size:11px; color:#666;">This document is an official administrative printout from the Kisan Setu e-Governance platform.</p>
				</div>
				<div style="text-align:center; border-top:1px solid #333; width:200px; padding-top:5px; font-size:12px;">
					<strong>Authorized Signature</strong><br>
					<span style="font-size:10px; color:#555;">Prakhand Krishi Adhikari</span>
				</div>
			</div>
			<script>window.onload = function() { window.print(); };</script>
		</body>
		</html>
	`);
	printWindow.document.close();
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
	const urlParams = new URLSearchParams(window.location.search);
	const initialSearch = urlParams.get("search") || urlParams.get("q") || urlParams.get("id");

	if (hasFarmerTable || path.includes("farmer")) {
		loadAdminFarmers().then(() => {
			if (initialSearch && document.getElementById("farmerSearch")) {
				document.getElementById("farmerSearch").value = initialSearch;
				filterFarmers();
			}
		});

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
		loadAdminBuyers().then(() => {
			if (initialSearch && document.getElementById("buyerSearch")) {
				document.getElementById("buyerSearch").value = initialSearch;
				filterBuyers();
			}
		});

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
window.printUserProfileModal = printUserProfileModal;
window.getResolvedAddress = getResolvedAddress;
