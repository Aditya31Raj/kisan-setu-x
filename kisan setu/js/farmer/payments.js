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
			
			const rawAmt = Number(payment.order?.totalAmount ?? payment.totalOrderAmount ?? payment.totalAmount ?? payment.amount ?? 0);
			const formattedAmt = rawAmt.toLocaleString('en-IN');
			const orderRef = payment.order?.orderNumber || (payment.orderId ? `#${String(payment.orderId).slice(0, 8)}` : "N/A");
			const paymentId = payment.id || "N/A";
			const provider = payment.provider === 'upi_phonepe' ? 'PhonePe UPI Escrow' : (payment.method || payment.provider || "Escrow Settlement");
			const createdAt = payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "--";

			card.className = `payment-card ${statusClass}`;
			card.innerHTML = `
				<div class="payment-card-heading">
					<h3>Payment ${escapeHTML(orderRef)}</h3>
					<i class="fa-solid fa-wallet"></i>
				</div>
				<p><strong>Order Ref:</strong> ${escapeHTML(orderRef)}</p>
				<p><strong>Total Order Amount:</strong> <strong style="color:#166534; font-size:16px;">₹${escapeHTML(formattedAmt)}</strong></p>
				<p><strong>Status:</strong> <span class="payment-status">${escapeHTML(status)}</span></p>
				<p><strong>Method:</strong> ${escapeHTML(provider)}</p>
				<p><strong>Date:</strong> ${escapeHTML(createdAt)}</p>
				<div style="margin-top: 12px;">
					<button type="button" class="view-payment-btn" style="padding: 7px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
						<i class="fa-solid fa-file-invoice"></i> View Details
					</button>
				</div>
			`;

			const viewBtn = card.querySelector(".view-payment-btn");
			if (viewBtn) {
				viewBtn.addEventListener("click", () => openFarmerPaymentModal(payment, formattedAmt, orderRef, provider, createdAt));
			}

			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerPaymentPage}`;
	} catch (error) {
		console.error("Farmer payments loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error"><i class="fa-solid fa-circle-exclamation"></i><div><strong>Payments are temporarily unavailable</strong><p>${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p></div></div>`;
	}
}

function openFarmerPaymentModal(payment, formattedAmt, orderRef, provider, createdAt) {
	const modal = document.getElementById("paymentModal");
	const details = document.getElementById("paymentDetails");
	if (!modal || !details) return;

	const status = String(payment.status || "INITIATED").toUpperCase();

	details.innerHTML = `
		<div class="payment-detail" style="line-height: 1.6; font-size: 13px;">
			<div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; margin-bottom: 14px;">
				<span style="display:block; font-size: 12px; color: #166534; font-weight: 600;">Total Settlement / Order Value:</span>
				<strong style="font-size: 22px; color: #15803d;">₹${escapeHTML(formattedAmt)}</strong>
				<small style="display:block; color: #166534; margin-top: 2px;">Secured in Escrow for direct bank disbursement</small>
			</div>
			<p><strong>Payment Reference:</strong> ${escapeHTML(String(payment.id || "N/A"))}</p>
			<p><strong>Order Reference:</strong> ${escapeHTML(String(orderRef))}</p>
			<p><strong>Settlement Channel:</strong> ${escapeHTML(String(provider))}</p>
			<p><strong>Transaction Status:</strong> <span class="payment-status" style="font-weight:700; color:#166534;">${escapeHTML(status)}</span></p>
			<p><strong>Date:</strong> ${escapeHTML(createdAt)}</p>
			<p><strong>Beneficiary Account:</strong> Verified Farmer Aadhaar/Bank Account Linked (DBT Eligible)</p>
		</div>
	`;

	modal.style.display = "flex";
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

	const closeModalBtn = document.getElementById("closeModalBtn");
	const modal = document.getElementById("paymentModal");
	if (closeModalBtn && modal) {
		closeModalBtn.addEventListener("click", function () {
			modal.style.display = "none";
		});
		modal.addEventListener("click", function (e) {
			if (e.target === modal) modal.style.display = "none";
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
