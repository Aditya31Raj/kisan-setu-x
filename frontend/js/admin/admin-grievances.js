// ==================================================
// KISAN SETU - ADMIN DISPUTES & GRIEVANCES REDRESSAL
// File: js/admin/admin-grievances.js
// ==================================================

let allDisputes = [];
let allGrievances = [];
let activeTab = "disputes";
let currentModalItem = null;
let currentModalType = null; // 'dispute' | 'grievance'

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
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatCurrency(num) {
    if (num === undefined || num === null || isNaN(Number(num))) return "--";
    return "₹" + Number(num).toLocaleString("en-IN");
}

document.addEventListener("DOMContentLoaded", async function () {
    const user = await ensureAdminAuth();
    if (!user) return;

    // Set profile info if elements exist
    const nameElem = document.getElementById("adminProfileName");
    const roleElem = document.getElementById("adminProfileRole");
    if (nameElem) nameElem.textContent = user.name || "Admin";
    if (roleElem) roleElem.textContent = user.role === "SUPER_ADMIN" ? "Super Admin" : "Prakhand Admin";

    setupTabs();
    setupFilters();
    setupAdminLogout();

    // Initial load
    loadDisputes();
    loadGrievances();
});

// ============================================
// TAB NAVIGATION
// ============================================
function setupTabs() {
    const tabDisputesBtn = document.getElementById("tabDisputesBtn");
    const tabGrievancesBtn = document.getElementById("tabGrievancesBtn");
    const disputesPanel = document.getElementById("disputesPanel");
    const grievancesPanel = document.getElementById("grievancesPanel");

    if (tabDisputesBtn && tabGrievancesBtn) {
        tabDisputesBtn.addEventListener("click", () => {
            activeTab = "disputes";
            tabDisputesBtn.classList.add("active");
            tabGrievancesBtn.classList.remove("active");
            if (disputesPanel) disputesPanel.style.display = "block";
            if (grievancesPanel) grievancesPanel.style.display = "none";
        });

        tabGrievancesBtn.addEventListener("click", () => {
            activeTab = "grievances";
            tabGrievancesBtn.classList.add("active");
            tabDisputesBtn.classList.remove("active");
            if (disputesPanel) disputesPanel.style.display = "none";
            if (grievancesPanel) grievancesPanel.style.display = "block";
        });
    }
}

// ============================================
// LOAD DISPUTES (GET /api/v1/disputes)
// ============================================
async function loadDisputes() {
    const container = document.getElementById("adminDisputesContainer");
    const badge = document.getElementById("adminDisputeCountBadge");
    const pill = document.getElementById("disputeCountPill");
    const pageInfo = document.getElementById("adminDisputePageInfo");

    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:32px; color:#666;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading order disputes...
        </div>
    `;

    try {
        const res = await apiRequest("/disputes");
        const data = res || {};
        const items = Array.isArray(data)
            ? data
            : (Array.isArray(data.items)
                ? data.items
                : (Array.isArray(data.data) ? data.data : []));

        allDisputes = items;

        const openCount = items.filter(d => (d.status || "").toUpperCase() === "OPEN").length;
        if (pill) pill.textContent = openCount;
        if (badge) badge.textContent = `${items.length} dispute${items.length === 1 ? "" : "s"} (${openCount} open)`;
        if (pageInfo) pageInfo.textContent = `Showing ${items.length} dispute${items.length === 1 ? "" : "s"}`;

        renderDisputes(items);
    } catch (err) {
        console.error("Error loading disputes:", err);
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:32px; color:#ba3d32; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:16px; margin-bottom:6px;">Unable to load disputes</h3>
                <p style="color:#777; font-size:13px; margin:0;">Could not retrieve trade disputes from server.</p>
            </div>
        `;
        if (badge) badge.textContent = "Error loading";
    }
}

