let currentFarmerHistoryPage = 1;
const farmerHistoryPageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerHistory();
	setupFarmerHistoryControls();
	setupFarmerLogout();
});

async function loadFarmerHistory(page = 1) {
	currentFarmerHistoryPage = page;
	const container = document.getElementById("historyContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `<p>Loading order history...</p>`;
	const statusFilter = document.getElementById("statusFilter");

	try {
		const response = await getFarmerHistory({ page: currentFarmerHistoryPage, limit: farmerHistoryPageLimit, status: statusFilter ? statusFilter.value : "ALL" });
		const data = response || {};
		const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.orders) ? data.orders : [])));

		if (!list.length) {
			container.innerHTML = `<div class="no-orders"><h3>No history found</h3><p>No completed or archived orders yet.</p></div>`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerHistoryPage}`;
			return;
		}

		container.innerHTML = "";
		list.forEach((order) => {
			const card = document.createElement("div");
			card.className = "history-card";
			card.innerHTML = `
				<h3>Order #${escapeHTML(order.orderNumber || order.id || "N/A")}</h3>
				<p><strong>Buyer:</strong> ${escapeHTML(order.buyerName || order.buyer || "Not specified")}</p>
				<p><strong>Status:</strong> ${escapeHTML(order.status || "COMPLETED")}</p>
				<p><strong>Amount:</strong> ₹${escapeHTML(String(order.totalAmount ?? 0))}</p>
				<p><strong>Completed:</strong> ${escapeHTML(order.updatedAt || order.createdAt || "N/A")}</p>
			`;
			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerHistoryPage}`;
	} catch (error) {
		console.error("Farmer history loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error"><i class="fa-solid fa-clock-rotate-left"></i><div><strong>History is temporarily unavailable</strong><p>${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p></div></div>`;
	}
}

function setupFarmerHistoryControls() {
	const statusFilter = document.getElementById("statusFilter");
	if (statusFilter) {
		statusFilter.addEventListener("change", function () {
			loadFarmerHistory(1);
		});
	}

	const refreshBtn = document.getElementById("refreshHistoryBtn");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			loadFarmerHistory(1);
		});
	}

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) {
		prevBtn.addEventListener("click", function () {
			if (currentFarmerHistoryPage > 1) loadFarmerHistory(currentFarmerHistoryPage - 1);
		});
	}

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) {
		nextBtn.addEventListener("click", function () {
			loadFarmerHistory(currentFarmerHistoryPage + 1);
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

window.loadFarmerHistory = loadFarmerHistory;
