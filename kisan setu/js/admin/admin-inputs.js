// ==================================================
// KISAN SETU - ADMIN INPUT MANAGEMENT
// File: js/admin/admin-inputs.js
// ==================================================

let allInputRequests = [];

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

    loadAdminInputs();
    setupInputControls();
    setupAdminLogout();
});

async function loadAdminInputs() {
    const container = document.getElementById("adminInputsContainer");
    const pageInfo = document.getElementById("adminInputsPageInfo");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:32px; color:#666;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading input requests...
        </div>
    `;

    try {
        const [inputsRes, dashRes] = await Promise.allSettled([
            apiRequest("/inputs"),
            getAdminDashboard()
        ]);

        let items = [];
        if (inputsRes.status === "fulfilled" && inputsRes.value) {
            const data = inputsRes.value;
            items = Array.isArray(data)
                ? data
                : (Array.isArray(data.items)
                    ? data.items
                    : (Array.isArray(data.data) ? data.data : []));
        }

        allInputRequests = items;

        // Dynamic stats
        const pendingCount = items.filter((i) => String(i.status || "").toUpperCase() === "PENDING").length;
        const approvedCount = items.filter((i) => String(i.status || "").toUpperCase() === "APPROVED").length;
        const deliveredCount = items.filter((i) => String(i.status || "").toUpperCase() === "DELIVERED").length;

        const totalEl = document.getElementById("adminInputsTotal");
        const pendingEl = document.getElementById("adminInputsPending");
        const approvedEl = document.getElementById("adminInputsApproved");
        const deliveredEl = document.getElementById("adminInputsDelivered");

        if (totalEl) totalEl.textContent = items.length;
        if (pendingEl) pendingEl.textContent = pendingCount;
        if (approvedEl) approvedEl.textContent = approvedCount;
        if (deliveredEl) deliveredEl.textContent = deliveredCount;

        renderInputCards(items);

        if (pageInfo) {
            pageInfo.textContent = `Showing ${items.length} request${items.length === 1 ? "" : "s"}`;
        }
    } catch (err) {
        console.error("Error loading inputs:", err);
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #e0eae2; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-seedling" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Input Requests</h3>
                <p style="color:#777; font-size:13px; margin:0;">There are currently no agricultural input requests from farmers.</p>
            </div>
        `;
    }
}

function renderInputCards(items) {
    const container = document.getElementById("adminInputsContainer");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-seedling" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Input Requests Found</h3>
                <p style="color:#777; font-size:13px; margin:0;">There are currently no input distribution requests recorded.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "input-card";
        card.style.cssText = "background:#fff; border:1px solid #e1e8e2; border-radius:10px; padding:18px 22px; margin-bottom:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;";

        const reqId = item.id ? `INP-${item.id.slice(0, 5).toUpperCase()}` : "INP-REQ";
        const farmerName = item.farmer?.name || item.farmerName || "Registered Farmer";
        const status = (item.status || "PENDING").toUpperCase();
        let statusClass = "pending";
        if (status === "APPROVED") statusClass = "approved";
        else if (status === "DELIVERED") statusClass = "delivered";
        else if (status === "REJECTED") statusClass = "rejected";

        const inputName = item.inputType || item.productName || item.name || "Agricultural Input";
        const qty = item.quantity ? `${item.quantity} ${item.unit || "Unit"}` : "Standard Pack";

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                    <strong style="color:#176b38; font-size:15px;">#${escapeHTML(reqId)}</strong>
                    <span class="status ${statusClass}" style="text-transform:capitalize;">${escapeHTML(status.toLowerCase())}</span>
                </div>
                <p style="margin:0; font-size:14px; color:#222; font-weight:600;">${escapeHTML(inputName)} &bull; ${escapeHTML(qty)}</p>
                <p style="margin:4px 0 0; font-size:12px; color:#666;">Requested by: <strong>${escapeHTML(farmerName)}</strong> &bull; Date: ${formatDate(item.createdAt)}</p>
            </div>
            <div>
                <button type="button" class="action-btn" onclick="reviewAdminInput('${item.id}')" style="background:#176b38; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                    Review
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function setupInputControls() {
    const filterBtn = document.querySelector(".filter-btn");
    const searchInput = document.getElementById("searchInput");
    const inputType = document.getElementById("inputType");
    const statusFilter = document.getElementById("statusFilter");

    function applyFilter() {
        const q = (searchInput?.value || "").toLowerCase().trim();
        const typeVal = (inputType?.value || "all").toLowerCase().trim();
        const statusVal = (statusFilter?.value || "all").toLowerCase().trim();

        const filtered = allInputRequests.filter((item) => {
            const name = (item.inputType || item.productName || item.name || "").toLowerCase();
            const farmer = (item.farmer?.name || item.farmerName || "").toLowerCase();
            const id = (item.id || "").toLowerCase();
            const status = (item.status || "").toLowerCase();

            const matchQ = !q || name.includes(q) || farmer.includes(q) || id.includes(q);
            const matchType = typeVal === "all" || name.includes(typeVal);
            const matchStatus = statusVal === "all" || status.includes(statusVal);

            return matchQ && matchType && matchStatus;
        });

        renderInputCards(filtered);
    }

    if (filterBtn) filterBtn.addEventListener("click", applyFilter);
    if (searchInput) searchInput.addEventListener("input", applyFilter);
    if (inputType) inputType.addEventListener("change", applyFilter);
    if (statusFilter) statusFilter.addEventListener("change", applyFilter);
}

function reviewAdminInput(id) {
    const item = allInputRequests.find((x) => x.id === id);
    if (!item) return;
    alert(`Input Request: ${item.inputType || item.name || "Input"}\nQuantity: ${item.quantity || "1"}\nStatus: ${item.status || "Pending"}`);
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

window.loadAdminInputs = loadAdminInputs;
window.reviewAdminInput = reviewAdminInput;