function renderDisputes(items) {
    const container = document.getElementById("adminDisputesContainer");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-circle-check" style="font-size:32px; color:#16863b; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:16px; margin-bottom:6px;">No Trade Disputes Found</h3>
                <p style="color:#777; font-size:13px; margin:0;">There are no active order disputes between buyers and farmers.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("div");
        card.style.cssText = "background:#fff; border:1px solid #e1e8e2; border-radius:10px; padding:18px 22px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;";

        const disputeId = item.id ? `DSP-${item.id.slice(0, 6).toUpperCase()}` : "DSP-ORDER";
        const orderNum = item.order?.orderNumber || (item.orderId ? `#${item.orderId.slice(0, 8)}` : "Order");
        const orderAmount = formatCurrency(item.order?.totalAmount);

        const creatorName = item.creator?.name || "User";
        const creatorRole = (item.creator?.role || "BUYER").toLowerCase();
        const creatorPhone = item.creator?.phone || "";

        const farmerName = item.order?.farmer?.name || "Farmer";
        const farmerPhone = item.order?.farmer?.phone || "";
        const buyerName = item.order?.buyer?.name || "Buyer";
        const buyerPhone = item.order?.buyer?.phone || "";

        const cropItems = (item.order?.items || []).map(i => i.produce?.cropName).filter(Boolean).join(", ") || "Agricultural Produce";

        const status = (item.status || "OPEN").toUpperCase();
        let statusClass = "open";
        if (status === "RESOLVED") statusClass = "resolved";
        else if (status === "IN_REVIEW") statusClass = "progress";
        else if (status === "REJECTED") statusClass = "rejected";

        const reason = item.reason || "Dispute raised regarding order";

        card.innerHTML = `
            <div style="flex:1; min-width:280px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
                    <strong style="color:#16863b; font-size:15px;">#${escapeHTML(disputeId)}</strong>
                    <span class="status ${statusClass}">${escapeHTML(status.replace(/_/g, " "))}</span>
                    <span style="font-size:12px; color:#555; background:#f0f4f1; padding:2px 8px; border-radius:6px;">
                        Order: <strong>${escapeHTML(orderNum)}</strong> (${escapeHTML(orderAmount)})
                    </span>
                    <span style="font-size:11px; color:#888;">${formatDate(item.createdAt)}</span>
                </div>

                <div style="font-size:13px; color:#333; margin-bottom:8px;">
                    <strong>Produce:</strong> ${escapeHTML(cropItems)} &bull;
                    <strong>Raised by:</strong> <span class="role-badge ${creatorRole}">${escapeHTML(creatorRole)}</span> <strong>${escapeHTML(creatorName)}</strong> ${creatorPhone ? `(${escapeHTML(creatorPhone)})` : ""}
                </div>

                <div style="font-size:12px; color:#666; background:#f9fbf9; border-left:3px solid #16863b; padding:8px 12px; border-radius:4px; margin-bottom:6px;">
                    <strong>Dispute Reason:</strong> "${escapeHTML(reason)}"
                </div>

                <div style="font-size:11px; color:#777;">
                    Buyer: <strong>${escapeHTML(buyerName)}</strong> (${escapeHTML(buyerPhone || "N/A")}) &harr;
                    Farmer: <strong>${escapeHTML(farmerName)}</strong> (${escapeHTML(farmerPhone || "N/A")})
                    ${item.resolution ? `<br><span style="color:#16863b; font-weight:600;">Resolution: ${escapeHTML(item.resolution)}</span>` : ""}
                </div>
            </div>

            <div style="align-self:center;">
                <button type="button" class="view-btn" onclick="openDisputeModal('${item.id}')">
                    <i class="fa-solid fa-gavel"></i> Review & Mediate
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// ============================================
// LOAD GRIEVANCES (GET /api/v1/grievances)
// ============================================
async function loadGrievances() {
    const container = document.getElementById("adminGrievancesContainer");
    const badge = document.getElementById("adminGrievanceCountBadge");
    const pill = document.getElementById("grievanceCountPill");
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

        const openCount = items.filter(g => (g.status || "").toUpperCase() === "OPEN" || (g.status || "").toUpperCase() === "PENDING").length;
        if (pill) pill.textContent = openCount;
        if (badge) badge.textContent = `${items.length} grievance${items.length === 1 ? "" : "s"} (${openCount} open)`;
        renderGrievances(items);

        // Handle URL deep linking (e.g. from requests.html)
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get("id");
        const searchQ = urlParams.get("search") || urlParams.get("q");
        if (targetId) {
            const found = items.find(x => x.id === targetId || (x.id && x.id.toLowerCase().includes(targetId.toLowerCase())));
            if (found) {
                const tabGrievancesBtn = document.getElementById("tabGrievancesBtn");
                if (tabGrievancesBtn) tabGrievancesBtn.click();
                renderGrievances([found]);
                openGrievanceModal(found.id);
            }
        } else if (searchQ && document.getElementById("searchGrievance")) {
            const tabGrievancesBtn = document.getElementById("tabGrievancesBtn");
            if (tabGrievancesBtn) tabGrievancesBtn.click();
            document.getElementById("searchGrievance").value = searchQ;
            const filterGrievancesBtn = document.getElementById("filterGrievancesBtn");
            if (filterGrievancesBtn) filterGrievancesBtn.click();
        }
    } catch (err) {
        console.error("Error loading grievances:", err);
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:32px; color:#ba3d32; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:16px; margin-bottom:6px;">Unable to load grievances</h3>
                <p style="color:#777; font-size:13px; margin:0;">Could not retrieve citizen complaints from server.</p>
            </div>
        `;
        if (badge) badge.textContent = "Error loading";
    }
}

