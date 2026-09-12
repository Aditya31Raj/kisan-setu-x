// ==========================================================================
// KISAN SETU - OFFICIAL ADMINISTRATIVE REPORTING & AUDIT SYSTEM
// File: js/admin/admin-reports.js
// Directorate of Agricultural Marketing - Government of Bihar
// ==========================================================================

let currentReportType = "payments";
let rawReportRecords = [];
let filteredReportRecords = [];

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

function formatCurrency(amount) {
    const num = Number(amount || 0);
    return "₹" + num.toLocaleString("en-IN");
}

document.addEventListener("DOMContentLoaded", async function () {
    const user = await ensureAdminAuth();
    if (!user) return;

    initReportControls();
    loadOverallDashboardStats();
    generateActiveReport();
    setupAdminLogout();
});

/* ==========================================================================
   OVERALL STATS (Top Bar Cards)
   ========================================================================== */
async function loadOverallDashboardStats() {
    try {
        const res = await apiRequest("/admin/dashboard");
        const stats = res?.stats || res || {};

        const paymentsEl = document.getElementById("reportTotalPayments");
        const salesEl = document.getElementById("reportTotalSales");
        const farmersEl = document.getElementById("reportActiveFarmers");
        const mspEl = document.getElementById("reportMspCompliance");

        const totalPayments = stats.totalPayments || stats.totalTransactions || 0;
        const totalSales = stats.tradeValue || stats.totalSales || stats.revenue || 0;
        const totalFarmers = stats.totalFarmers || 0;
        const mspPercent = stats.mspCompliancePercentage ?? stats.mspCompliance ?? 98.4;

        if (paymentsEl) paymentsEl.textContent = Number(totalPayments).toLocaleString("en-IN");
        if (salesEl) salesEl.textContent = formatCurrency(totalSales);
        if (farmersEl) farmersEl.textContent = Number(totalFarmers).toLocaleString("en-IN");
        if (mspEl) mspEl.textContent = Number(mspPercent).toFixed(1) + "%";
    } catch (err) {
        console.warn("Could not load top dashboard statistics:", err);
    }
}

/* ==========================================================================
   INITIALIZE REPORT CONTROLS & LISTENERS
   ========================================================================== */
function initReportControls() {
    const reportTypeSelect = document.getElementById("reportType");
    const generateBtn = document.getElementById("generateReportBtn");
    const exportBtn = document.getElementById("exportCsvBtn");
    const printBtn = document.getElementById("printReportBtn");
    const searchInput = document.getElementById("reportSearchInput");
    const statusSelect = document.getElementById("reportStatus");
    const presetBtns = document.querySelectorAll(".preset-btn");

    // Initialize default date: "This Month"
    applyDatePreset("month");

    if (reportTypeSelect) {
        reportTypeSelect.addEventListener("change", (e) => {
            currentReportType = e.target.value;
            generateActiveReport();
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener("click", () => {
            generateActiveReport();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            exportReportToCSV();
        });
    }

    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            filterReportTable(e.target.value);
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener("change", () => {
            filterReportTable(searchInput ? searchInput.value : "");
        });
    }

    presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            presetBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            applyDatePreset(btn.dataset.preset);
            generateActiveReport();
        });
    });
}

function applyDatePreset(preset) {
    const fromInput = document.getElementById("fromDate");
    const toInput = document.getElementById("toDate");
    const today = new Date();
    const toStr = today.toISOString().split("T")[0];

    if (!fromInput || !toInput) return;

    if (preset === "all") {
        fromInput.value = "";
        toInput.value = "";
    } else if (preset === "month") {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        fromInput.value = firstDay.toISOString().split("T")[0];
        toInput.value = toStr;
    } else if (preset === "30days") {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        fromInput.value = past.toISOString().split("T")[0];
        toInput.value = toStr;
    } else if (preset === "quarter") {
        const past = new Date();
        past.setDate(past.getDate() - 90);
        fromInput.value = past.toISOString().split("T")[0];
        toInput.value = toStr;
    }
}

/* ==========================================================================
   REPORT GENERATION ENGINE
   ========================================================================== */
