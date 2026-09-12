let currentFarmerProducePage = 1;
const farmerProducePageLimit = 10;
let currentSearch = "";
let currentLocation = "";

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function cropIconClass(crop) {
	const value = String(crop || "").toLowerCase();
	if (value.includes("potato")) return "fa-carrot";
	if (value.includes("wheat") || value.includes("rice") || value.includes("paddy")) return "fa-wheat-awn";
	if (value.includes("tomato") || value.includes("onion")) return "fa-apple-whole";
	return "fa-seedling";
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerProduce();
	setupFarmerProduceSearch();
	setupAddProduce();
	setupFarmerLogout();
});

async function loadFarmerProduce(page = 1) {
	currentFarmerProducePage = page;
	const container = document.getElementById("produceContainer");
	const countElement = document.getElementById("produceCount");
	const pageElement = document.getElementById("pageNumber");

	if (!container) return;
	container.innerHTML = `<p>Loading produce listings...</p>`;

	try {
		const params = {
			page: currentFarmerProducePage,
			limit: farmerProducePageLimit,
			search: currentSearch,
			location: currentLocation
		};

		const response = await getFarmerProduce(params);
		const data = response || {};
		const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.produce) ? data.produce : [])));

		if (!list.length) {
			container.innerHTML = `
				<div class="no-produce">
					<h3>No produce found</h3>
					<p>You have not listed any produce yet.</p>
				</div>
			`;
			if (countElement) countElement.textContent = "0 items";
			if (pageElement) pageElement.textContent = `Page ${currentFarmerProducePage}`;
			return;
		}

		if (countElement) countElement.textContent = `${list.length} item${list.length > 1 ? "s" : ""}`;
		window.currentFarmerProduceList = list;
		container.innerHTML = "";

		list.forEach((produce) => {
			const item = document.createElement("div");
			item.className = "produce-card modern-card";
			const rawTitle = produce.title || produce.name || "Unnamed Produce";
			const isBlockProcurement = rawTitle.includes("[Block Procurement") || (produce.description || "").includes("Block Procurement");
			const displayName = rawTitle.replace(/\[Block Procurement[^\]]*\]/g, "").trim();

			const quantity = Number(produce.availableQuantity ?? produce.quantity ?? 0);
			const rawUnit = String(produce.unit || "Quintal").trim();
			const unitName = rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1).toLowerCase();
			const price = Number(produce.pricePerUnit ?? produce.price ?? 0);
			const formattedPrice = price.toLocaleString("en-IN");
			const location = produce.location || (produce.district ? `${produce.district}, ${produce.state || "Bihar"}` : "Sitamarhi Central Mandi, Bihar");

			// Category & quality subtitle (matching "Grade A Premium • Moisture 11.2%")
			let subtitle = produce.category || "Grade A Premium";
			if (produce.description && produce.description.includes("Moisture")) {
				const match = produce.description.match(/Moisture\s*[\d\.]+%?/i);
				if (match) subtitle += ` • ${match[0]}`;
				else subtitle += ` • Moisture 11.2%`;
			} else {
				subtitle += ` • Moisture 11.2%`;
			}

			// Clean description tag
			const cleanDesc = (produce.description || "").replace(/\[Target:[^\]]*\]/g, "").trim();

			// Farmer display name
			const farmerName = (window.currentFarmerUser?.name) || produce.farmer?.name || "Mohan Kumar (Dumra)";

			item.innerHTML = `
				<div class="pcm-top-row">
					<div class="pcm-title-group">
						<div class="pcm-icon-box">
							<i class="fa-solid ${cropIconClass(displayName)}" aria-hidden="true"></i>
						</div>
						<div class="pcm-title-meta">
							<h3 class="pcm-title">${escapeHTML(displayName)}</h3>
							<div class="pcm-subtitle">${escapeHTML(subtitle)}</div>
						</div>
					</div>
					${isBlockProcurement ? `
						<div class="pcm-badge pcm-badge-tested">
							<i class="fa-solid fa-check-double" style="margin-right:4px;"></i> Lab Tested
						</div>
					` : `
						<div class="pcm-badge pcm-badge-market">
							Open Market
						</div>
					`}
				</div>

				<div class="pcm-rate-box">
					<div class="pcm-rate-col">
						<span class="pcm-rate-label">Mandi Rate</span>
						<span class="pcm-rate-val">₹${formattedPrice}</span>
					</div>
					<div class="pcm-qty-col">
						<span class="pcm-qty-label">Lot Quantity</span>
						<span class="pcm-qty-val">${quantity} ${escapeHTML(unitName)}</span>
					</div>
				</div>

				<div class="pcm-details-list">
					<div class="pcm-detail-item">
						<i class="fa-solid fa-user"></i>
						<span>Farmer: <strong>${escapeHTML(farmerName)}</strong></span>
					</div>
					<div class="pcm-detail-item">
						<i class="fa-solid fa-location-dot"></i>
						<span>${escapeHTML(location)}</span>
					</div>
					<div class="pcm-detail-item">
						<i class="fa-solid fa-truck"></i>
						<span>Ready for Dispatch (Same Day)</span>
					</div>
				</div>

				<div class="pcm-actions">
					${isBlockProcurement ? `
						<button type="button" class="pcm-btn-bid" onclick="openPacsSlipModal('${produce.id}')" title="View official PACS government procurement slip">
							<i class="fa-solid fa-file-invoice"></i> View Mandi Slip
						</button>
					` : `
						<button type="button" class="pcm-btn-bid" onclick="openFarmerProduceDetails('${produce.id}')">
							<i class="fa-solid fa-eye"></i> View Details
						</button>
					`}
					<button type="button" class="pcm-btn-remove remove-produce-btn" data-id="${escapeHTML(String(produce.id || produce._id || ""))}" title="Remove Listing">
						<i class="fa-solid fa-trash"></i>
					</button>
				</div>
			`;

			const removeButton = item.querySelector(".remove-produce-btn");
			if (!removeButton.dataset.id) removeButton.disabled = true;
			removeButton.addEventListener("click", () => removeProduce(removeButton.dataset.id));
			container.appendChild(item);
		});

		if (pageElement) pageElement.textContent = `Page ${currentFarmerProducePage}`;
	} catch (error) {
		console.error("Farmer produce loading error:", error);
		container.innerHTML = `<p>Unable to load produce right now. Please try again later.</p>`;
		if (countElement) countElement.textContent = "Unable to load";
	}
}