function renderGrievances(items) {
    const container = document.getElementById("adminGrievancesContainer");
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #c8d8cb; border-radius:10px; padding:36px; text-align:center;">
                <i class="fa-solid fa-circle-check" style="font-size:32px; color:#16863b; margin-bottom:12px; display:block;"></i>
                <h3 style="color:#202522; font-size:16px; margin-bottom:6px;">No Grievances Found</h3>
                <p style="color:#777; font-size:13px; margin:0;">All citizen and farmer complaints are resolved.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("div");
        card.style.cssText = "background:#fff; border:1px solid #e1e8e2; border-radius:10px; padding:18px 22px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;";

        const grvId = item.id ? `GRV-${item.id.slice(0, 6).toUpperCase()}` : "GRV-TICKET";
        const userName = item.creator?.name || item.user?.name || item.farmerName || "Citizen / Farmer";
        const userPhone = item.creator?.phone || "";
        const userRole = (item.creator?.role || "CITIZEN").toLowerCase();

        const priority = (item.priority || "MEDIUM").toUpperCase();
        let priorityBg = "#ffedd5";
        let priorityColor = "#c2410c";
        if (priority === "HIGH" || priority === "CRITICAL") {
            priorityBg = "#fee2e2";
            priorityColor = "#b91c1c";
        } else if (priority === "LOW") {
            priorityBg = "#f1f5f9";
            priorityColor = "#475569";
        }

        const status = (item.status || "PENDING").toUpperCase();
        let statusClass = "pending";
        if (status === "RESOLVED") statusClass = "resolved";
        else if (status === "IN_PROGRESS" || status === "PROGRESS" || status === "IN_REVIEW") statusClass = "progress";
        else if (status === "REJECTED") statusClass = "rejected";

        const subject = item.subject || item.title || "Grievance Issue";
        const category = item.category || item.type || "General";
        const description = item.description || item.reason || "N/A";

        card.innerHTML = `
            <div style="flex:1; min-width:280px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
                    <strong style="color:#16863b; font-size:15px;">#${escapeHTML(grvId)}</strong>
                    <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; background:${priorityBg}; color:${priorityColor};">${escapeHTML(priority)}</span>
                    <span class="status ${statusClass}">${escapeHTML(status.replace(/_/g, " "))}</span>
                    <span style="font-size:12px; color:#555; background:#f0f4f1; padding:2px 8px; border-radius:6px;">
                        Category: <strong>${escapeHTML(category)}</strong>
                    </span>
                    <span style="font-size:11px; color:#888;">${formatDate(item.createdAt)}</span>
                </div>

                <p style="margin:0 0 6px; font-size:14px; color:#222; font-weight:600;">${escapeHTML(subject)}</p>

                <div style="font-size:12px; color:#555; background:#f9fbf9; border-left:3px solid #0369a1; padding:8px 12px; border-radius:4px; margin-bottom:6px;">
                    ${escapeHTML(description)}
                </div>

                <p style="margin:4px 0 0; font-size:12px; color:#666;">
                    Submitted by: <span class="role-badge ${userRole}">${escapeHTML(userRole)}</span> <strong>${escapeHTML(userName)}</strong> ${userPhone ? `(${escapeHTML(userPhone)})` : ""}
                    ${item.resolution ? `<br><span style="color:#16863b; font-weight:600;">Resolution: ${escapeHTML(item.resolution)}</span>` : ""}
                </p>
            </div>

            <div style="align-self:center;">
                <button type="button" class="view-btn" onclick="openGrievanceModal('${item.id}')">
                    <i class="fa-solid fa-file-pen"></i> Review & Action
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// ============================================
// FILTERING & SEARCH
// ============================================
function setupFilters() {
    // Disputes filter
    const filterDisputesBtn = document.getElementById("filterDisputesBtn");
    const searchDispute = document.getElementById("searchDispute");
    const disputeStatusFilter = document.getElementById("disputeStatusFilter");
    const disputeRoleFilter = document.getElementById("disputeRoleFilter");

    function applyDisputeFilter() {
        const q = (searchDispute?.value || "").toLowerCase().trim();
        const st = (disputeStatusFilter?.value || "all").toLowerCase();
        const ro = (disputeRoleFilter?.value || "all").toLowerCase();

        const filtered = allDisputes.filter((item) => {
            const disputeId = (item.id || "").toLowerCase();
            const orderId = (item.orderId || item.order?.orderNumber || "").toLowerCase();
            const reason = (item.reason || "").toLowerCase();
            const buyer = (item.order?.buyer?.name || "").toLowerCase();
            const farmer = (item.order?.farmer?.name || "").toLowerCase();
            const creator = (item.creator?.name || "").toLowerCase();
            const creatorRole = (item.creator?.role || "").toLowerCase();
            const status = (item.status || "").toLowerCase();

            const matchQ = !q || disputeId.includes(q) || orderId.includes(q) || reason.includes(q) || buyer.includes(q) || farmer.includes(q) || creator.includes(q);
            const matchSt = st === "all" || status === st;
            const matchRo = ro === "all" || creatorRole === ro;

            return matchQ && matchSt && matchRo;
        });

        renderDisputes(filtered);
        const pageInfo = document.getElementById("adminDisputePageInfo");
        if (pageInfo) pageInfo.textContent = `Showing ${filtered.length} of ${allDisputes.length} disputes`;
    }

    if (filterDisputesBtn) filterDisputesBtn.addEventListener("click", applyDisputeFilter);
    if (searchDispute) searchDispute.addEventListener("input", applyDisputeFilter);
    if (disputeStatusFilter) disputeStatusFilter.addEventListener("change", applyDisputeFilter);
    if (disputeRoleFilter) disputeRoleFilter.addEventListener("change", applyDisputeFilter);

    // Grievances filter
    const filterGrievancesBtn = document.getElementById("filterGrievancesBtn");
    const searchGrievance = document.getElementById("searchGrievance");
    const statusFilter = document.getElementById("statusFilter");
    const typeFilter = document.getElementById("typeFilter");

    function applyGrievanceFilter() {
        const q = (searchGrievance?.value || "").toLowerCase().trim();
        const st = (statusFilter?.value || "all").toLowerCase();
        const cat = (typeFilter?.value || "all").toLowerCase();

        const filtered = allGrievances.filter((item) => {
            const id = (item.id || "").toLowerCase();
            const subject = (item.subject || item.title || "").toLowerCase();
            const user = (item.creator?.name || item.user?.name || "").toLowerCase();
            const description = (item.description || item.reason || "").toLowerCase();
            const category = (item.category || item.type || "").toLowerCase();
            const status = (item.status || "").toLowerCase();

            const matchQ = !q || id.includes(q) || subject.includes(q) || user.includes(q) || description.includes(q);
            const matchSt = st === "all" || status.includes(st);
            const matchCat = cat === "all" || category.includes(cat);

            return matchQ && matchSt && matchCat;
        });

        renderGrievances(filtered);
        const pageInfo = document.getElementById("adminGrievancePageInfo");
        if (pageInfo) pageInfo.textContent = `Showing ${filtered.length} of ${allGrievances.length} grievances`;
    }

    if (filterGrievancesBtn) filterGrievancesBtn.addEventListener("click", applyGrievanceFilter);
    if (searchGrievance) searchGrievance.addEventListener("input", applyGrievanceFilter);
    if (statusFilter) statusFilter.addEventListener("change", applyGrievanceFilter);
    if (typeFilter) typeFilter.addEventListener("change", applyGrievanceFilter);
}

// ============================================
// MODAL & RESOLUTION ACTIONS
// ============================================
function openDisputeModal(id) {
    const item = allDisputes.find(x => x.id === id);
    if (!item) return;

    currentModalItem = item;
    currentModalType = "dispute";

    const modal = document.getElementById("reviewModal");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");
    const note = document.getElementById("resolutionNoteInput");
    const errorMsg = document.getElementById("modalErrorMsg");

    if (errorMsg) errorMsg.style.display = "none";
    if (note) note.value = item.resolution || "";

    const disputeId = item.id ? `DSP-${item.id.slice(0, 8).toUpperCase()}` : "Dispute";
    const orderNum = item.order?.orderNumber || (item.orderId ? `#${item.orderId.slice(0, 8)}` : "Order");
    const totalAmount = formatCurrency(item.order?.totalAmount);
    const cropItems = (item.order?.items || []).map(i => `${i.produce?.cropName || "Produce"} (${i.quantity} ${i.unit || "kg"})`).join(", ") || "Agricultural Produce";

    const creatorRole = item.creator?.role || "BUYER";
    const creatorName = item.creator?.name || "User";
    const creatorPhone = item.creator?.phone || "N/A";

    const buyerName = item.order?.buyer?.name || "Buyer";
    const buyerPhone = item.order?.buyer?.phone || "N/A";
    const farmerName = item.order?.farmer?.name || "Farmer";
    const farmerPhone = item.order?.farmer?.phone || "N/A";

    title.innerHTML = `<i class="fa-solid fa-scale-balanced" style="color:#16863b;"></i> Mediate Order Dispute: #${escapeHTML(disputeId)}`;

    body.innerHTML = `
        <div style="background:#f8faf8; border:1px solid #e1e8e2; border-radius:8px; padding:14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span><strong>Order Reference:</strong> ${escapeHTML(orderNum)}</span>
                <span style="color:#16863b; font-weight:700;">${escapeHTML(totalAmount)}</span>
            </div>
            <div style="font-size:12px; color:#555; margin-bottom:6px;">
                <strong>Items:</strong> ${escapeHTML(cropItems)}
            </div>
            <div style="font-size:12px; color:#555;">
                <strong>Buyer:</strong> ${escapeHTML(buyerName)} (${escapeHTML(buyerPhone)}) &bull;
                <strong>Farmer:</strong> ${escapeHTML(farmerName)} (${escapeHTML(farmerPhone)})
            </div>
        </div>

        <div style="margin-bottom:14px;">
            <div style="font-size:12px; color:#666; margin-bottom:4px;">
                Dispute Raised By: <strong style="color:#202522;">${escapeHTML(creatorName)}</strong> (${escapeHTML(creatorRole)} - ${escapeHTML(creatorPhone)}) on ${formatDate(item.createdAt)}
            </div>
            <div style="font-size:13px; background:#fff8e6; border:1px solid #f2e3bc; border-radius:6px; padding:10px; color:#785400;">
                <strong>Reported Issue:</strong><br>
                ${escapeHTML(item.reason || "No explanation provided.")}
            </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <strong>Current Status:</strong>
            <span class="status ${(item.status || "OPEN").toLowerCase()}">${escapeHTML(item.status || "OPEN")}</span>
        </div>
    `;

    setupModalButtons();
    if (modal) modal.style.display = "flex";
}