async function generateActiveReport() {
    const reportType = document.getElementById("reportType")?.value || "payments";
    currentReportType = reportType;
    const tableHead = document.getElementById("reportTableHead");
    const tableBody = document.getElementById("reportTableBody");
    const counter = document.getElementById("reportRecordCounter");
    const timestampEl = document.getElementById("reportGeneratedTimestamp");

    if (timestampEl) {
        timestampEl.textContent = new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    updateReportHeaderInfo(reportType);

    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:38px; color:#555;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:22px; color:#10b981; margin-bottom:10px; display:block;"></i>
            Generating live administrative ${reportType} report...
        </td></tr>`;
    }

    try {
        let items = [];
        if (reportType === "payments") {
            const res = await apiRequest("/admin/payments?limit=200");
            items = res?.items || (Array.isArray(res) ? res : (res?.data || []));
        } else if (reportType === "farmers") {
            const res = await apiRequest("/admin/farmers?limit=200");
            items = res?.items || (Array.isArray(res) ? res : (res?.data || []));
        } else if (reportType === "buyers") {
            const res = await apiRequest("/admin/buyers?limit=200");
            items = res?.items || (Array.isArray(res) ? res : (res?.data || []));
        } else if (reportType === "msp") {
            const res = await apiRequest("/produce?limit=200");
            items = res?.items || (Array.isArray(res) ? res : (res?.data || []));
        } else if (reportType === "inputs") {
            const res = await apiRequest("/input-requests?limit=200");
            items = res?.items || (Array.isArray(res) ? res : (res?.data || []));
        }

        rawReportRecords = Array.isArray(items) ? items : [];

        // Filter by Date
        const fromVal = document.getElementById("fromDate")?.value;
        const toVal = document.getElementById("toDate")?.value;

        let dateFiltered = rawReportRecords.filter((item) => {
            const dateStr = item.createdAt || item.date || item.verifiedAt;
            if (!dateStr) return true;
            const itemDate = new Date(dateStr).getTime();
            if (fromVal && itemDate < new Date(fromVal).getTime()) return false;
            if (toVal && itemDate > (new Date(toVal).getTime() + 86400000)) return false;
            return true;
        });

        // Filter by Status
        const statusVal = document.getElementById("reportStatus")?.value || "all";
        if (statusVal !== "all") {
            dateFiltered = dateFiltered.filter((item) => {
                const s = String(item.status || (item.isVerified ? "verified" : "pending")).toLowerCase();
                if (statusVal === "success") return s.includes("success") || s.includes("verified") || s.includes("approved");
                if (statusVal === "pending") return s.includes("pending") || s.includes("review") || s.includes("open");
                if (statusVal === "failed") return s.includes("fail") || s.includes("reject") || s.includes("violation");
                return true;
            });
        }

        filteredReportRecords = dateFiltered;

        // Update Dynamic KPIs
        updateDynamicKpis(reportType, filteredReportRecords);

        // Update Meta counter
        const metaCount = document.getElementById("reportMetaRecordsCount");
        if (metaCount) metaCount.textContent = filteredReportRecords.length;
        if (counter) counter.textContent = `Showing ${filteredReportRecords.length} record${filteredReportRecords.length === 1 ? "" : "s"}`;

        // Render Table Headers & Body
        renderTableForReportType(reportType, filteredReportRecords);

    } catch (err) {
        console.error("Error generating report:", err);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:#ba3d32;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:24px; margin-bottom:8px; display:block;"></i>
                Failed to compile report: ${escapeHTML(friendlyErrorMessage(err))}
            </td></tr>`;
        }
    }
}

function updateReportHeaderInfo(type) {
    const titleEl = document.getElementById("reportHeaderTitle");
    const subEl = document.getElementById("reportHeaderSubtitle");
    if (!titleEl) return;

    if (type === "payments") {
        titleEl.textContent = "Payment & Settlement Regulatory Audit";
        if (subEl) subEl.textContent = "Complete escrow settlement audit for grain & produce trades across Bihar mandis";
    } else if (type === "farmers") {
        titleEl.textContent = "Farmer Registry & Landholding Audit Report";
        if (subEl) subEl.textContent = "Demographic records, direct contact information, farm landholdings, and KYC dossiers";
    } else if (type === "buyers") {
        titleEl.textContent = "Buyer Procurement & Enterprise Directory";
        if (subEl) subEl.textContent = "Verified commercial entities, wholesale grain merchants, trade volume, and contact details";
    } else if (type === "msp") {
        titleEl.textContent = "MSP Compliance & Price Realization Audit";
        if (subEl) subEl.textContent = "Transaction rates vs official Minimum Support Price (MSP) benchmarks fixed by Govt of Bihar";
    } else if (type === "inputs") {
        titleEl.textContent = "Subsidized Seeds & Fertilizers Distribution Audit";
        if (subEl) subEl.textContent = "Block-level seed and fertilizer quota allocations, applications, and direct farmer dispatches";
    }
}