function updatePayoutEstimate() {
	const isBlock = Boolean(document.getElementById("saleTargetBlock")?.checked);
	const payoutBox = document.getElementById("blockPayoutEstimate");
	const payoutVal = document.getElementById("blockPayoutValue");
	if (!payoutBox || !payoutVal) return;

	if (!isBlock) {
		payoutBox.style.display = "none";
		return;
	}

	const qty = Number(document.getElementById("produceQuantity")?.value) || 0;
	const rate = Number(document.getElementById("producePrice")?.value) || 0;
	const total = qty * rate;

	if (total > 0) {
		payoutVal.textContent = `₹${total.toLocaleString('en-IN')}`;
		payoutBox.style.display = "block";
	} else {
		payoutBox.style.display = "none";
	}
}

function setupAddProduce() {
	const form = document.getElementById("addProduceForm");
	const toggleButton = document.getElementById("toggleAddProduceBtn");
	const cancelButton = document.getElementById("cancelAddProduceBtn");
	const message = document.getElementById("addProduceMessage");
	if (!form) return;

	const setOpen = (open) => {
		form.hidden = !open;
		toggleButton.hidden = open;
		if (open) document.getElementById("produceName")?.focus();
	};
	toggleButton?.addEventListener("click", () => setOpen(true));
	cancelButton?.addEventListener("click", () => { form.reset(); setOpen(false); });

	const blockRadio = document.getElementById("saleTargetBlock");
	const marketRadio = document.getElementById("saleTargetMarket");
	const blockInfo = document.getElementById("blockProcurementInfo");

	blockRadio?.addEventListener("change", () => {
		if (blockInfo) blockInfo.style.display = blockRadio.checked ? "block" : "none";
		updatePayoutEstimate();
	});
	marketRadio?.addEventListener("change", () => {
		if (blockInfo) blockInfo.style.display = "none";
		updatePayoutEstimate();
	});

	// Quick select MSP rates
	document.querySelectorAll(".msp-quick-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const crop = btn.dataset.crop;
			const cat = btn.dataset.cat;
			const unit = btn.dataset.unit;
			const rate = btn.dataset.rate;

			const nameInput = document.getElementById("produceName");
			const catInput = document.getElementById("produceCategory");
			const unitInput = document.getElementById("produceUnit");
			const priceInput = document.getElementById("producePrice");
			const descInput = document.getElementById("produceDescription");
			const locInput = document.getElementById("produceLocation");

			if (nameInput) nameInput.value = crop;
			if (catInput) catInput.value = cat || "Grade A Premium";
			if (unitInput) unitInput.value = unit || "quintal";
			if (priceInput) priceInput.value = rate;
			if (descInput) descInput.value = `${cat || "Grade A Premium"} • Moisture 11.2% • Lab Tested (Govt MSP Direct Procurement)`;
			if (locInput && !locInput.value) locInput.value = "Sitamarhi Central Mandi, Bihar";

			updatePayoutEstimate();
		});
	});

	document.getElementById("produceQuantity")?.addEventListener("input", updatePayoutEstimate);
	document.getElementById("producePrice")?.addEventListener("input", updatePayoutEstimate);

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const submitBtn = form.querySelector("button[type='submit']");
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
		}
		message.style.display = "block";
		message.style.padding = "10px 14px";
		message.style.borderRadius = "8px";
		message.style.marginBottom = "14px";
		message.style.background = "#eff6ff";
		message.style.border = "1px solid #bfdbfe";
		message.style.color = "#1d4ed8";
		message.textContent = "Processing listing submission...";

		const isBlock = Boolean(document.getElementById("saleTargetBlock")?.checked);
		const baseTitle = document.getElementById("produceName").value.trim();
		const finalTitle = isBlock ? `[Block Procurement / PACS] ${baseTitle}` : baseTitle;
		const baseDesc = document.getElementById("produceDescription").value.trim();
		const finalDesc = isBlock ? `[Target: Block Procurement Center - MSP Sale] ${baseDesc}` : baseDesc;

		const payload = {
			title: finalTitle,
			name: finalTitle,
			category: document.getElementById("produceCategory").value.trim() || "Standard",
			quantity: Number(document.getElementById("produceQuantity").value),
			unit: (document.getElementById("produceUnit").value || "QUINTAL").toUpperCase(),
			price: Number(document.getElementById("producePrice").value),
			location: document.getElementById("produceLocation").value.trim() || "Sitamarhi Central Mandi, Bihar",
			description: finalDesc
		};

		try {
			const res = await createFarmerProduce(payload);
			message.style.background = "#f0fdf4";
			message.style.border = "1px solid #bbf7d0";
			message.style.color = "#166534";
			message.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${isBlock ? "Produce listed for Block Procurement with official MSP Guarantee!" : "Produce added successfully!"}`;
			form.reset();
			if (blockInfo) blockInfo.style.display = "none";
			const est = document.getElementById("blockPayoutEstimate");
			if (est) est.style.display = "none";
			setOpen(false);
			await loadFarmerProduce(1);

			if (isBlock && res?.id) {
				setTimeout(() => {
					openPacsSlipModal(res.id);
				}, 600);
			}

			setTimeout(() => {
				message.style.display = "none";
			}, 6000);
		} catch (error) {
			message.style.background = "#fef2f2";
			message.style.border = "1px solid #fecaca";
			message.style.color = "#b91c1c";
			message.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${escapeHTML(friendlyErrorMessage(error, "Unable to add produce. Please check your inputs or login status."))}`;
		} finally {
			if (submitBtn) {
				submitBtn.disabled = false;
				submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span data-i18n="save_produce">Save Produce</span>';
			}
		}
	});
}

