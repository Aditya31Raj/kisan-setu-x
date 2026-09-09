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
			const displayName = produce.cropName || produce.title || produce.name || "Unnamed Produce";
			item.innerHTML = `
				<div class="produce-icon"><i class="fa-solid ${cropIconClass(displayName)}" aria-hidden="true"></i></div>
				<h3>${escapeHTML(displayName)}</h3>
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

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		message.textContent = "Saving produce...";
		const payload = {
			title: document.getElementById("produceName").value.trim(),
			name: document.getElementById("produceName").value.trim(),
			category: document.getElementById("produceCategory").value.trim(),
			quantity: Number(document.getElementById("produceQuantity").value),
			unit: document.getElementById("produceUnit").value,
			price: Number(document.getElementById("producePrice").value),
			location: document.getElementById("produceLocation").value.trim(),
			description: document.getElementById("produceDescription").value.trim()
		};
		try {
			await createFarmerProduce(payload);
			message.textContent = "Produce added successfully.";
			form.reset();
			setOpen(false);
			loadFarmerProduce(1);
		} catch (error) {
			message.textContent = error.message || "Unable to add produce.";
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
