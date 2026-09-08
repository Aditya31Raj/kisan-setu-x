let currentFarmerDisputePage = 1;
const farmerDisputePageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerDisputes();
	setupFarmerDisputeForm();
	setupFarmerLogout();
});

async function loadFarmerDisputes(page = 1) {
	currentFarmerDisputePage = page;
	const container = document.getElementById("disputesContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `<p>Loading disputes...</p>`;
	try {
		const response = await getFarmerDisputes({ page: currentFarmerDisputePage, limit: farmerDisputePageLimit });
		const data = response || {};
		const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.disputes) ? data.disputes : [])));

		if (!list.length) {
			container.innerHTML = `<div class="no-disputes"><h3>No disputes found</h3><p>You have not raised any disputes.</p></div>`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerDisputePage}`;
			return;
		}

		container.innerHTML = "";
		list.forEach((dispute) => {
			const card = document.createElement("div");
			card.className = "dispute-card";
			card.innerHTML = `
				<h3>Dispute #${escapeHTML(dispute.id || "N/A")}</h3>
				<p><strong>Order:</strong> ${escapeHTML(dispute.orderId || "N/A")}</p>
				<p><strong>Status:</strong> ${escapeHTML(dispute.status || "OPEN")}</p>
				<p><strong>Reason:</strong> ${escapeHTML(dispute.reason || "Not specified")}</p>
			`;
			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerDisputePage}`;
	} catch (error) {
		console.error("Farmer disputes loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Disputes are temporarily unavailable</strong><p>${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p></div></div>`;
	}
}

function setupFarmerDisputeForm() {
	const form = document.getElementById("disputeForm");
	if (!form) return;
	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const orderId = document.getElementById("orderId")?.value || "";
		const reason = document.getElementById("reason")?.value || "";
		const msg = document.getElementById("disputeMessage");
		try {
			await apiRequest("/farmers/disputes", { method: "POST", body: { orderId, reason } });
			if (msg) msg.innerHTML = `<div class="success-message">Dispute submitted successfully.</div>`;
			form.reset();
			loadFarmerDisputes(1);
		} catch (error) {
			if (msg) msg.innerHTML = `<div class="error-message">${escapeHTML(error.message || "Failed to submit dispute.")}</div>`;
		}
	});

	const refreshBtn = document.getElementById("refreshDisputesBtn");
	if (refreshBtn) refreshBtn.addEventListener("click", () => loadFarmerDisputes(1));

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) prevBtn.addEventListener("click", () => { if (currentFarmerDisputePage > 1) loadFarmerDisputes(currentFarmerDisputePage - 1); });

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) nextBtn.addEventListener("click", () => loadFarmerDisputes(currentFarmerDisputePage + 1));
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

window.loadFarmerDisputes = loadFarmerDisputes;