function openGrievanceModal(id) {
    const item = allGrievances.find(x => x.id === id);
    if (!item) return;

    currentModalItem = item;
    currentModalType = "grievance";

    const modal = document.getElementById("reviewModal");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");
    const note = document.getElementById("resolutionNoteInput");
    const errorMsg = document.getElementById("modalErrorMsg");

    if (errorMsg) errorMsg.style.display = "none";
    if (note) note.value = item.resolution || "";

    const grvId = item.id ? `GRV-${item.id.slice(0, 8).toUpperCase()}` : "Grievance";
    const userName = item.creator?.name || item.user?.name || "Citizen";
    const userRole = item.creator?.role || "FARMER";
    const userPhone = item.creator?.phone || "N/A";

    title.innerHTML = `<i class="fa-solid fa-bullhorn" style="color:#16863b;"></i> Action on Grievance: #${escapeHTML(grvId)}`;

    body.innerHTML = `
        <div style="background:#f8faf8; border:1px solid #e1e8e2; border-radius:8px; padding:14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span><strong>Subject:</strong> ${escapeHTML(item.subject || item.title || "Complaint")}</span>
                <span style="font-size:11px; font-weight:700; color:#ba3d32;">Priority: ${escapeHTML(item.priority || "MEDIUM")}</span>
            </div>
            <div style="font-size:12px; color:#555;">
                <strong>Category:</strong> ${escapeHTML(item.category || item.type || "General")} &bull;
                <strong>Submitted:</strong> ${formatDate(item.createdAt)}
            </div>
            <div style="font-size:12px; color:#555; margin-top:4px;">
                <strong>Citizen:</strong> ${escapeHTML(userName)} (${escapeHTML(userRole)} - ${escapeHTML(userPhone)})
            </div>
        </div>

        <div style="margin-bottom:14px;">
            <div style="font-size:13px; background:#f0f7ff; border:1px solid #cfe2fe; border-radius:6px; padding:10px; color:#084298;">
                <strong>Complaint Details:</strong><br>
                ${escapeHTML(item.description || item.reason || "N/A")}
            </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <strong>Current Status:</strong>
            <span class="status ${(item.status || "PENDING").toLowerCase()}">${escapeHTML(item.status || "PENDING")}</span>
        </div>
    `;

    setupModalButtons();
    if (modal) modal.style.display = "flex";
}

