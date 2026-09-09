// ============================================
// KISAN SETU - BUYER ORDER HISTORY
// File: js/buyer/history.js
// ============================================

let currentBuyerHistoryPage = 1;
const buyerHistoryPageLimit = 10;

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

document.addEventListener("DOMContentLoaded", function () {
    loadBuyerHistory();
    setupBuyerHistoryControls();
    setupBuyerHistoryModal();
    setupLogout();
});

async function loadBuyerHistory(page = 1) {
    currentBuyerHistoryPage = page;
    const container = document.getElementById("historyContainer");
    const pageNumber = document.getElementById("pageNumber");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:32px; color:#666;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading order history...
        </div>
    `;

    const statusFilter = document.getElementById("statusFilter");
    const statusVal = statusFilter ? statusFilter.value : "ALL";

    try {
        let path = `/orders?page=${currentBuyerHistoryPage}&limit=${buyerHistoryPageLimit}`;
        if (statusVal && statusVal !== "ALL") {
            path += `&status=${encodeURIComponent(statusVal)}`;
        }

        const data = await apiRequest(path);
        const list = Array.isArray(data)
            ? data
            : (Array.isArray(data.data)
                ? data.data
                : (Array.isArray(data.items)
                    ? data.items
                    : (Array.isArray(data.orders) ? data.orders : [])));

        if (!list.length) {
            container.innerHTML = `
                <div class="no-orders" style="background:#fff; border:1px solid #e0eae2; border-radius:10px; padding:36px; text-align:center;">
                    <i class="fa-solid fa-clock-rotate-left" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                    <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Order History Found</h3>
                    <p style="color:#777; font-size:13px; margin:0;">You have no completed or past orders under this filter.</p>
                </div>
            `;
            if (pageNumber) pageNumber.textContent = `Page ${currentBuyerHistoryPage}`;
            return;
        }

        container.innerHTML = "";
        list.forEach((order) => {
            const card = document.createElement("div");
            card.className = "history-card";
            card.style.cssText = "background:#fff; border:1px solid #e0eae2; border-radius:10px; padding:20px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.03);";

            const orderNum = order.orderNumber || (order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : "N/A");
            const farmerName = order.farmer?.name || order.farmerName || "Farmer";
            const amount = Number(order.totalAmount ?? order.amount ?? 0);
            const status = order.status || "COMPLETED";

            let statusColor = "#166534";
            let statusBg = "#dcfce7";
            if (["CANCELLED", "REJECTED"].includes(status)) {
                statusColor = "#991b1b";
                statusBg = "#fee2e2";
            } else if (status === "DISPUTED") {
                statusColor = "#9a3412";
                statusBg = "#ffedd5";
            }

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                    <h3 style="margin:0; font-size:16px; color:#176b38;">Order ${escapeHTML(orderNum)}</h3>
                    <span style="font-size:12px; font-weight:600; padding:4px 10px; border-radius:12px; background:${statusBg}; color:${statusColor};">
                        ${escapeHTML(status)}
                    </span>
                </div>
                <p style="margin:4px 0; font-size:13px; color:#444;"><strong>Farmer:</strong> ${escapeHTML(farmerName)}</p>
                <p style="margin:4px 0; font-size:13px; color:#444;"><strong>Total Amount:</strong> ₹${amount.toLocaleString("en-IN")}</p>
                <p style="margin:4px 0; font-size:13px; color:#777;"><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
                <div style="margin-top:12px;">
                    <button type="button" class="view-btn" onclick="showBuyerHistoryModal('${order.id}')" style="background:#176b38; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer;">
                        View Details
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        if (pageNumber) pageNumber.textContent = `Page ${currentBuyerHistoryPage}`;
    } catch (error) {
        console.error("Buyer order history loading error:", error);
        container.innerHTML = `
            <div class="status-card status-card-error" style="background:#fef2f2; border:1px solid #fee2e2; border-radius:10px; padding:20px; color:#991b1b;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>
                Unable to load history: ${escapeHTML(error.message || "Server error")}
            </div>
        `;
    }
}

function setupBuyerHistoryControls() {
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", () => loadBuyerHistory(1));
    }

    const refreshBtn = document.getElementById("refreshHistoryBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => loadBuyerHistory(1));
    }

    const prevBtn = document.getElementById("previousBtn");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentBuyerHistoryPage > 1) loadBuyerHistory(currentBuyerHistoryPage - 1);
        });
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            loadBuyerHistory(currentBuyerHistoryPage + 1);
        });
    }
}

function setupBuyerHistoryModal() {
    const closeBtn = document.getElementById("closeModalBtn");
    const modal = document.getElementById("historyModal");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
        window.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }
}

async function showBuyerHistoryModal(orderId) {
    const modal = document.getElementById("historyModal");
    const details = document.getElementById("historyDetails");
    if (!modal || !details) return;

    modal.style.display = "block";
    details.innerHTML = `<p style="padding:20px; text-align:center;">Loading order details...</p>`;

    try {
        const order = await apiRequest(`/orders/${encodeURIComponent(orderId)}`);
        details.innerHTML = `
            <p><strong>Order ID:</strong> ${escapeHTML(order.orderNumber || order.id)}</p>
            <p><strong>Status:</strong> ${escapeHTML(order.status || "N/A")}</p>
            <p><strong>Total Amount:</strong> ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
            <p><strong>Payment Status:</strong> ${escapeHTML(order.paymentStatus || "N/A")}</p>
            <p><strong>Farmer:</strong> ${escapeHTML(order.farmer?.name || "Verified Farmer")}</p>
            <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
        `;
    } catch (e) {
        details.innerHTML = `<p style="color:#ba3d32;">Failed to load details: ${escapeHTML(e.message)}</p>`;
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await logoutUser();
            window.location.replace("../buyer_login.html");
        });
    }
}

window.loadBuyerHistory = loadBuyerHistory;
window.showBuyerHistoryModal = showBuyerHistoryModal;
window.getBuyerOrderHistory = async function (params = {}) {
    return apiRequest(`/orders${queryString({ ...params, status: "COMPLETED" })}`);
};
