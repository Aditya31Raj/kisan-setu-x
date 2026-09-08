let currentFarmerOrderPage = 1;
const farmerOrderPageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerOrders();
	setupFarmerOrderControls();
	setupFarmerLogout();
});

async function loadFarmerOrders(page = 1) {
	currentFarmerOrderPage = page;
	const container = document.getElementById("ordersContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `<p>Loading orders...</p>`;

	try {
		const statusFilter = document.getElementById("statusFilter");
		const params = {
			page: currentFarmerOrderPage,
			limit: farmerOrderPageLimit,
			status: statusFilter ? statusFilter.value : ""
		};

		const response = await getFarmerOrders(params);
		const data = response || {};
		const orders = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.orders) ? data.orders : [])));

		if (!orders.length) {
			container.innerHTML = `<div class="no-orders"><h3>No orders found</h3><p>You do not have any orders yet.</p></div>`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerOrderPage}`;
			return;
		}

		container.innerHTML = "";
		orders.forEach((order) => {
			const card = document.createElement("div");
			card.className = "order-card";
			card.innerHTML = `
				<h3>Order #${escapeHTML(order.orderNumber || order.id || "N/A")}</h3>
				<p><strong>Buyer:</strong> ${escapeHTML(order.buyerName || order.buyer || "Not specified")}</p>
				<p><strong>Status:</strong> ${escapeHTML(order.status || "N/A")}</p>
				<p><strong>Total:</strong> ₹${escapeHTML(String(order.totalAmount ?? order.amount ?? 0))}</p>
				<p><strong>Created:</strong> ${escapeHTML(order.createdAt || "Not available")}</p>
			`;
			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerOrderPage}`;
	} catch (error) {
		console.error("Farmer orders loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error"><i class="fa-solid fa-circle-exclamation"></i><div><strong>Orders are temporarily unavailable</strong><p>${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p></div></div>`;
	}
}

function setupFarmerOrderControls() {
	const statusFilter = document.getElementById("statusFilter");
	if (statusFilter) {
		statusFilter.addEventListener("change", function () {
			loadFarmerOrders(1);
		});
	}

	const refreshBtn = document.getElementById("refreshOrdersBtn");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			loadFarmerOrders(1);
		});
	}

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) {
		prevBtn.addEventListener("click", function () {
			if (currentFarmerOrderPage > 1) loadFarmerOrders(currentFarmerOrderPage - 1);
		});
	}

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) {
		nextBtn.addEventListener("click", function () {
			loadFarmerOrders(currentFarmerOrderPage + 1);
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

window.loadFarmerOrders = loadFarmerOrders;