function openPacsSlipModal(produceId) {
	const modal = document.getElementById("pacsSlipModal");
	const container = document.getElementById("pacsSlipContent");
	if (!modal || !container) return;

	const produce = (window.currentFarmerProduceList || []).find(p => p.id === produceId) || {};
	const rawTitle = produce.title || produce.name || "Agricultural Commodity";
	const cleanTitle = rawTitle.replace(/\[Block Procurement[^\]]*\]/g, "").trim();
	const qty = Number(produce.availableQuantity ?? produce.quantity ?? 150);
	const unit = produce.unit || "Quintal";
	const rate = Number(produce.pricePerUnit ?? produce.price ?? 2450);
	const total = qty * rate;
	const slipNum = `PACS-BR-${(produce.id || 'DEMO').slice(0, 8).toUpperCase()}`;
	const farmerName = (window.currentFarmerUser?.name) || produce.farmer?.name || "Registered Farmer";
	const location = produce.location || "Sitamarhi Central Mandi, Bihar";

	container.innerHTML = `
		<div style="border-bottom:2px dashed #059669; padding-bottom:14px; margin-bottom:16px;">
			<div style="display:flex; justify-content:space-between; align-items:flex-start;">
				<div>
					<span style="font-size:11px; font-weight:800; color:#065f46; letter-spacing:0.5px; text-transform:uppercase;">Government of Bihar &bull; Agriculture Dept</span>
					<h4 style="margin:2px 0 0; font-size:16px; color:#111827; font-weight:700;">Block Procurement Center (PACS Mandi Slip)</h4>
					<p style="margin:2px 0 0; font-size:12px; color:#6b7280;">Procurement Scheme: MSP Guaranteed Direct Farmer Purchase</p>
				</div>
				<span style="background:#ecfdf5; color:#047857; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; border:1px solid #a7f3d0;">
					${escapeHTML(slipNum)}
				</span>
			</div>
		</div>

		<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
			<div style="background:#f8faf9; padding:10px 14px; border-radius:8px;">
				<span style="color:#6b7280; font-size:11px; display:block;">Beneficiary Farmer</span>
				<strong style="color:#111827;">${escapeHTML(farmerName)}</strong>
			</div>
			<div style="background:#f8faf9; padding:10px 14px; border-radius:8px;">
				<span style="color:#6b7280; font-size:11px; display:block;">Mandi / Drop Center</span>
				<strong style="color:#111827;">${escapeHTML(location)}</strong>
			</div>
		</div>

		<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px 18px; margin-bottom:18px;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
				<span style="font-size:13px; color:#374151;">Crop / Commodity:</span>
				<strong style="font-size:14px; color:#111827;">${escapeHTML(cleanTitle)}</strong>
			</div>
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
				<span style="font-size:13px; color:#374151;">Offered Lot Quantity:</span>
				<strong style="font-size:14px; color:#111827;">${qty} ${escapeHTML(unit)}</strong>
			</div>
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
				<span style="font-size:13px; color:#374151;">Guaranteed Mandi MSP Rate:</span>
				<strong style="font-size:14px; color:#166534;">₹${rate.toLocaleString('en-IN')} / ${escapeHTML(unit)}</strong>
			</div>
			<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #86efac; padding-top:8px; margin-top:8px;">
				<span style="font-size:14px; font-weight:700; color:#166534;">Total Government DBT Payout:</span>
				<strong style="font-size:18px; color:#15803d;">₹${total.toLocaleString('en-IN')}</strong>
			</div>
		</div>

		<p style="font-size:11.5px; color:#6b7280; margin-bottom:18px; line-height:1.5;">
			<i class="fa-solid fa-circle-info" style="color:#10b981;"></i> Present this slip at your nearest Prakhand Agriculture Office / PACS Warehouse during weighment. Funds will be directly credited to your Aadhaar-linked bank account.
		</p>

		<div style="display:flex; justify-content:flex-end; gap:10px;">
			<button type="button" onclick="window.print()" style="padding:10px 18px; background:#f3f4f6; border:1px solid #d1d5db; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
				<i class="fa-solid fa-print"></i> Print Slip
			</button>
			<button type="button" onclick="document.getElementById('pacsSlipModal').style.display='none'" style="padding:10px 22px; background:#064e3b; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px;">
				Close
			</button>
		</div>
	`;

	modal.style.display = "flex";
}