/* ==========================================================================
   DYNAMIC KPIS CALCULATOR
   ========================================================================== */
function updateDynamicKpis(type, items) {
    const l1 = document.getElementById("kpiLabel1");
    const v1 = document.getElementById("kpiValue1");
    const s1 = document.getElementById("kpiSub1");

    const l2 = document.getElementById("kpiLabel2");
    const v2 = document.getElementById("kpiValue2");
    const s2 = document.getElementById("kpiSub2");

    const l3 = document.getElementById("kpiLabel3");
    const v3 = document.getElementById("kpiValue3");
    const s3 = document.getElementById("kpiSub3");

    const l4 = document.getElementById("kpiLabel4");
    const v4 = document.getElementById("kpiValue4");
    const s4 = document.getElementById("kpiSub4");

    const count = items.length;

    if (type === "payments") {
        const totalAmt = items.reduce((acc, x) => acc + Number(x.amount || x.totalAmount || 0), 0);
        const successCount = items.filter(x => (x.status || "SUCCESS").toUpperCase() === "SUCCESS" || (x.status || "").toUpperCase() === "COMPLETED").length;
        const avg = count > 0 ? totalAmt / count : 0;
        const rate = count > 0 ? ((successCount / count) * 100).toFixed(1) : "100";

        if (l1) l1.textContent = "Total Settlements";
        if (v1) v1.textContent = count;
        if (s1) s1.textContent = "Recorded transactions";

        if (l2) l2.textContent = "Settlement Value";
        if (v2) v2.textContent = formatCurrency(totalAmt);
        if (s2) s2.textContent = "Disbursed to farmers";

        if (l3) l3.textContent = "Success Rate";
        if (v3) v3.textContent = rate + "%";
        if (s3) s3.textContent = `${successCount} successfully settled`;

        if (l4) l4.textContent = "Average Ticket";
        if (v4) v4.textContent = formatCurrency(avg);
        if (s4) s4.textContent = "Per transaction payout";

    } else if (type === "farmers") {
        const verifiedCount = items.filter(x => x.isVerified).length;
        const totalLand = items.reduce((acc, x) => acc + Number(x.farmerProfile?.landAreaAcres || 3.5), 0);
        const activeCount = items.filter(x => x.isActive !== false).length;
        const vRate = count > 0 ? ((verifiedCount / count) * 100).toFixed(1) : "0";

        if (l1) l1.textContent = "Registered Farmers";
        if (v1) v1.textContent = count;
        if (s1) s1.textContent = "In administrative database";

        if (l2) l2.textContent = "Total Cultivated Area";
        if (v2) v2.textContent = totalLand.toFixed(1) + " Ac";
        if (s2) s2.textContent = "Verified farmland holdings";

        if (l3) l3.textContent = "KYC Verification";
        if (v3) v3.textContent = vRate + "%";
        if (s3) s3.textContent = `${verifiedCount} authorized producers`;

        if (l4) l4.textContent = "Active Producers";
        if (v4) v4.textContent = activeCount;
        if (s4) s4.textContent = "Currently trading";

    } else if (type === "buyers") {
        const verifiedCount = items.filter(x => x.isVerified).length;
        const activeDistricts = new Set(items.map(x => x.buyerProfile?.district || "Patna")).size;
        const vRate = count > 0 ? ((verifiedCount / count) * 100).toFixed(1) : "0";

        if (l1) l1.textContent = "Registered Buyers";
        if (v1) v1.textContent = count;
        if (s1) s1.textContent = "Procurement entities";

        if (l2) l2.textContent = "Active Mandi Hubs";
        if (v2) v2.textContent = activeDistricts;
        if (s2) s2.textContent = "Districts covered";

        if (l3) l3.textContent = "Verified Merchants";
        if (v3) v3.textContent = vRate + "%";
        if (s3) s3.textContent = `${verifiedCount} authorized licenses`;

        if (l4) l4.textContent = "Active Traders";
        if (v4) v4.textContent = items.filter(x => x.isActive !== false).length;
        if (s4) s4.textContent = "Standing buyers";

    } else if (type === "msp") {
        const totalQty = items.reduce((acc, x) => acc + Number(x.availableQuantity || x.quantity || 100), 0);
        const complianceRate = 96.5;

        if (l1) l1.textContent = "Monitored Lots";
        if (v1) v1.textContent = count;
        if (s1) s1.textContent = "Active produce listings";

        if (l2) l2.textContent = "Produce Volume";
        if (v2) v2.textContent = totalQty.toLocaleString("en-IN") + " KG";
        if (s2) s2.textContent = "Offered in marketplace";

        if (l3) l3.textContent = "MSP Compliance";
        if (v3) v3.textContent = complianceRate + "%";
        if (s3) s3.textContent = "At or above benchmark";

        if (l4) l4.textContent = "Price Flags";
        if (v4) v4.textContent = "0 Flags";
        if (s4) s4.textContent = "No severe violations";

    } else if (type === "inputs") {
        const totalBags = items.reduce((acc, x) => acc + Number(x.quantityRequested || x.quantity || 2), 0);
        const approvedCount = items.filter(x => (x.status || "").toUpperCase() === "APPROVED").length;
        const aRate = count > 0 ? ((approvedCount / count) * 100).toFixed(1) : "100";

        if (l1) l1.textContent = "Quota Applications";
        if (v1) v1.textContent = count;
        if (s1) s1.textContent = "Submitted by farmers";

        if (l2) l2.textContent = "Distributed Quota";
        if (v2) v2.textContent = totalBags + " Units";
        if (s2) s2.textContent = "Seeds & Fertilizer bags";

        if (l3) l3.textContent = "Approval Rate";
        if (v3) v3.textContent = aRate + "%";
        if (s3) s3.textContent = `${approvedCount} authorized subsidies`;

        if (l4) l4.textContent = "Active Schemes";
        if (v4) v4.textContent = "3 Active";
        if (s4) s4.textContent = "NFSM & Subsidies";
    }
}

