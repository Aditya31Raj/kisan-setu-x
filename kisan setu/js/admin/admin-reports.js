// ==================================================
// KISAN SETU - ADMIN REPORTS MANAGEMENT
// File: js/admin/admin-reports.js
// ==================================================

let allReportRecords = [];

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

document.addEventListener("DOMContentLoaded", async function () {
    const user = await ensureAdminAuth();
    if (!user) return;

    loadAdminReports();
    setupReportControls();
    setupAdminLogout();
});

async function loadAdminReports() {
    const container = document.getElementById("adminReportsContainer");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:32px; color:#666;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading reports & transactions...
        </div>
    `;

    try {
        const [dashRes, paymentsRes] = await Promise.allSettled([
            getAdminDashboard(),
            apiRequest("/admin/payments?limit=50")
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value) {
            const d = dashRes.value;
            const stats = d.stats || d;

            const paymentsEl = document.getElementById("reportTotalPayments");
            const salesEl = document.getElementById("reportTotalSales");
            const farmersEl = document.getElementById("reportActiveFarmers");
            const mspEl = document.getElementById("reportMspCompliance");

            const totalPayments = stats.totalPayments || d.totalPayments || d.paymentsCount || 0;
            const totalSales = stats.totalSales || d.totalRevenue || d.revenue || 0;
            const activeFarmers = stats.totalFarmers || d.totalFarmers || 0;
            const msp = stats.mspCompliance || d.mspCompliance || 100;

            if (paymentsEl) paymentsEl.textContent = totalPayments;
            if (salesEl) salesEl.textContent = "₹" + Number(totalSales).toLocaleString("en-IN");
            if (farmersEl) farmersEl.textContent = activeFarmers;
            if (mspEl) mspEl.textContent = Number(msp).toFixed(1) + "%";
        }

        let payments = [];
        if (paymentsRes.status === "fulfilled" && paymentsRes.value) {
            const data = paymentsRes.value;
            payments = Array.isArray(data)
                ? data
                : (Array.isArray(data.items)
                    ? data.items
                    : (Array.isArray(data.data) ? data.data : []));
        }

        allReportRecords = payments;
        renderReportCards(payments);
    } catch (err) {
        console.error("Error loading admin reports:", err);
        container.innerHTML = `
            <div class="empty-state-card" style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-file-invoice" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Report Records</h3>
                <p style="color:#777; font-size:13px; margin:0;">No transaction or settlement reports currently recorded.</p>
            </div>
        `;
    }
}

function renderReportCards(items) {
    const container = document.getElementById("adminReportsContainer");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-file-invoice" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Generated Reports Available</h3>
                <p style="color:#777; font-size:13px; margin:0;">No transactions or settlement reports recorded for this period.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "report-card";
        card.style.cssText = "background:#fff; border:1px solid #e1e8e2; border-radius:10px; padding:18px 22px; margin-bottom:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;";

        const pId = item.id ? `TX-${item.id.slice(0, 6).toUpperCase()}` : "TX-000000";
        const farmerName = item.farmer?.name || item.farmerName || "Farmer";
        const buyerName = item.buyer?.buyerProfile?.businessName || item.buyer?.name || item.buyerName || "Buyer";
        const amt = Number(item.amount || item.totalAmount || 0);
        const status = (item.status || "COMPLETED").toUpperCase();

        let statusClass = "status success";
        if (["FAILED", "CANCELLED"].includes(status)) statusClass = "status danger";
        else if (status === "PENDING") statusClass = "status pending";

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                    <strong style="color:#176b38; font-size:15px;">#${escapeHTML(pId)}</strong>
                    <span class="${statusClass}" style="text-transform:capitalize;">${escapeHTML(status.toLowerCase())}</span>
                </div>
                <p style="margin:0; font-size:14px; color:#222; font-weight:600;">Settlement Value: ₹${amt.toLocaleString("en-IN")}</p>
                <p style="margin:4px 0 0; font-size:12px; color:#666;">Farmer: <strong>${escapeHTML(farmerName)}</strong> &bull; Buyer: <strong>${escapeHTML(buyerName)}</strong> &bull; Date: ${formatDate(item.createdAt)}</p>
            </div>
            <div>
                <button type="button" class="download-btn" onclick="viewReportDetails('${item.id}')" style="background:#176b38; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                    View
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function setupReportControls() {
    const filterBtn = document.querySelector(".filter-btn");
    const reportType = document.getElementById("reportType");

    if (filterBtn) {
        filterBtn.addEventListener("click", () => {
            const type = reportType ? reportType.value : "payments";
            loadAdminReports();
        });
    }
}

function viewReportDetails(id) {
    const item = allReportRecords.find((x) => x.id === id);
    if (!item) return;
    alert(`Transaction ${item.id}\nAmount: ₹${item.amount || 0}\nStatus: ${item.status || "Completed"}\nFarmer: ${item.farmer?.name || "Farmer"}\nBuyer: ${item.buyer?.name || "Buyer"}`);
}

function setupAdminLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await logoutUser();
            window.location.replace("../admin_login.html");
        });
    }
}

window.loadAdminReports = loadAdminReports;
window.viewReportDetails = viewReportDetails;