function openFarmerProduceDetails(produceId) {
	const produce = (window.currentFarmerProduceList || []).find(p => p.id === produceId);
	if (!produce) return;
	const modal = document.getElementById("produceModal");
	const details = document.getElementById("produceDetails");
	if (!modal || !details) return;

	const rawTitle = produce.title || produce.name || "Agricultural Produce";
	const cleanTitle = rawTitle.replace(/\[Block Procurement[^\]]*\]/g, "").trim();

	details.innerHTML = `
		<p><strong>Title:</strong> ${escapeHTML(cleanTitle)}</p>
		<p><strong>Category:</strong> ${escapeHTML(produce.category || "Standard")}</p>
		<p><strong>Quantity:</strong> ${escapeHTML(String(produce.availableQuantity ?? produce.quantity ?? 0))} ${escapeHTML(produce.unit || "kg")}</p>
		<p><strong>Price:</strong> ₹${escapeHTML(String(produce.pricePerUnit ?? produce.price ?? 0))}/${escapeHTML(produce.unit || "kg")}</p>
		<p><strong>Location:</strong> ${escapeHTML(produce.location || "Direct Farm")}</p>
		<p><strong>Status:</strong> ${escapeHTML(produce.status || "LISTED")}</p>
		<p><strong>Quality / Harvest Details:</strong> ${escapeHTML(produce.description || "Fresh harvest.")}</p>
	`;
	modal.style.display = "flex";
}

