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
		container.innerHTML = "";
		list.forEach((produce) => {
			const item = document.createElement("div");
			item.className = "produce-card";
			const rawTitle = produce.title || produce.name || "Unnamed Produce";
			const isBlockProcurement = rawTitle.includes("[Block Procurement") || (produce.description || "").includes("Block Procurement");
			const displayName = rawTitle.replace(/\[Block Procurement[^\]]*\]/g, "").trim();

			item.innerHTML = `
				<div style="display:flex; justify-content:space-between; align-items:flex-start;">
					<div class="produce-icon"><i class="fa-solid ${cropIconClass(displayName)}" aria-hidden="true"></i></div>
					${isBlockProcurement ? `
						<span style="background:#fef3c7; color:#92400e; font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; border:1px solid #fcd34d;">
							<i class="fa-solid fa-building-columns"></i> BLOCK MSP
						</span>
					` : `
						<span style="background:#f0fdf4; color:#166534; font-size:10px; font-weight:600; padding:3px 8px; border-radius:6px;">
							OPEN MARKET
						</span>
					`}
				</div>
				<h3 style="margin-top:8px;">${escapeHTML(displayName)}</h3>
				<p><strong>Category:</strong> ${escapeHTML(produce.category || produce.variety || "General")}</p>
				<p><strong>Quantity:</strong> ${escapeHTML(String(produce.availableQuantity ?? produce.quantity ?? 0))} ${escapeHTML(produce.unit || "kg")}</p>
				<p><strong>Price:</strong> ₹${escapeHTML(String(produce.pricePerUnit ?? produce.price ?? 0))}/${escapeHTML(produce.unit || "kg")}</p>
				<p><strong>Location:</strong> ${escapeHTML(produce.location || (produce.district ? `${produce.district}, ${produce.state}` : "Direct Farm"))}</p>
				<p><strong>Status:</strong> ${escapeHTML(produce.status || "LISTED")}</p>
				<button type="button" class="remove-produce-btn" data-id="${escapeHTML(String(produce.id || produce._id || ""))}"><i class="fa-solid fa-trash"></i> Remove</button>
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
	});
	marketRadio?.addEventListener("change", () => {
		if (blockInfo) blockInfo.style.display = "none";
	});

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const submitBtn = form.querySelector("button[type='submit']");
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
		}
		message.style.display = "block";
		message.style.padding = "10px 14px";
		message.style.borderRadius = "8px";
		message.style.marginBottom = "14px";
		message.style.background = "#eff6ff";
		message.style.border = "1px solid #bfdbfe";
		message.style.color = "#1d4ed8";
		message.textContent = "Saving produce listing...";

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
			unit: (document.getElementById("produceUnit").value || "KG").toUpperCase(),
			price: Number(document.getElementById("producePrice").value),
			location: document.getElementById("produceLocation").value.trim() || "Patna, Bihar",
			description: finalDesc
		};

		try {
			await createFarmerProduce(payload);
			message.style.background = "#f0fdf4";
			message.style.border = "1px solid #bbf7d0";
			message.style.color = "#166534";
			message.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${isBlock ? "Produce offered to Block Procurement Center successfully!" : "Produce added successfully!"}`;
			form.reset();
			if (blockInfo) blockInfo.style.display = "none";
			setOpen(false);
			await loadFarmerProduce(1);
			setTimeout(() => {
				message.style.display = "none";
			}, 5000);
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