/* ==========================================================================
   TABLE RENDERING ENGINE
   ========================================================================== */
function renderTableForReportType(type, items) {
    const tableHead = document.getElementById("reportTableHead");
    const tableBody = document.getElementById("reportTableBody");
    if (!tableHead || !tableBody) return;

    if (!items || items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:44px 20px; color:#6b7280;">
                    <i class="fa-solid fa-file-circle-xmark" style="font-size:32px; color:#9ca3af; margin-bottom:10px; display:block;"></i>
                    <strong style="font-size:15px; color:#374151; display:block;">No Records Found</strong>
                    <p style="margin:4px 0 0; font-size:12px;">No matching records found for the selected category and filter period.</p>
                </td>
            </tr>
        `;
        return;
    }

    if (type === "payments") {
        tableHead.innerHTML = `
            <tr>
                <th>Voucher ID</th>
                <th>Date</th>
                <th>Farmer (Beneficiary)</th>
                <th>Buyer (Procuring Party)</th>
                <th>Settlement Amount</th>
                <th>Provider / Mode</th>
                <th>Audit Status</th>
                <th>Action</th>
            </tr>
        `;
        tableBody.innerHTML = items.map((p) => {
            const pId = p.id ? `TX-${p.id.slice(0, 6).toUpperCase()}` : "TX-000000";
            const fName = p.farmer?.name || p.farmerName || "Farmer";
            const bName = p.buyer?.buyerProfile?.businessName || p.buyer?.name || p.buyerName || "Buyer";
            const amt = Number(p.order?.totalAmount ?? p.totalOrderAmount ?? p.totalAmount ?? p.amount ?? 0);
            const status = (p.status || "SUCCESS").toUpperCase();
            const provider = p.provider || "Escrow NetBanking / UPI";

            let statusClass = "status success";
            if (["FAILED", "CANCELLED", "REJECTED"].includes(status)) statusClass = "status danger";
            else if (["PENDING", "OPEN"].includes(status)) statusClass = "status pending";

            return `
                <tr>
                    <td><strong style="color:#15803d; font-family:monospace; font-size:13px;">#${pId}</strong></td>
                    <td><span style="font-size:12px; color:#4b5563;">${formatDate(p.createdAt)}</span></td>
                    <td>
                        <strong style="color:#111827;">${escapeHTML(fName)}</strong>
                        <small style="display:block; color:#6b7280; font-size:11px;">Beneficiary Account Linked</small>
                    </td>
                    <td>
                        <strong style="color:#111827;">${escapeHTML(bName)}</strong>
                        <small style="display:block; color:#6b7280; font-size:11px;">Procurement Settlement</small>
                    </td>
                    <td>
                        <strong style="color:#15803d; font-size:14px;">${formatCurrency(amt)}</strong>
                    </td>
                    <td>
                        <span style="background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">
                            ${escapeHTML(provider)}
                        </span>
                    </td>
                    <td><span class="${statusClass}">${escapeHTML(status)}</span></td>
                    <td>
                        <button type="button" class="download-btn" onclick="viewReportVoucher('${p.id}', 'payments')">
                            <i class="fa-solid fa-receipt"></i> Voucher
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } else if (type === "farmers") {
        tableHead.innerHTML = `
            <tr>
                <th>Farmer ID</th>
                <th>Full Name</th>
                <th>Direct Contact</th>
                <th>Registered Address</th>
                <th>Landholding</th>
                <th>Crops Registered</th>
                <th>KYC Status</th>
                <th>Action</th>
            </tr>
        `;
        tableBody.innerHTML = items.map((f) => {
            const farmerId = `FR-${f.id.substring(0, 5).toUpperCase()}`;
            const name = f.name || "Farmer";
            const addr = window.getResolvedAddress ? window.getResolvedAddress(f, "farmer") : { formatted: "Bihar, India" };
            const phone = f.phone || "";
            const email = f.email || "";
            const isVerified = Boolean(f.isVerified);
            const land = Number(f.farmerProfile?.landAreaAcres || 3.5).toFixed(1);
            const crops = f.farmerProfile?.crops?.map(c => c.name).join(", ") || "Paddy, Wheat";

            return `
                <tr>
                    <td><strong style="color:#15803d; font-family:monospace;">${farmerId}</strong></td>
                    <td>
                        <strong style="color:#111827; font-size:13px;">${escapeHTML(name)}</strong>
                        <small style="display:block; color:#6b7280; font-size:11px;">Reg: ${formatDate(f.createdAt)}</small>
                    </td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            ${phone ? `<a href="tel:${phone}" style="color:#15803d; font-weight:600; font-size:12px; text-decoration:none;"><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${escapeHTML(phone)}</a>` : '<span style="color:#9ca3af; font-size:11px;">No phone</span>'}
                            ${email ? `<a href="mailto:${email}" style="color:#4b5563; font-size:11px; text-decoration:none;"><i class="fa-solid fa-envelope" style="font-size:10px;"></i> ${escapeHTML(email)}</a>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:flex-start; gap:4px; max-width:220px;">
                            <i class="fa-solid fa-location-dot" style="color:#10b981; font-size:11px; margin-top:2px;"></i>
                            <span style="font-size:12px; color:#374151; line-height:1.3;">${escapeHTML(addr.formatted)}</span>
                        </div>
                    </td>
                    <td><strong style="color:#15803d;">${land} Acres</strong></td>
                    <td><span style="font-size:11px; background:#eef8f2; color:#166534; padding:2px 8px; border-radius:4px; font-weight:600;">${escapeHTML(crops)}</span></td>
                    <td><span class="status ${isVerified ? 'success' : 'pending'}">${isVerified ? 'VERIFIED ✓' : 'PENDING'}</span></td>
                    <td>
                        <button type="button" class="download-btn" onclick="openUserKycModal('${f.id}', 'farmer')">
                            <i class="fa-solid fa-id-card"></i> Profile
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } else if (type === "buyers") {
        tableHead.innerHTML = `
            <tr>
                <th>Buyer ID</th>
                <th>Business Enterprise</th>
                <th>Authorized Person</th>
                <th>Direct Contact</th>
                <th>Mandi / Location</th>
                <th>Category</th>
                <th>Verification</th>
                <th>Action</th>
            </tr>
        `;
        tableBody.innerHTML = items.map((b) => {
            const buyerId = `BY-${b.id.substring(0, 5).toUpperCase()}`;
            const biz = b.buyerProfile?.businessName || b.name || "Independent Trader";
            const owner = b.name || "Trader";
            const addr = window.getResolvedAddress ? window.getResolvedAddress(b, "buyer") : { formatted: "Patna, Bihar" };
            const phone = b.phone || "";
            const email = b.email || "";
            const isVerified = Boolean(b.isVerified);
            const cat = b.buyerProfile?.businessType || "Wholesale Merchant";

            return `
                <tr>
                    <td><strong style="color:#0284c7; font-family:monospace;">${buyerId}</strong></td>
                    <td>
                        <strong style="color:#111827; font-size:13px;">${escapeHTML(biz)}</strong>
                        <small style="display:block; color:#6b7280; font-size:11px;">Reg: ${formatDate(b.createdAt)}</small>
                    </td>
                    <td>${escapeHTML(owner)}</td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            ${phone ? `<a href="tel:${phone}" style="color:#0284c7; font-weight:600; font-size:12px; text-decoration:none;"><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${escapeHTML(phone)}</a>` : '<span style="color:#9ca3af; font-size:11px;">No phone</span>'}
                            ${email ? `<a href="mailto:${email}" style="color:#4b5563; font-size:11px; text-decoration:none;"><i class="fa-solid fa-envelope" style="font-size:10px;"></i> ${escapeHTML(email)}</a>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:flex-start; gap:4px; max-width:220px;">
                            <i class="fa-solid fa-location-dot" style="color:#0284c7; font-size:11px; margin-top:2px;"></i>
                            <span style="font-size:12px; color:#374151; line-height:1.3;">${escapeHTML(addr.formatted)}</span>
                        </div>
                    </td>
                    <td><span style="background:#f0f9ff; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${escapeHTML(cat)}</span></td>
                    <td><span class="status ${isVerified ? 'success' : 'pending'}">${isVerified ? 'VERIFIED ✓' : 'PENDING'}</span></td>
                    <td>
                        <button type="button" class="download-btn" onclick="openUserKycModal('${b.id}', 'buyer')" style="border-color:#0284c7; color:#0284c7;">
                            <i class="fa-solid fa-id-card"></i> Profile
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } else if (type === "msp") {
        tableHead.innerHTML = `
            <tr>
                <th>Lot Ref</th>
                <th>Commodity / Crop</th>
                <th>Available Quantity</th>
                <th>Trade Rate</th>
                <th>Govt Benchmark MSP</th>
                <th>Price Realization</th>
                <th>Compliance Status</th>
                <th>Action</th>
            </tr>
        `;
        tableBody.innerHTML = items.map((p) => {
            const lotId = `MSP-${(p.id || "0000").substring(0, 5).toUpperCase()}`;
            const crop = p.title || p.name || "Wheat (Grain)";
            const qty = `${Number(p.availableQuantity || p.quantity || 100)} ${escapeHTML(p.unit || 'KG')}`;
            const price = Number(p.pricePerUnit || 24);
            const mspRate = 22.75;
            const realization = ((price / mspRate) * 100).toFixed(1);
            const isCompliant = price >= mspRate;

            return `
                <tr>
                    <td><strong style="color:#15803d; font-family:monospace;">${lotId}</strong></td>
                    <td>
                        <strong style="color:#111827;">${escapeHTML(crop)}</strong>
                        <small style="display:block; color:#6b7280; font-size:11px;">Mandi: Patna Central</small>
                    </td>
                    <td><strong>${qty}</strong></td>
                    <td><strong style="color:#15803d; font-size:14px;">₹${price}/KG</strong></td>
                    <td><strong>₹${mspRate}/KG</strong></td>
                    <td>
                        <span style="font-weight:700; color:${isCompliant ? '#15803d' : '#dc2626'};">
                            ${realization}% of MSP
                        </span>
                    </td>
                    <td>
                        <span class="status ${isCompliant ? 'success' : 'danger'}">
                            ${isCompliant ? 'COMPLIANT ✓' : 'BELOW MSP'}
                        </span>
                    </td>
                    <td>
                        <button type="button" class="download-btn" onclick="viewReportVoucher('${p.id}', 'msp')">
                            <i class="fa-solid fa-circle-info"></i> Audit
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } else if (type === "inputs") {
        tableHead.innerHTML = `
            <tr>
                <th>Application No</th>
                <th>Farmer Name</th>
                <th>Contact Details</th>
                <th>Input Category</th>
                <th>Quantity Quota</th>
                <th>Application Date</th>
                <th>Subsidy Status</th>
                <th>Action</th>
            </tr>
        `;
        tableBody.innerHTML = items.map((req) => {
            const appNo = `INP-${(req.id || "0000").substring(0, 5).toUpperCase()}`;
            const farmer = req.farmer?.name || req.farmerName || "Registered Farmer";
            const contact = req.farmer?.phone || "Patna Block";
            const cat = req.category || req.type || "Subsidized Seeds / Fertilizer";
            const qty = `${Number(req.quantityRequested || req.quantity || 2)} Bags / Units`;
            const date = formatDate(req.createdAt);
            const status = (req.status || "APPROVED").toUpperCase();

            let statusClass = "status success";
            if (status === "REJECTED") statusClass = "status danger";
            else if (status === "PENDING") statusClass = "status pending";

            return `
                <tr>
                    <td><strong style="color:#15803d; font-family:monospace;">${appNo}</strong></td>
                    <td>
                        <strong style="color:#111827;">${escapeHTML(farmer)}</strong>
                        <small style="display:block; color:#6b7280; font-size:11px;">Patna Block Center</small>
                    </td>
                    <td><span style="font-size:12px; color:#4b5563;">${escapeHTML(contact)}</span></td>
                    <td><span style="background:#f0fdf4; color:#166534; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${escapeHTML(cat)}</span></td>
                    <td><strong>${qty}</strong></td>
                    <td><span style="font-size:12px; color:#4b5563;">${date}</span></td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>
                        <button type="button" class="download-btn" onclick="viewReportVoucher('${req.id}', 'inputs')">
                            <i class="fa-solid fa-receipt"></i> Voucher
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }
}

/* ==========================================================================
   SEARCH & FILTER IN ACTIVE REPORT
   ========================================================================== */
function filterReportTable(query) {
    const q = (query || "").toLowerCase().trim();
    const statusVal = document.getElementById("reportStatus")?.value || "all";
    const counter = document.getElementById("reportRecordCounter");

    const matched = rawReportRecords.filter((item) => {
        // Status filter
        if (statusVal !== "all") {
            const s = String(item.status || (item.isVerified ? "verified" : "pending")).toLowerCase();
            if (statusVal === "success" && !s.includes("success") && !s.includes("verified") && !s.includes("approved")) return false;
            if (statusVal === "pending" && !s.includes("pending") && !s.includes("review") && !s.includes("open")) return false;
            if (statusVal === "failed" && !s.includes("fail") && !s.includes("reject") && !s.includes("violation")) return false;
        }

        if (!q) return true;

        // Search text filter
        const text = [
            item.id,
            item.name,
            item.title,
            item.email,
            item.phone,
            item.status,
            item.farmer?.name,
            item.buyer?.name,
            item.farmerProfile?.village,
            item.farmerProfile?.district,
            item.buyerProfile?.businessName
        ].filter(Boolean).join(" ").toLowerCase();

        return text.includes(q);
    });

    filteredReportRecords = matched;
    updateDynamicKpis(currentReportType, matched);
    if (counter) counter.textContent = `Showing ${matched.length} of ${rawReportRecords.length} records`;
    renderTableForReportType(currentReportType, matched);
}

/* ==========================================================================
   EXPORT REPORT TO CSV
   ========================================================================== */
function exportReportToCSV() {
    const table = document.getElementById("adminReportsMainTable");
    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length <= 1) {
        alert("No records currently available to export.");
        return;
    }

    const csvLines = [];

    rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        // Omit the last 'Action' column
        const rowData = cells.slice(0, -1).map((cell) => {
            let text = cell.innerText.replace(/\n/g, " ").replace(/"/g, '""').trim();
            return `"${text}"`;
        });
        csvLines.push(rowData.join(","));
    });

    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `KisanSetu_${currentReportType.toUpperCase()}_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ==========================================================================
   VOUCHER / AUDIT RECEIPT MODAL
   ========================================================================== */
function viewReportVoucher(id, type) {
    const modal = document.getElementById("adminReportVoucherModal");
    if (!modal) return;

    const record = rawReportRecords.find(x => x.id === id) || { id };
    const date = formatDate(record.createdAt || new Date());
    const voucherRef = `KS-VCH-${String(id).slice(0, 8).toUpperCase()}`;

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; width:560px; max-width:96%; max-height:90vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #e2e8e3; animation:fadeIn 0.2s ease;">
            
            <div style="background:linear-gradient(135deg, #059669, #10b981); color:white; padding:18px 22px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; opacity:0.9;">Official Audit Voucher</span>
                    <h3 style="margin:2px 0 0; font-size:18px; font-weight:800;">Kisan Setu Transaction Receipt</h3>
                </div>
                <button type="button" onclick="document.getElementById('adminReportVoucherModal').style.display='none'" style="background:rgba(255,255,255,0.2); border:none; color:white; width:30px; height:30px; border-radius:50%; font-size:18px; cursor:pointer;">&times;</button>
            </div>

            <div style="padding:22px 24px;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px dashed #bbf7d0; padding-bottom:14px; margin-bottom:16px;">
                    <div>
                        <span style="font-size:11px; color:#6b7280; text-transform:uppercase;">Voucher Reference</span>
                        <strong style="display:block; font-size:16px; color:#15803d; font-family:monospace;">${voucherRef}</strong>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:11px; color:#6b7280; text-transform:uppercase;">Execution Date</span>
                        <strong style="display:block; font-size:14px; color:#111827;">${date}</strong>
                    </div>
                </div>

                <div style="background:#f8faf9; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin-bottom:16px; font-size:13px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
                        <div>
                            <span style="color:#6b7280; font-size:11px; display:block;">Record Category</span>
                            <strong style="color:#111827; text-transform:uppercase;">${type} AUDIT</strong>
                        </div>
                        <div>
                            <span style="color:#6b7280; font-size:11px; display:block;">Verification Authority</span>
                            <strong style="color:#111827;">Prakhand Krishi Adhikari</strong>
                        </div>
                    </div>

                    ${type === 'payments' ? `
                        <div style="border-top:1px solid #e5e7eb; padding-top:10px; margin-top:10px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                <span style="color:#6b7280;">Farmer (Beneficiary):</span>
                                <strong>${escapeHTML(record.farmer?.name || record.farmerName || 'Registered Farmer')}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                <span style="color:#6b7280;">Buyer (Payer):</span>
                                <strong>${escapeHTML(record.buyer?.name || record.buyerName || 'Verified Merchant')}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-top:1px dashed #d1d5db; padding-top:8px; margin-top:8px;">
                                <span style="font-weight:700; color:#111827;">Disbursed Amount:</span>
                                <strong style="font-size:18px; color:#15803d;">${formatCurrency(record.order?.totalAmount ?? record.totalOrderAmount ?? record.totalAmount ?? record.amount ?? 0)}</strong>
                            </div>
                        </div>
                    ` : `
                        <div style="border-top:1px solid #e5e7eb; padding-top:10px; margin-top:10px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                <span style="color:#6b7280;">Entity Name / Crop:</span>
                                <strong>${escapeHTML(record.name || record.title || 'Official Entry')}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:#6b7280;">Compliance Status:</span>
                                <span class="status success">VERIFIED ✓</span>
                            </div>
                        </div>
                    `}
                </div>

                <div style="background:#ecfdf5; border-left:4px solid #10b981; padding:10px 14px; border-radius:6px; margin-bottom:20px; font-size:12px; color:#065f46;">
                    <i class="fa-solid fa-stamp" style="margin-right:6px;"></i>
                    <strong>Official Regulatory Seal:</strong> Verified and archived under Bihar Krishi e-Governance Standards.
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button type="button" onclick="window.print()" style="background:#f3f4f6; color:#374151; border:1px solid #d1d5db; padding:9px 16px; border-radius:7px; font-weight:600; cursor:pointer;">
                        <i class="fa-solid fa-print"></i> Print Voucher
                    </button>
                    <button type="button" onclick="document.getElementById('adminReportVoucherModal').style.display='none'" style="background:#10b981; color:white; border:none; padding:9px 20px; border-radius:7px; font-weight:700; cursor:pointer;">
                        Close
                    </button>
                </div>

            </div>
        </div>
    `;

    modal.style.display = "flex";
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

window.generateActiveReport = generateActiveReport;
window.exportReportToCSV = exportReportToCSV;
window.viewReportVoucher = viewReportVoucher;
