let currentFarmerPaymentPage = 1;
const farmerPaymentPageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function updateFarmerPaymentSummary(payments) {
	const count = (statuses) => payments.filter((payment) => statuses.includes(String(payment.status || "").toUpperCase())).length;
	const total = document.getElementById("totalPayments");
	const successful = document.getElementById("successfulPayments");
	const pending = document.getElementById("pendingPayments");
	const failed = document.getElementById("failedPayments");
	if (total) total.textContent = payments.length;
	if (successful) successful.textContent = count(["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED"]);
	if (pending) pending.textContent = count(["PENDING", "INITIATED", "PROCESSING"]);
	if (failed) failed.textContent = count(["FAILED", "CANCELLED", "REJECTED"]);
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerPayments();
	setupFarmerPaymentActions();
	setupFarmerLogout();
});

async function loadFarmerPayments(page = 1) {
	currentFarmerPaymentPage = page;
	const container = document.getElementById("paymentsContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `<p id="loadingMessage">Loading payments...</p>`;

	try {
		const response = await getFarmerPayments({ page: currentFarmerPaymentPage, limit: farmerPaymentPageLimit });
		const data = response || {};
		const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.payments) ? data.payments : [])));
		updateFarmerPaymentSummary(list);

		if (!list.length) {
			container.innerHTML = `<div class="no-payments"><h3>No payments found</h3><p>No payment history available.</p></div>`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerPaymentPage}`;
			return;
		}

		container.innerHTML = "";
		list.forEach((payment) => {
			const card = document.createElement("div");
			const status = String(payment.status || "INITIATED").toUpperCase();
			const statusClass = ["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED"].includes(status)
				? "payment-status-success"
				: (["FAILED", "CANCELLED", "REJECTED"].includes(status) ? "payment-status-failed" : "payment-status-pending");
			card.className = `payment-card ${statusClass}`;
			card.innerHTML = `
				<div class="payment-card-heading"><h3>Payment ${escapeHTML(payment.id || "N/A")}</h3><i class="fa-solid fa-wallet"></i></div>
				<p><strong>Order:</strong> ${escapeHTML(payment.orderId || payment.order || "N/A")}</p>
				<p><strong>Amount:</strong> ₹${escapeHTML(String(payment.amount ?? payment.totalAmount ?? 0))}</p>
				<p><strong>Status:</strong> <span class="payment-status">${escapeHTML(payment.status || "INITIATED")}</span></p>
				<p><strong>Method:</strong> ${escapeHTML(payment.method || payment.provider || "N/A")}</p>
			`;
			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerPaymentPage}`;
	} catch (error) {
		console.error("Farmer payments loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error"><i class="fa-solid fa-circle-exclamation"></i><div><strong>Payments are temporarily unavailable</strong><p>${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p></div></div>`;
	}
}

function setupFarmerPaymentActions() {
	const refreshBtn = document.getElementById("refreshPaymentsBtn");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			loadFarmerPayments(1);
		});
	}

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) {
		prevBtn.addEventListener("click", function () {
			if (currentFarmerPaymentPage > 1) loadFarmerPayments(currentFarmerPaymentPage - 1);
		});
	}

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) {
		nextBtn.addEventListener("click", function () {
			loadFarmerPayments(currentFarmerPaymentPage + 1);
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

window.loadFarmerPayments = loadFarmerPayments;