async function removeProduce(produceId) {
	if (!produceId || !window.confirm("Remove this produce listing?")) return;
	try {

		await deleteFarmerProduce(produceId);
		loadFarmerProduce(currentFarmerProducePage);
	} catch (error) {
		window.alert(error.message || "Unable to remove produce.");
	}
}

function setupFarmerProduceSearch() {
	const form = document.getElementById("produceSearchForm");
	if (!form) return;

	form.addEventListener("submit", function (event) {
		event.preventDefault();
		const searchInput = document.getElementById("searchInput");
		const locationInput = document.getElementById("locationInput");
		currentSearch = searchInput ? searchInput.value.trim() : "";
		currentLocation = locationInput ? locationInput.value.trim() : "";
		loadFarmerProduce(1);
	});

	const clearBtn = document.getElementById("clearSearchBtn");
	if (clearBtn) {
		clearBtn.addEventListener("click", function () {
			currentSearch = "";
			currentLocation = "";
			const searchInput = document.getElementById("searchInput");
			const locationInput = document.getElementById("locationInput");
			if (searchInput) searchInput.value = "";
			if (locationInput) locationInput.value = "";
			loadFarmerProduce(1);
		});
	}

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) {
		prevBtn.addEventListener("click", function () {
			if (currentFarmerProducePage > 1) loadFarmerProduce(currentFarmerProducePage - 1);
		});
	}

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) {
		nextBtn.addEventListener("click", function () {
			loadFarmerProduce(currentFarmerProducePage + 1);
		});
	}
}

function setupFarmerLogout() {
	const logoutBtn = document.getElementById("logoutBtn");
	if (!logoutBtn) return;
	logoutBtn.addEventListener("click", async function () {
		try {
			await logoutUser();
			window.location.href = "../index.html";
		} catch (error) {
			console.error("Farmer logout failed:", error);
			window.location.href = "../index.html";
		}
	});
}

window.loadFarmerProduce = loadFarmerProduce;
window.openPacsSlipModal = openPacsSlipModal;
window.openFarmerProduceDetails = openFarmerProduceDetails;
