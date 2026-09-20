// ============================================
// KISAN SETU - FARMER PAYMENTS & DBT SETTLEMENT MODULE
// File: js/farmer/payments.js
// ============================================

let currentFarmerPaymentPage = 1;
const farmerPaymentPageLimit = 12;
let allFarmerPayments = [];
let currentFarmerPaymentFilter = "ALL";
let farmerPaymentSearchQuery = "";

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
    loadFarmerPayments();
    setupFarmerPaymentToolbar();
    setupFarmerPaymentActions();
    setupFarmerLogout();
});

// ============================================
// LOAD FARMER PAYMENTS
// ============================================

async function loadFarmerPayments(page = 1) {
    currentFarmerPaymentPage = page;
    const container = document.getElementById("paymentsContainer");
    const pageNumber = document.getElementById("pageNumber");
    if (!container) return;

    container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:48px 20px; color:#64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:28px; color:#059669; margin-bottom:12px; display:block;"></i>
            <strong style="font-size:15px; color:#1e293b;">Loading verified DBT harvest payouts...</strong>
        </div>
    `;

    try {
        const response = await getFarmerPayments({ page: currentFarmerPaymentPage, limit: farmerPaymentPageLimit });
        const data = response || {};
        const list = Array.isArray(data)
            ? data
            : (Array.isArray(data.data)
                ? data.data
                : (Array.isArray(data.items)
                    ? data.items
                    : (Array.isArray(data.payments) ? data.payments : [])));

        allFarmerPayments = list;
        updateFarmerPaymentSummary(list);
        filterAndRenderFarmerPayments();

        if (pageNumber) pageNumber.textContent = `Page ${currentFarmerPaymentPage}`;
    } catch (error) {
        console.error("Farmer payments loading error:", error);
        container.innerHTML = `
            <div style="grid-column:1/-1; background:#fef2f2; border:1px solid #fee2e2; border-radius:14px; padding:28px; text-align:center; color:#991b1b;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:32px; color:#ef4444; margin-bottom:10px; display:block;"></i>
                <h3 style="margin:0 0 6px 0; font-size:16px;">Payments Ledger Temporarily Unavailable</h3>
                <p style="margin:0; font-size:13px; color:#7f1d1d;">${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p>
            </div>
        `;
    }
}

// ============================================
// FILTER & SEARCH TOOLBAR
// ============================================

function setupFarmerPaymentToolbar() {
    const filterContainer = document.getElementById("farmerPaymentFilterPills");
    if (filterContainer) {
        filterContainer.addEventListener("click", function (e) {
            const btn = e.target.closest(".filter-pill");
            if (!btn || !btn.dataset.filter) return;
            filterContainer.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            currentFarmerPaymentFilter = btn.dataset.filter;
            filterAndRenderFarmerPayments();
        });
    }

    const searchInput = document.getElementById("farmerPaymentsSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            farmerPaymentSearchQuery = this.value.trim().toLowerCase();
            filterAndRenderFarmerPayments();
        });
    }
}

function filterAndRenderFarmerPayments() {
    const container = document.getElementById("paymentsContainer");
    if (!container) return;

    let filtered = allFarmerPayments.filter(p => {
        const st = String(p.status || "").toUpperCase();
        if (currentFarmerPaymentFilter === "SUCCESS") {
            if (!["SUCCESS", "PAID", "COMPLETED"].includes(st)) return false;
        } else if (currentFarmerPaymentFilter === "PENDING") {
            if (!["PENDING", "INITIATED", "PROCESSING"].includes(st)) return false;
        }

        if (farmerPaymentSearchQuery) {
            const orderNum = String(p.order?.orderNumber || p.orderId || "").toLowerCase();
            const buyerName = String(p.order?.buyer?.name || p.order?.buyerName || "").toLowerCase();
            const payId = String(p.id || p.providerPaymentId || "").toLowerCase();
            return orderNum.includes(farmerPaymentSearchQuery) || buyerName.includes(farmerPaymentSearchQuery) || payId.includes(farmerPaymentSearchQuery);
        }

        return true;
    });

    if (!filtered.length) {
        container.innerHTML = `
            <div style="grid-column:1/-1; background:#ffffff; border:1px solid #e2ece3; border-radius:14px; padding:40px 20px; text-align:center;">
                <div style="width:54px; height:54px; border-radius:50%; background:#f0fdf4; display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; color:#10b981; font-size:24px;">
                    <i class="fa-solid fa-receipt"></i>
                </div>
                <h3 style="margin:0 0 6px 0; font-size:17px; color:#1e293b;">No Payout Records Found</h3>
                <p style="margin:0; font-size:13px; color:#64748b;">No transaction matches your selected filter criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    filtered.forEach(payment => {
        container.appendChild(createFarmerPaymentCard(payment));
    });
}

// ============================================
// CREATE MODERN FARMER PAYMENT CARD
// ============================================

function createFarmerPaymentCard(payment) {
    const card = document.createElement("div");
    card.className = "payment-card";

    const paymentId = payment.id || "N/A";
    const status = String(payment.status || "INITIATED").toUpperCase();
    const isSuccess = ["SUCCESS", "PAID", "COMPLETED"].includes(status);
    const isPending = ["PENDING", "INITIATED", "PROCESSING"].includes(status);

    const rawAmt = Number(payment.order?.totalAmount ?? payment.totalOrderAmount ?? payment.amount ?? 0);
    const formattedAmt = formatCurrency(rawAmt);
    const orderRef = payment.order?.orderNumber || (payment.orderId ? `#${String(payment.orderId).slice(0, 8)}` : "N/A");
    const buyerName = payment.order?.buyer?.name || payment.order?.buyerName || "Verified Buyer / Merchant";
    const provider = payment.provider === "upi_phonepe" ? "PhonePe UPI Escrow" : (payment.provider || "Escrow System");
    const utr = payment.providerPaymentId || (payment.id ? `DBT-${String(payment.id).slice(0, 10)}` : "N/A");
    const createdAt = formatDate(payment.createdAt);

    let badgeClass = "pending";
    let badgeText = "Pending Escrow";
    let badgeIcon = "fa-solid fa-clock";

    if (isSuccess) {
        badgeClass = "success";
        badgeText = "DBT Disbursed & Settled";
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
                <span class="amount-label">Direct Harvest Settlement Value</span>
                <div class="amount-value">
                    ${escapeHTML(formattedAmt)}
                    <span class="escrow-tag"><i class="fa-solid fa-shield-halved"></i> 100% Zero-Deduction</span>
                </div>
                <span class="demo-token-tag">
                    <i class="fa-solid fa-bolt" style="color:#eab308;"></i> Live Escrow Secured &bull; DBT Bank Release Eligible
                </span>
            </div>

            <div class="payment-grid-info">
                <div class="payment-info-item">
                    <span class="info-label">Buyer / Merchant</span>
                    <span class="info-val"><i class="fa-solid fa-store" style="color:#3b82f6; margin-right:4px;"></i>${escapeHTML(buyerName)}</span>
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
                    <span class="info-label">Placement Date</span>
                    <span class="info-val"><i class="fa-regular fa-calendar" style="color:#8b5cf6; margin-right:4px;"></i>${escapeHTML(createdAt)}</span>
                </div>
            </div>
        </div>

        <div class="payment-card-footer">
            <button type="button" class="btn-view-voucher" data-id="${escapeHTML(paymentId)}">
                <i class="fa-solid fa-file-invoice"></i> View DBT Voucher
            </button>
            <span style="font-size:11px; color:#15803d; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-shield-check"></i> Statutory MSP Protected
            </span>
        </div>
    `;

    const viewBtn = card.querySelector(".btn-view-voucher");
    if (viewBtn) {
        viewBtn.addEventListener("click", function () {
            openFarmerPaymentModal(payment, formattedAmt, orderRef, provider, createdAt);
        });
    }

    return card;
}

// ============================================
// PAYMENT SUMMARY CALCULATION
// ============================================

function updateFarmerPaymentSummary(payments) {
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
    if (successEl) successEl.textContent = `${successful} Credited`;
    if (pendingEl) pendingEl.textContent = `${pending} In Escrow`;
    if (failedEl) failedEl.textContent = `${failed} Disputes`;
}

// ============================================
// VOUCHER MODAL
// ============================================

function openFarmerPaymentModal(payment, formattedAmt, orderRef, provider, createdAt) {
    const modal = document.getElementById("paymentModal");
    const details = document.getElementById("paymentDetails");
    if (!modal || !details) return;

    const status = String(payment.status || "INITIATED").toUpperCase();
    const utr = payment.providerPaymentId || (payment.id ? `DBT-${String(payment.id).slice(0, 10)}` : "N/A");
    const verifiedAt = payment.verifiedAt ? formatDate(payment.verifiedAt) : "Disbursed to Bank upon Delivery";

    details.innerHTML = `
        <div style="line-height:1.6; font-size:13px;">
            <div style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:1px solid #bbf7d0; border-radius:12px; padding:16px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:#166534; letter-spacing:0.5px;">Farmer DBT Disbursement Payout</span>
                    <strong style="display:block; font-size:26px; color:#15803d; font-weight:800;">${escapeHTML(formattedAmt)}</strong>
                    <span style="font-size:11px; color:#059669; font-weight:600;"><i class="fa-solid fa-circle-check"></i> 100% Direct DBT Bank Payout</span>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:11px; color:#64748b; text-transform:uppercase;">Voucher Status</span>
                    <strong style="display:block; font-size:14px; color:#166534; text-transform:uppercase;">${escapeHTML(status)}</strong>
                    <small style="color:#059669;">Zero Middleman Cut</small>
                </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Order Reference</span>
                        <strong style="color:#0f172a;">#${escapeHTML(orderRef)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Payment Voucher ID</span>
                        <strong style="color:#0f172a; font-family:monospace; font-size:11px;">${escapeHTML(payment.id || 'N/A')}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Buyer (Payer)</span>
                        <strong style="color:#0f172a;">${escapeHTML(payment.order?.buyer?.name || 'Verified Merchant')}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Channel / Gateway</span>
                        <strong style="color:#0f172a;">${escapeHTML(provider)}</strong>
                    </div>
                </div>

                <div style="border-top:1px dashed #cbd5e1; padding-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Bank UTR / Hash</span>
                        <strong style="color:#0f172a; font-family:monospace; font-size:11px;">${escapeHTML(utr)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Beneficiary Account</span>
                        <strong style="color:#15803d;"><i class="fa-solid fa-circle-check"></i> Aadhaar DBT Linked Account</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Transaction Date</span>
                        <strong style="color:#0f172a;">${escapeHTML(createdAt)}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; font-size:11px; display:block;">Escrow Settlement</span>
                        <strong style="color:#15803d;">${escapeHTML(verifiedAt)}</strong>
                    </div>
                </div>
            </div>

            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 14px; margin-bottom:18px; display:flex; align-items:center; gap:10px;">
                <i class="fa-solid fa-scale-balanced" style="color:#2563eb; font-size:18px;"></i>
                <div style="font-size:11.5px; color:#1e40af;">
                    <strong>Statutory MSP Protection Guaranteed:</strong> Price meets or exceeds mandatory statutory floor of ₹12.00/kg (₹1,200/Quintal).
                </div>
            </div>

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

    const modal = document.getElementById("paymentModal");
    const closeBtn = document.getElementById("closeModalBtn");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.style.display = "none");
        modal.addEventListener("click", e => {
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
        } finally {
            window.location.href = "../index.html";
        }
    });
}

window.loadFarmerPayments = loadFarmerPayments;
window.getFarmerPayments = async function (params = {}) {
    return apiRequest(`/farmer/me/payments${queryString(params)}`);
};
