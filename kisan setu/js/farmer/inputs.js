// ==================================================
// KISAN SETU - FARMER INPUTS (SEEDS & FERTILIZERS)
// File: js/farmer/inputs.js
// ==================================================

let availableProducts = [];
let myRequests = [];

function escapeHTML(str) {
    return String(str ?? "")
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
    const rawUser = localStorage.getItem("kisan_setu_user");
    if (!rawUser) {
        window.location.replace("../farmer_login.html");
        return;
    }

    if (typeof syncFarmerSidebarProfile === "function") {
        syncFarmerSidebarProfile();
    }
    if (typeof setupHamburgerSidebar === "function") {
        setupHamburgerSidebar();
    }
    if (typeof bindLogoutButtons === "function") {
        bindLogoutButtons();
    }

    await loadAvailableProducts();
    await loadMyRequests();

    document.getElementById("modalSelectProduct")?.addEventListener("change", function () {
        const selectedId = this.value;
        const prod = availableProducts.find(p => p.id === selectedId);
        const unitLabel = document.getElementById("modalUnitLabel");
        if (unitLabel && prod) {
            unitLabel.textContent = prod.unit || "Units";
        }
    });

    document.getElementById("inputRequestForm")?.addEventListener("submit", handleInputSubmit);
});

async function loadAvailableProducts() {
    const container = document.getElementById("inputsCatalogContainer");
    const selectEl = document.getElementById("modalSelectProduct");

    try {
        const res = await apiRequest("/inputs/products");
        availableProducts = Array.isArray(res) ? res : (res?.data || []);

        if (selectEl) {
            selectEl.innerHTML = '<option value="">Select item...</option>' + availableProducts.map(p => `
                <option value="${p.id}">${escapeHTML(p.name)} (${escapeHTML(p.unit)}) - Stock: ${p.stock}</option>
            `).join("");
        }

        if (!container) return;

        if (availableProducts.length === 0) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:32px; background:white; border-radius:10px; border:1px dashed #ccd6cf;">
                    <i class="fa-solid fa-box-open" style="font-size:32px; color:#9ca3af; margin-bottom:10px; display:block;"></i>
                    <p style="color:#6b7280; font-size:14px; margin:0;">No seed or fertilizer stock is currently listed by your Block Office.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = availableProducts.map(p => {
            const cat = (p.category || "General").toLowerCase();
            let badgeClass = "badge-seed";
            let icon = "fa-seedling";
            if (cat.includes("fert")) {
                badgeClass = "badge-fert";
                icon = "fa-flask";
            } else if (cat.includes("pest")) {
                badgeClass = "badge-pest";
                icon = "fa-shield-halved";
            }

            const stockQty = Number(p.stock) || 0;
            const isAvailable = stockQty > 0;

            return `
                <div class="input-card">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                            <span class="input-badge ${badgeClass}"><i class="fa-solid ${icon}"></i> ${escapeHTML(p.category)}</span>
                            <span style="font-size:11px; font-weight:700; color:${isAvailable ? '#15803d' : '#b91c1c'};">
                                ${isAvailable ? 'AVAILABLE' : 'OUT OF STOCK'}
                            </span>
                        </div>
                        <h3 style="margin:0 0 6px; font-size:15px; color:#111827; font-weight:700;">${escapeHTML(p.name)}</h3>
                        <p class="input-stock">
                            Warehouse Stock: <strong style="color:#111827;">${stockQty} ${escapeHTML(p.unit)}</strong>
                        </p>
                    </div>
                    <button type="button" class="req-btn" ${!isAvailable ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="openRequestModal('${p.id}')">
                        <i class="fa-solid fa-hand-holding-hand"></i> Request Quota
                    </button>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Error loading input products:", err);
        if (container) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:24px; color:#b91c1c;">
                    Failed to load input products: ${escapeHTML(friendlyErrorMessage(err))}
                </div>
            `;
        }
    }
}

async function loadMyRequests() {
    const tbody = document.getElementById("myRequestsTableBody");
    if (!tbody) return;

    try {
        const res = await apiRequest("/inputs");
        myRequests = Array.isArray(res) ? res : (res?.data || []);

        if (myRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:36px; color:#6b7280;">
                        <i class="fa-solid fa-clipboard-list" style="font-size:28px; color:#9ca3af; margin-bottom:8px; display:block;"></i>
                        You have not submitted any seed or fertilizer requests yet.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = myRequests.map(r => {
            const reqId = `INP-${(r.id || '').substring(0, 5).toUpperCase()}`;
            const prodName = r.inputProduct?.name || "Agricultural Input";
            const category = r.inputProduct?.category || "General";
            const qty = `${r.quantity} ${r.inputProduct?.unit || 'Units'}`;
            const date = formatDate(r.createdAt);
            const status = String(r.status || "PENDING").toUpperCase();

            let statusClass = "status-pending";
            let statusLabel = "Pending Approval";
            if (status === "APPROVED") {
                statusClass = "status-approved";
                statusLabel = "Approved ✓";
            } else if (status === "REJECTED") {
                statusClass = "status-rejected";
                statusLabel = "Rejected";
            }

            const remark = r.adminNote || (status === "APPROVED" ? "Collect from Prakhand Agriculture Godown with Kisan ID." : (status === "PENDING" ? "Under review by Block Agriculture Officer." : "Quota not available."));

            return `
                <tr>
                    <td><strong>#${reqId}</strong></td>
                    <td><strong>${escapeHTML(prodName)}</strong></td>
                    <td><span style="font-size:11px; background:#f3f4f6; padding:3px 8px; border-radius:4px;">${escapeHTML(category)}</span></td>
                    <td>${escapeHTML(qty)}</td>
                    <td>${date}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td style="color:#4b5563; font-size:12px;">${escapeHTML(remark)}</td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Error loading my input requests:", err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:24px; color:#b91c1c;">
                    Failed to load requests: ${escapeHTML(friendlyErrorMessage(err))}
                </td>
            </tr>
        `;
    }
}

function openRequestModal(productId) {
    const modal = document.getElementById("requestModal");
    const errBox = document.getElementById("modalErrBox");
    if (errBox) errBox.style.display = "none";

    const selectEl = document.getElementById("modalSelectProduct");
    if (selectEl && productId) {
        selectEl.value = productId;
        const prod = availableProducts.find(p => p.id === productId);
        const unitLabel = document.getElementById("modalUnitLabel");
        if (unitLabel && prod) unitLabel.textContent = prod.unit || "Units";
    }

    if (modal) modal.style.display = "flex";
}

function closeRequestModal() {
    const modal = document.getElementById("requestModal");
    if (modal) modal.style.display = "none";
}

async function handleInputSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("submitRequestBtn");
    const errBox = document.getElementById("modalErrBox");
    if (errBox) errBox.style.display = "none";

    const inputProductId = document.getElementById("modalSelectProduct")?.value;
    const quantity = Number(document.getElementById("modalQuantity")?.value);
    const season = document.getElementById("modalSeason")?.value;
    const reasonText = document.getElementById("modalReason")?.value.trim();

    if (!inputProductId) {
        if (errBox) { errBox.textContent = "Please select a product."; errBox.style.display = "block"; }
        return;
    }
    if (!quantity || quantity <= 0) {
        if (errBox) { errBox.textContent = "Please enter a valid quantity."; errBox.style.display = "block"; }
        return;
    }

    const reason = `[Season: ${season}] ${reasonText || 'Agricultural input requirement'}`;

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting...";
    }

    try {
        await apiRequest("/inputs", {
            method: "POST",
            body: {
                inputProductId,
                quantity,
                reason
            }
        });

        alert("Your request has been successfully submitted to your Block Agriculture Office!");
        closeRequestModal();
        document.getElementById("inputRequestForm")?.reset();
        await loadMyRequests();
    } catch (err) {
        console.error("Error submitting input request:", err);
        if (errBox) {
            errBox.textContent = friendlyErrorMessage(err, "Failed to submit request.");
            errBox.style.display = "block";
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Submit Request";
        }
    }
}

window.openRequestModal = openRequestModal;
window.closeRequestModal = closeRequestModal;