function setupModalButtons() {
    const resolveBtn = document.getElementById("resolveBtn");
    const rejectBtn = document.getElementById("rejectBtn");

    if (resolveBtn) {
        resolveBtn.onclick = () => submitResolution("RESOLVED");
    }
    if (rejectBtn) {
        rejectBtn.onclick = () => submitResolution("REJECTED");
    }
}

async function submitResolution(newStatus) {
    if (!currentModalItem || !currentModalType) return;

    const noteInput = document.getElementById("resolutionNoteInput");
    const errorMsg = document.getElementById("modalErrorMsg");
    const resolveBtn = document.getElementById("resolveBtn");
    const rejectBtn = document.getElementById("rejectBtn");

    const note = (noteInput?.value || "").trim();

    if (note.length < 3) {
        if (errorMsg) {
            errorMsg.textContent = "Please provide an explanation or resolution note (minimum 3 characters).";
            errorMsg.style.display = "block";
        }
        return;
    }
    if (errorMsg) errorMsg.style.display = "none";

    // Disable buttons
    if (resolveBtn) resolveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;

    try {
        const endpoint = currentModalType === "dispute"
            ? `/disputes/${currentModalItem.id}/resolve`
            : `/grievances/${currentModalItem.id}/resolve`;

        await apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify({
                status: newStatus,
                resolution: note
            })
        });

        alert(`Successfully updated ${currentModalType} status to ${newStatus}!`);
        closeReviewModal();

        if (currentModalType === "dispute") {
            await loadDisputes();
        } else {
            await loadGrievances();
        }
    } catch (err) {
        console.error("Resolution submit error:", err);
        if (errorMsg) {
            errorMsg.textContent = err.message || "Failed to submit resolution. Please try again.";
            errorMsg.style.display = "block";
        }
    } finally {
        if (resolveBtn) resolveBtn.disabled = false;
        if (rejectBtn) rejectBtn.disabled = false;
    }
}

function closeReviewModal() {
    const modal = document.getElementById("reviewModal");
    if (modal) modal.style.display = "none";
    currentModalItem = null;
    currentModalType = null;
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

// Global exposure for inline HTML event handlers
window.openDisputeModal = openDisputeModal;
window.openGrievanceModal = openGrievanceModal;
window.closeReviewModal = closeReviewModal;
window.loadDisputes = loadDisputes;
window.loadGrievances = loadGrievances;
