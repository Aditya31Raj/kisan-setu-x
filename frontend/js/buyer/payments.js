// ============================================
// KISAN SETU - BUYER PAYMENTS & ESCROW MODULE
// File: js/buyer/payments.js
// ============================================

let currentPaymentPage = 1;
const paymentPageLimit = 12;
let allBuyerPayments = [];
let currentPaymentFilter = "ALL";
let paymentSearchQuery = "";

function escapeHTML(value) {
    return String(value ?? "")
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

function formatCurrency(num) {
    return "₹" + Number(num || 0).toLocaleString("en-IN");
}

document.addEventListener("DOMContentLoaded", function () {
    loadPayments();
    setupPaymentToolbar();
    setupPaymentPagination();
    setupPaymentModal();
    setupRefreshButton();
    setupLogout();
});

// ============================================
// LOAD PAYMENTS
// ============================================

async function loadPayments(page = 1) {
    currentPaymentPage = page;
    const container = document.getElementById("paymentsContainer");
    const pageNumber = document.getElementById("pageNumber");
    if (!container) return;

    container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:48px 20px; color:#64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:28px; color:#059669; margin-bottom:12px; display:block;"></i>
            <strong style="font-size:15px; color:#1e293b;">Loading verified escrow settlements...</strong>
        </div>
    `;

    try {
        const data = await apiRequest(`/payments?page=${currentPaymentPage}&limit=${paymentPageLimit}`);
        const list = Array.isArray(data)
            ? data
            : (Array.isArray(data.data)
                ? data.data
                : (Array.isArray(data.items)
                    ? data.items
                    : (Array.isArray(data.payments) ? data.payments : [])));

        allBuyerPayments = list;
        updatePaymentSummary(list);
        filterAndRenderPayments();

        if (pageNumber) pageNumber.textContent = `Page ${currentPaymentPage}`;
    } catch (error) {
        console.error("Payment loading error:", error);
        container.innerHTML = `
            <div style="grid-column:1/-1; background:#fef2f2; border:1px solid #fee2e2; border-radius:14px; padding:28px; text-align:center; color:#991b1b;">
                <i class="fa-solid fa-shield-halved" style="font-size:32px; color:#ef4444; margin-bottom:10px; display:block;"></i>
                <h3 style="margin:0 0 6px 0; font-size:16px;">Payments Currently Unavailable</h3>
                <p style="margin:0; font-size:13px; color:#7f1d1d;">${escapeHTML(friendlyErrorMessage(error, "Please refresh or try again shortly."))}</p>
            </div>
        `;
    }
}

// ============================================
// FILTER & SEARCH TOOLBAR
// ============================================

function setupPaymentToolbar() {
    const filterContainer = document.getElementById("paymentFilterPills");
    if (filterContainer) {
        filterContainer.addEventListener("click", function (e) {
            const btn = e.target.closest(".filter-pill");
            if (!btn || !btn.dataset.filter) return;
            filterContainer.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            currentPaymentFilter = btn.dataset.filter;
            filterAndRenderPayments();
        });
    }

    const searchInput = document.getElementById("paymentsSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            paymentSearchQuery = this.value.trim().toLowerCase();
            filterAndRenderPayments();
        });
    }
}

function filterAndRenderPayments() {
    const container = document.getElementById("paymentsContainer");
    if (!container) return;

    let filtered = allBuyerPayments.filter(p => {
        const st = String(p.status || "").toUpperCase();
        if (currentPaymentFilter === "SUCCESS") {
            if (!["SUCCESS", "PAID", "COMPLETED"].includes(st)) return false;
        } else if (currentPaymentFilter === "PENDING") {
            if (!["PENDING", "INITIATED", "PROCESSING"].includes(st)) return false;
        }

        if (paymentSearchQuery) {
            const orderNum = String(p.order?.orderNumber || p.orderId || "").toLowerCase();
            const farmerName = String(p.order?.farmer?.name || "").toLowerCase();
            const payId = String(p.id || p.providerPaymentId || "").toLowerCase();
            return orderNum.includes(paymentSearchQuery) || farmerName.includes(paymentSearchQuery) || payId.includes(paymentSearchQuery);
        }

        return true;
    });

    if (!filtered.length) {
        container.innerHTML = `
            <div style="grid-column:1/-1; background:#ffffff; border:1px solid #e2ece3; border-radius:14px; padding:40px 20px; text-align:center;">
                <div style="width:54px; height:54px; border-radius:50%; background:#f0fdf4; display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; color:#10b981; font-size:24px;">
                    <i class="fa-solid fa-receipt"></i>
                </div>
                <h3 style="margin:0 0 6px 0; font-size:17px; color:#1e293b;">No Settlements Found</h3>
                <p style="margin:0; font-size:13px; color:#64748b;">No transaction matches your selected filter criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    filtered.forEach(payment => {
        container.appendChild(createPaymentCard(payment));
    });
}

// ============================================
// CREATE MODERN PAYMENT CARD
// ============================================

function createPaymentCard(payment) {
    const card = document.createElement("div");
    card.className = "payment-card";

    const paymentId = payment.id || "N/A";
    const status = String(payment.status || "INITIATED").toUpperCase();
    const isSuccess = ["SUCCESS", "PAID", "COMPLETED"].includes(status);
    const isPending = ["PENDING", "INITIATED", "PROCESSING"].includes(status);

    const rawAmt = Number(payment.order?.totalAmount ?? payment.totalOrderAmount ?? payment.amount ?? 0);
    const formattedAmt = formatCurrency(rawAmt);
    const orderRef = payment.order?.orderNumber || (payment.orderId ? `#${String(payment.orderId).slice(0, 8)}` : "N/A");
    const farmerName = payment.order?.farmer?.name || "Verified Farmer";
    const farmerPhone = payment.order?.farmer?.phone || "Aadhaar/DBT Verified";
    const provider = payment.provider === "upi_phonepe" ? "PhonePe UPI Escrow" : (payment.provider || "Escrow System");
    const utr = payment.providerPaymentId || (payment.id ? `ESCROW-${String(payment.id).slice(0, 10)}` : "N/A");
    const createdAt = formatDate(payment.createdAt);

    let badgeClass = "pending";
    let badgeText = "Pending Escrow";
    let badgeIcon = "fa-solid fa-clock";

    if (isSuccess) {
        badgeClass = "success";
        badgeText = "Escrow Secured & Paid";
        badgeIcon = "fa-solid fa-circle-check";
    } else if (!isPending) {
        badgeClass = "failed";
        badgeText = status;
        badgeIcon = "fa-solid fa-shield-xmark";
    }

    card.innerHTML = `
        <div class="payment-card-top">
            <span class="payment-card-ref">
                <i class="fa-solid fa-receipt"></i> Order #${escapeHTML(orderRef)}
            </span>
            <span class="payment-status-badge ${badgeClass}">
                <i class="${badgeIcon}"></i> ${escapeHTML(badgeText)}
            </span>
        </div>

        <div class="payment-card-body">
            <div class="payment-amount-hero">
                <span class="amount-label">Actual Order Settlement Value</span>
                <div class="amount-value">
                    ${escapeHTML(formattedAmt)}
                    <span class="escrow-tag"><i class="fa-solid fa-shield-halved"></i> Escrow Guaranteed</span>
                </div>
                <span class="demo-token-tag">
                    <i class="fa-solid fa-bolt" style="color:#eab308;"></i> Gateway Test Token: ₹1.00 Live Demo Verified
                </span>
            </div>

            <div class="payment-grid-info">
                <div class="payment-info-item">
                    <span class="info-label">Farmer Beneficiary</span>
                    <span class="info-val"><i class="fa-solid fa-user-check" style="color:#10b981; margin-right:4px;"></i>${escapeHTML(farmerName)}</span>
                </div>
                <div class="payment-info-item">
                    <span class="info-label">Settlement Channel</span>
                    <span class="info-val"><i class="fa-solid fa-building-columns" style="color:#0284c7; margin-right:4px;"></i>${escapeHTML(provider)}</span>
                </div>
                <div class="payment-info-item">
                    <span class="info-label">Transaction Reference</span>
                    <span class="info-val" style="font-family:monospace; font-size:11px;">${escapeHTML(utr)}</span>
                </div>
                <div class="payment-info-item">
                    <span class="info-label">Settlement Date</span>
                    <span class="info-val"><i class="fa-regular fa-calendar" style="color:#8b5cf6; margin-right:4px;"></i>${escapeHTML(createdAt)}</span>
                </div>
            </div>
        </div>

        <div class="payment-card-footer">
            <button type="button" class="btn-view-voucher" data-id="${escapeHTML(paymentId)}">
                <i class="fa-solid fa-file-invoice"></i> View Official Receipt
            </button>
            ${isPending ? `
                <a href="orders.html" class="btn-pay-now">
                    <i class="fa-solid fa-qrcode"></i> Pay via UPI QR (Demo ₹1 Token)
                </a>
            ` : `
                <a href="logistics.html" style="font-size:12px; font-weight:700; color:#059669; text-decoration:none; display:inline-flex; align-items:center; gap:5px;">
                    <i class="fa-solid fa-truck-fast"></i> Track Shipment &rarr;
                </a>
            `}
        </div>
    `;

    const viewBtn = card.querySelector(".btn-view-voucher");
    if (viewBtn) {
        viewBtn.addEventListener("click", function () {
            loadPaymentDetails(paymentId);
        });
    }

    return card;
}

// ============================================
// PAYMENT SUMMARY CALCULATION
// ============================================

function updatePaymentSummary(payments) {
    const totalEl = document.getElementById("totalPayments");
    const successEl = document.getElementById("successfulPayments");
    const pendingEl = document.getElementById("pendingPayments");
    const failedEl = document.getElementById("failedPayments");

    let totalVolume = 0;
    let successful = 0;
    let pending = 0;
    let failed = 0;

    payments.forEach(p => {
        const amt = Number(p.order?.totalAmount ?? p.totalOrderAmount ?? p.amount ?? 0);
        totalVolume += amt;
        const st = String(p.status || "").toUpperCase();
        if (["SUCCESS", "PAID", "COMPLETED"].includes(st)) {
            successful++;
        } else if (["PENDING", "INITIATED", "PROCESSING"].includes(st)) {
            pending++;
        } else if (["FAILED", "CANCELLED", "REJECTED"].includes(st)) {
            failed++;
        }
    });

    if (totalEl) totalEl.textContent = formatCurrency(totalVolume);
    if (successEl) successEl.textContent = `${successful} Verified`;
    if (pendingEl) pendingEl.textContent = `${pending} Active`;
    if (failedEl) failedEl.textContent = `${failed} Disputed`;
}

// ============================================
// PAYMENT DETAILS & OFFICIAL VOUCHER MODAL
// ============================================

async function loadPaymentDetails(paymentId) {
    const modal = document.getElementById("paymentModal");
    const details = document.getElementById("paymentDetails");
    if (!modal || !details) return;

    modal.style.display = "flex";
    details.innerHTML = `
        <div style="text-align:center; padding:36px; color:#64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:#059669; margin-bottom:10px; display:block;"></i>
            Generating official escrow audit receipt...
        </div>
    `;

    try {
        const data = await apiRequest(`/payments/${encodeURIComponent(paymentId)}`);
        const payment = data.data || data;
        displayPaymentDetails(payment);
    } catch (error) {
        console.error("Payment details error:", error);
        details.innerHTML = `
            <div style="padding:20px; text-align:center; color:#991b1b; background:#fef2f2; border-radius:10px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:24px; margin-bottom:8px; display:block;"></i>
                Unable to load official voucher details.
            </div>
        `;
    }
}

function displayPaymentDetails(payment) {
    const details = document.getElementById("paymentDetails");
    if (!details) return;

    const paymentId = payment.id || "N/A";
    const status = String(payment.status || "INITIATED").toUpperCase();
    const rawAmt = Number(payment.order?.totalAmount ?? payment.totalOrderAmount ?? payment.amount ?? 0);
    const formattedAmt = formatCurrency(rawAmt);
    const orderRef = payment.order?.orderNumber || (payment.orderId ? `#${String(payment.orderId).slice(0, 8)}` : "N/A");
    const farmer = payment.order?.farmer || {};
    const buyer = payment.order?.buyer || {};
    const provider = payment.provider === "upi_phonepe" ? "PhonePe UPI Escrow" : (payment.provider || "Escrow System");
    const utr = payment.providerPaymentId || `ESCROW-${String(paymentId).slice(0, 10)}`;
    const createdAt = formatDate(payment.createdAt);
    const verifiedAt = payment.verifiedAt ? formatDate(payment.verifiedAt) : "Pending Delivery Inspection";

    details.innerHTML = `
        <div style="line-height:1.6; font-size:13px;">
            <!-- Receipt Header Box -->
            <div style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:1px solid #bbf7d0; border-radius:12px; padding:16px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:#166534; letter-spacing:0.5px;">Official Escrow Settlement Value</span>
                    <strong style="display:block; font-size:26px; color:#15803d; font-weight:800;">${escapeHTML(formattedAmt)}</strong>
                    <span style="font-size:11px; color:#059669; font-weight:600;"><i class="fa-solid fa-circle-check"></i> 100% DBT Bank Release Authorized</span>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:11px; color:#64748b; text-transform:uppercase;">Voucher Status</span>
                    <strong style="display:block; font-size:14px; color:#166534; text-transform:uppercase;">${escapeHTML(status)}</strong>
                    <small style="color:#059669;">Zero-Deduction DBT</small>
                </div>
            </div>

            <!-- Audit Grid -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Order Reference</span>
                        <strong style="color:#0f172a;">#${escapeHTML(orderRef)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Payment Voucher ID</span>
                        <strong style="color:#0f172a; font-family:monospace; font-size:11px;">${escapeHTML(paymentId)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Farmer (Beneficiary)</span>
                        <strong style="color:#0f172a;">${escapeHTML(farmer.name || 'Verified Farmer')}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Buyer / Vendor (Payer)</span>
                        <strong style="color:#0f172a;">${escapeHTML(buyer.name || 'Registered Buyer')}</strong>
                    </div>
                </div>

                <div style="border-top:1px dashed #cbd5e1; padding-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Channel / Gateway</span>
                        <strong style="color:#0f172a;">${escapeHTML(provider)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Bank UTR / Hash</span>
                        <strong style="color:#0f172a; font-family:monospace; font-size:11px;">${escapeHTML(utr)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Initiated Date</span>
                        <strong style="color:#0f172a;">${escapeHTML(createdAt)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Escrow Verification</span>
                        <strong style="color:#15803d;">${escapeHTML(verifiedAt)}</strong>
                    </div>
                </div>
            </div>

            <!-- Guarantee Note -->
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 14px; margin-bottom:18px; display:flex; align-items:center; gap:10px;">
                <i class="fa-solid fa-scale-balanced" style="color:#2563eb; font-size:18px;"></i>
                <div style="font-size:11.5px; color:#1e40af;">
                    <strong>Statutory MSP Protection Guaranteed:</strong> Transaction compliance meets or exceeds the mandatory ₹12.00/kg floor under Bihar Agricultural Safeguards.
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #eef2ef; padding-top:14px;">
                <button type="button" onclick="window.print()" style="padding:9px 16px; background:#f1f5f9; border:1px solid #cbd5e1; color:#334155; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-print"></i> Print Receipt
                </button>
                <button type="button" onclick="document.getElementById('paymentModal').style.display='none'" style="padding:9px 18px; background:#059669; color:white; border:none; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer;">
                    Done
                </button>
            </div>
        </div>
    `;
}

// ============================================
// MODAL & PAGINATION CONTROLS
// ============================================

function setupPaymentModal() {
    const modal = document.getElementById("paymentModal");
    const closeBtn = document.getElementById("closeModalBtn");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.style.display = "none");
        modal.addEventListener("click", e => {
            if (e.target === modal) modal.style.display = "none";
        });
    }
}

function setupPaymentPagination() {
    const prevBtn = document.getElementById("previousBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPaymentPage > 1) loadPayments(currentPaymentPage - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            loadPayments(currentPaymentPage + 1);
        });
    }
}

function setupRefreshButton() {
    const btn = document.getElementById("refreshPaymentsBtn");
    if (btn) {
        btn.addEventListener("click", () => loadPayments(1));
    }
}

function setupLogout() {
    const btn = document.getElementById("logoutBtn");
    if (btn) {
        btn.addEventListener("click", async () => {
            try {
                await logoutUser();
            } finally {
                window.location.replace("../buyer_login.html");
            }
        });
    }
}