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
    setupAddInputModal();
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
        const [inputsRes] = await Promise.allSettled([
            apiRequest("/inputs")
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

        // Deep-link handling
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get("id");
        const searchQ = urlParams.get("search") || urlParams.get("q");
        if (targetId) {
            const found = items.find(x => x.id === targetId || (x.id && x.id.toLowerCase().includes(targetId.toLowerCase())));
            if (found) {
                renderInputCards([found]);
                reviewAdminInput(found.id, found);
            }
        } else if (searchQ && document.getElementById("searchInput")) {
            document.getElementById("searchInput").value = searchQ;
            const filterBtn = document.querySelector(".filter-btn");
            if (filterBtn) filterBtn.click();
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
        const farmerPhone = item.farmer?.phone || "N/A";
        const farmerVillage = item.farmer?.farmerProfile?.village || item.farmer?.farmerProfile?.district || "Local Block";
        const status = (item.status || "PENDING").toUpperCase();

        let statusClass = "pending";
        if (status === "APPROVED") statusClass = "approved";
        else if (status === "DELIVERED") statusClass = "delivered";
        else if (status === "REJECTED") statusClass = "rejected";

        const inputName = item.inputProduct?.name || item.name || "Agricultural Input";
        const category = item.inputProduct?.category || "General";
        const qty = item.quantity ? `${item.quantity} ${item.inputProduct?.unit || "Units"}` : "Standard Pack";
        const stock = item.inputProduct?.stock !== undefined ? `${item.inputProduct.stock} ${item.inputProduct.unit}` : "Available";

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                    <strong style="color:#176b38; font-size:15px;">#${escapeHTML(reqId)}</strong>
                    <span class="status ${statusClass}" style="text-transform:capitalize;">${escapeHTML(status.toLowerCase())}</span>
                    <span style="font-size:11px; background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:4px;">${escapeHTML(category)}</span>
                </div>
                <p style="margin:0; font-size:14px; color:#222; font-weight:600;">${escapeHTML(inputName)} &bull; ${escapeHTML(qty)}</p>
                <p style="margin:4px 0 0; font-size:12px; color:#666;">
                    Farmer: <strong>${escapeHTML(farmerName)}</strong> (${escapeHTML(farmerPhone)}) &bull; Location: ${escapeHTML(farmerVillage)} &bull; Date: ${formatDate(item.createdAt)}
                </p>
                ${item.reason ? `<p style="margin:4px 0 0; font-size:12px; color:#047857; font-style:italic;">Note: ${escapeHTML(item.reason)}</p>` : ''}
                ${item.adminNote ? `<p style="margin:4px 0 0; font-size:11px; color:#4b5563;">Admin Remark: ${escapeHTML(item.adminNote)}</p>` : ''}
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                ${status === "PENDING" ? `
                    <button type="button" class="action-btn" onclick="reviewAdminInput('${item.id}')" style="background:#176b38; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-clipboard-check"></i> Review & Allot
                    </button>
                ` : `
                    <button type="button" class="action-btn" onclick="reviewAdminInput('${item.id}')" style="background:#f3f4f6; color:#374151; border:1px solid #d1d5db; padding:7px 14px; border-radius:6px; font-size:12px; cursor:pointer;">
                        Details
                    </button>
                `}
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
            const name = (item.inputProduct?.name || item.name || "").toLowerCase();
            const farmer = (item.farmer?.name || "").toLowerCase();
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

function reviewAdminInput(id, inputObj = null) {
    let item = inputObj;
    if (!item) {
        item = allInputRequests.find((x) => x.id === id);
    }
    if (!item && window.allRequestsList) {
        const found = window.allRequestsList.find(x => x.rawId === id || x.id === id);
        if (found) item = found.inputObj;
    }
    if (!item) {
        console.warn("Input request not found:", id);
        return;
    }

    let modal = document.getElementById("adminInputReviewModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "adminInputReviewModal";
        modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;";
        document.body.appendChild(modal);
    }

    const prodName = item.inputProduct?.name || "Agricultural Input";
    const farmerName = item.farmer?.name || "Registered Farmer";
    const farmerPhone = item.farmer?.phone || "N/A";
    const farmerVillage = item.farmer?.farmerProfile?.village || item.farmer?.farmerProfile?.district || "Bihar";
    const status = (item.status || "PENDING").toUpperCase();
    const stock = item.inputProduct?.stock ?? "Unknown";
    const unit = item.inputProduct?.unit || "Units";

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; width:520px; max-width:100%; box-shadow:0 20px 40px rgba(0,0,0,0.15); overflow:hidden; border:1px solid #e2e8e3;">
            <div style="background:linear-gradient(135deg, #10B981, #059669); color:white; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:17px; font-weight:700;">
                    <i class="fa-solid fa-flask" style="margin-right:8px;"></i> Input Allocation Review
                </h3>
                <button type="button" onclick="closeAdminInputModal()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer;">&times;</button>
            </div>
            <div style="padding:22px 24px;">
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="font-size:15px; color:#111827;">${escapeHTML(prodName)}</strong>
                        <span style="font-size:12px; font-weight:700; color:#059669; background:#ecfdf5; padding:3px 8px; border-radius:4px;">
                            Warehouse Stock: ${stock} ${escapeHTML(unit)}
                        </span>
                    </div>
                    <p style="margin:0; font-size:13px; color:#374151;">
                        Requested Quota: <strong style="color:#15803d; font-size:14px;">${item.quantity} ${escapeHTML(unit)}</strong>
                    </p>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
                    <div style="background:#f8faf9; padding:10px 14px; border-radius:8px;">
                        <span style="color:#6b7280; font-size:11px; display:block;">Farmer Name</span>
                        <strong>${escapeHTML(farmerName)}</strong>
                    </div>
                    <div style="background:#f8faf9; padding:10px 14px; border-radius:8px;">
                        <span style="color:#6b7280; font-size:11px; display:block;">Contact & Village</span>
                        <strong>${escapeHTML(farmerPhone)} &bull; ${escapeHTML(farmerVillage)}</strong>
                    </div>
                </div>

                ${item.reason ? `
                    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:12px; color:#1e40af;">
                        <strong>Farmer Requirement Note:</strong> ${escapeHTML(item.reason)}
                    </div>
                ` : ''}

                ${status === "PENDING" ? `
                    <div style="margin-bottom:18px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px;">
                            Prakhand Admin Allotment Note / गोदाम पर्ची टिप्पणी:
                        </label>
                        <input type="text" id="adminInputNote" placeholder="e.g. Approved. Collect from Block Agriculture Godown (Counter 1)" style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:7px; font-size:13px; box-sizing:border-box;">
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px; align-items:center;">
                        <a href="inputs.html?id=${encodeURIComponent(item.id)}" style="margin-right:auto; color:#047857; font-size:12px; font-weight:600; text-decoration:underline; display:inline-flex; align-items:center; gap:4px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in Inputs Page
                        </a>
                        <button type="button" onclick="closeAdminInputModal()" style="background:#e5e7eb; border:none; padding:9px 16px; border-radius:7px; font-weight:600; cursor:pointer;">
                            Cancel
                        </button>
                        <button type="button" onclick="submitInputDecision('${item.id}', 'reject')" style="background:#ef4444; color:white; border:none; padding:9px 18px; border-radius:7px; font-weight:700; cursor:pointer;">
                            Reject
                        </button>
                        <button type="button" onclick="submitInputDecision('${item.id}', 'approve')" style="background:#10b981; color:white; border:none; padding:9px 20px; border-radius:7px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-check"></i> Approve & Allot
                        </button>
                    </div>
                ` : `
                    <div style="padding:10px; background:#f3f4f6; border-radius:8px; text-align:center; font-size:13px; color:#4b5563;">
                        This request is already marked as <strong>${status}</strong>.
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; align-items:center; margin-top:16px;">
                        <a href="inputs.html?id=${encodeURIComponent(item.id)}" style="margin-right:auto; color:#047857; font-size:12px; font-weight:600; text-decoration:underline; display:inline-flex; align-items:center; gap:4px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in Inputs Page
                        </a>
                        <button type="button" onclick="closeAdminInputModal()" style="background:#10b981; color:white; border:none; padding:9px 20px; border-radius:7px; font-weight:600; cursor:pointer;">Close</button>
                    </div>
                `}
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function closeAdminInputModal() {
    const modal = document.getElementById("adminInputReviewModal");
    if (modal) modal.style.display = "none";
}

async function submitInputDecision(id, action) {
    const note = document.getElementById("adminInputNote")?.value.trim() || undefined;
    const isApprove = action === "approve";

    try {
        await apiRequest(`/inputs/${encodeURIComponent(id)}/${isApprove ? 'approve' : 'reject'}`, {
            method: "POST",
            body: { note }
        });

        alert(`Input request ${isApprove ? 'APPROVED & ALLOTTED' : 'REJECTED'}. Farmer has been notified.`);
        closeAdminInputModal();
        if (window.location.pathname.includes("requests.html")) {
            window.location.reload();
        } else {
            await loadAdminInputs();
        }
    } catch (err) {
        console.error("Error submitting decision:", err);
        alert(`Failed to ${action} request: ${friendlyErrorMessage(err)}`);
    }
}

function setupAddInputModal() {
    const addBtn = document.querySelector(".add-input-btn");
    if (!addBtn) return;

    addBtn.addEventListener("click", () => {
        let modal = document.getElementById("adminAddProductModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "adminAddProductModal";
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px;";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:white; border-radius:14px; width:480px; max-width:100%; box-shadow:0 20px 40px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #e2e8e3;">
                <div style="background:linear-gradient(135deg, #10B981, #059669); color:white; padding:18px 22px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:17px; font-weight:700;"><i class="fa-solid fa-plus" style="margin-right:8px;"></i> Add Seed / Fertilizer Inventory</h3>
                    <button type="button" onclick="document.getElementById('adminAddProductModal').style.display='none'" style="background:none; border:none; color:white; font-size:22px; cursor:pointer;">&times;</button>
                </div>
                <form id="adminAddProductForm" style="padding:22px;">
                    <div style="margin-bottom:14px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px;">Product / Variety Name <span>*</span></label>
                        <input type="text" id="newProdName" placeholder="e.g. Certified Mustard Seed (Pusa Bold)" required style="width:100%; padding:9px 12px; border:1px solid #d1d5db; border-radius:7px; font-size:13px; box-sizing:border-box;">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                        <div>
                            <label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px;">Category <span>*</span></label>
                            <select id="newProdCat" style="width:100%; padding:9px 12px; border:1px solid #d1d5db; border-radius:7px; font-size:13px;">
                                <option value="Seed">Seeds</option>
                                <option value="Fertilizer">Fertilizers</option>
                                <option value="Pesticide">Pesticides</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px;">Unit <span>*</span></label>
                            <input type="text" id="newProdUnit" placeholder="e.g. BAG (50 KG) or KG" required style="width:100%; padding:9px 12px; border:1px solid #d1d5db; border-radius:7px; font-size:13px; box-sizing:border-box;">
                        </div>
                    </div>
                    <div style="margin-bottom:18px;">
                        <label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px;">Initial Warehouse Stock <span>*</span></label>
                        <input type="number" id="newProdStock" min="1" placeholder="e.g. 500" required style="width:100%; padding:9px 12px; border:1px solid #d1d5db; border-radius:7px; font-size:13px; box-sizing:border-box;">
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        <button type="button" onclick="document.getElementById('adminAddProductModal').style.display='none'" style="background:#e5e7eb; border:none; padding:9px 16px; border-radius:7px; font-weight:600; cursor:pointer;">Cancel</button>
                        <button type="submit" style="background:#10b981; color:white; border:none; padding:9px 20px; border-radius:7px; font-weight:700; cursor:pointer;">Add to Warehouse</button>
                    </div>
                </form>
            </div>
        `;
        modal.style.display = "flex";

        document.getElementById("adminAddProductForm").onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById("newProdName").value.trim();
            const category = document.getElementById("newProdCat").value;
            const unit = document.getElementById("newProdUnit").value.trim();
            const stock = Number(document.getElementById("newProdStock").value);

            try {
                await apiRequest("/inputs/products", {
                    method: "POST",
                    body: { name, category, unit, stock }
                });
                alert("New product added to Block Inventory successfully!");
                modal.style.display = "none";
                await loadAdminInputs();
            } catch (err) {
                alert(`Failed to add product: ${friendlyErrorMessage(err)}`);
            }
        };
    });
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
window.submitInputDecision = submitInputDecision;
window.closeAdminInputModal = closeAdminInputModal;
