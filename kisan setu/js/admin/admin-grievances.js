// ==================================================
// KISAN SETU - ADMIN GRIEVANCES MANAGEMENT
// File: js/admin/admin-grievances.js
// ==================================================

let allGrievances = [];

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

    loadAdminGrievances();
    setupGrievanceControls();
    setupAdminLogout();
});

async function loadAdminGrievances() {
    const container = document.getElementById("adminGrievancesContainer");
    const countBadge = document.getElementById("adminGrievanceCountBadge");
    const pageInfo = document.getElementById("adminGrievancePageInfo");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:32px; color:#666;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading grievances...
        </div>
    `;

    try {
        const res = await apiRequest("/grievances");
        const data = res || {};
        const items = Array.isArray(data)
            ? data
            : (Array.isArray(data.items)
                ? data.items
                : (Array.isArray(data.data) ? data.data : []));

        allGrievances = items;

        renderGrievanceCards(items);

        if (countBadge) {
            countBadge.textContent = `${items.length} grievance${items.length === 1 ? "" : "s"}`;
        }
        if (pageInfo) {
            pageInfo.textContent = `Showing ${items.length} grievance${items.length === 1 ? "" : "s"}`;
        }
    } catch (err) {
        console.error("Error loading grievances:", err);
        container.innerHTML = `
            <div class="empty-state-card" style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-circle-check" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Grievances Found</h3>
                <p style="color:#777; font-size:13px; margin:0;">All citizen and farmer grievances are resolved or none have been submitted.</p>
            </div>
        `;
        if (countBadge) countBadge.textContent = "0 grievances";
        if (pageInfo) pageInfo.textContent = "Showing 0 grievances";
    }
}

function renderGrievanceCards(items) {
    const container = document.getElementById("adminGrievancesContainer");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-circle-check" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Grievances Found</h3>
                <p style="color:#777; font-size:13px; margin:0;">All citizen and farmer grievances are resolved or none have been submitted.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "grievance-card";
        card.style.cssText = "background:#fff; border:1px solid #e1e8e2; border-radius:10px; padding:18px 22px; margin-bottom:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;";

        const grvId = item.id ? `GRV-${item.id.slice(0, 5).toUpperCase()}` : "GRV-TICKET";
        const userName = item.user?.name || item.farmerName || item.buyerName || "Citizen / Farmer";
        const priority = (item.priority || "MEDIUM").toUpperCase();
        let priorityBg = "#ffedd5";
        let priorityColor = "#c2410c";
        if (priority === "HIGH") {
            priorityBg = "#fee2e2";
            priorityColor = "#b91c1c";
        } else if (priority === "LOW") {
            priorityBg = "#f1f5f9";
            priorityColor = "#475569";
        }

        const status = (item.status || "PENDING").toUpperCase();
        let statusClass = "pending";
        if (status === "RESOLVED") statusClass = "approved";
        else if (status === "IN_PROGRESS" || status === "PROGRESS") statusClass = "progress";
        else if (status === "REJECTED") statusClass = "rejected";

        const subject = item.subject || item.title || item.reason || "General Grievance Issue";
        const type = item.type || item.category || "General";

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <strong style="color:#176b38; font-size:15px;">#${escapeHTML(grvId)}</strong>
                    <span style="font-size:11px; font-weight:600; padding:3px 8px; border-radius:10px; background:${priorityBg}; color:${priorityColor};">${escapeHTML(priority)}</span>
                    <span class="status ${statusClass}" style="text-transform:capitalize;">${escapeHTML(status.toLowerCase().replace(/_/g, " "))}</span>
                </div>
                <p style="margin:0; font-size:14px; color:#222; font-weight:600;">${escapeHTML(subject)}</p>
                <p style="margin:4px 0 0; font-size:12px; color:#666;">Submitted by: <strong>${escapeHTML(userName)}</strong> &bull; Type: ${escapeHTML(type)} &bull; Date: ${formatDate(item.createdAt)}</p>
            </div>
            <div>
                <button type="button" class="view-btn" onclick="viewAdminGrievance('${item.id}')" style="background:#176b38; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-size:12px; cursor:pointer;">
                    View Details
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function setupGrievanceControls() {
    const filterBtn = document.querySelector(".filter-btn");
    const searchInput = document.getElementById("searchGrievance");
    const statusFilter = document.getElementById("statusFilter");
    const typeFilter = document.getElementById("typeFilter");

    function applyFilter() {
        const q = (searchInput?.value || "").toLowerCase().trim();
        const statusVal = (statusFilter?.value || "all").toLowerCase().trim();
        const typeVal = (typeFilter?.value || "all").toLowerCase().trim();

        const filtered = allGrievances.filter((item) => {
            const subject = (item.subject || item.title || item.reason || "").toLowerCase();
            const user = (item.user?.name || item.farmerName || "").toLowerCase();
            const id = (item.id || "").toLowerCase();
            const status = (item.status || "").toLowerCase();
            const type = (item.type || item.category || "").toLowerCase();

            const matchQ = !q || subject.includes(q) || user.includes(q) || id.includes(q);
            const matchStatus = statusVal === "all" || status.includes(statusVal);
            const matchType = typeVal === "all" || type.includes(typeVal);

            return matchQ && matchStatus && matchType;
        });

        renderGrievanceCards(filtered);
    }

    if (filterBtn) filterBtn.addEventListener("click", applyFilter);
    if (searchInput) searchInput.addEventListener("input", applyFilter);
    if (statusFilter) statusFilter.addEventListener("change", applyFilter);
    if (typeFilter) typeFilter.addEventListener("change", applyFilter);
}

function viewAdminGrievance(id) {
    const item = allGrievances.find((x) => x.id === id);
    if (!item) return;
    alert(`Grievance: ${item.subject || item.title || "Grievance"}\nSubmitted by: ${item.user?.name || "Citizen"}\nStatus: ${item.status || "Pending"}\nDescription: ${item.description || item.reason || "N/A"}`);
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

window.loadAdminGrievances = loadAdminGrievances;
window.viewAdminGrievance = viewAdminGrievance;
