function buyerDashboardList(response, keys) {
    if (Array.isArray(response)) return response;
    for (const key of keys) if (Array.isArray(response?.[key])) return response[key];
    return [];
}

function buyerDashboardValue(response, keys, fallback = "--") {
    for (const key of keys) if (response?.[key] !== undefined && response[key] !== null) return response[key];
    return fallback;
}

function buyerDashboardText(value) {
    return String(value ?? "--").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

function cropIcon(crop) {
    const n = String(crop || "").toLowerCase();
    if (n.includes("wheat") || n.includes("gehun")) return "fa-wheat-awn";
    if (n.includes("rice") || n.includes("dhan") || n.includes("paddy")) return "fa-bowl-rice";
    if (n.includes("corn") || n.includes("maize") || n.includes("makka")) return "fa-seedling";
    if (n.includes("potato") || n.includes("aalu")) return "fa-carrot";
    return "fa-wheat-awn";
}

function renderBuyerProduce(items) {
    const container = document.getElementById("buyerProduceList");
    if (!container) return;
    if (!items.length) {
        container.innerHTML = '<p class="empty-state" style="grid-column:1/-1;">No produce is available right now.</p>';
        return;
    }
    container.innerHTML = items.slice(0, 6).map((item) => {
        const rawTitle = item.cropName || item.title || item.name || "Produce";
        const displayName = rawTitle.replace(/\[Block Procurement[^\]]*\]/g, "").trim();
        const quantity = Number(item.availableQuantity ?? item.quantity ?? 0);
        const rawUnit = String(item.unit || "Quintal").trim();
        const unitName = rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1).toLowerCase();
        const price = Number(item.pricePerUnit ?? item.price ?? 0);
        const formattedPrice = price.toLocaleString("en-IN");
        const location = item.location || (item.district ? `${item.district}, ${item.state || "Bihar"}` : "Sitamarhi Central Mandi, Bihar");
        const farmerName = item.farmer?.name || item.farmerName || "Mohan Kumar (Dumra)";

        let subtitle = item.category || "Grade A Premium";
        if (item.description && item.description.includes("Moisture")) {
            const match = item.description.match(/Moisture\s*[\d\.]+%?/i);
            subtitle += match ? ` • ${match[0]}` : ` • Moisture 11.2%`;
        } else {
            subtitle += ` • Moisture 11.2%`;
        }

        const iconClass = cropIcon(displayName);
        const produceId = item.id || "";

        return `
        <div class="produce-card modern-card">
            <div class="pcm-top-row">
                <div class="pcm-title-group">
                    <div class="pcm-icon-box">
                        <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
                    </div>
                    <div class="pcm-title-meta">
                        <h3 class="pcm-title">${buyerDashboardText(displayName)}</h3>
                        <div class="pcm-subtitle">${buyerDashboardText(subtitle)}</div>
                    </div>
                </div>
                <div class="pcm-badge pcm-badge-tested">
                    <i class="fa-solid fa-check-double" style="margin-right:4px;"></i> Lab Tested
                </div>
            </div>

            <div class="pcm-rate-box">
                <div class="pcm-rate-col">
                    <span class="pcm-rate-label">Price</span>
                    <span class="pcm-rate-val">₹${formattedPrice}</span>
                </div>
                <div class="pcm-qty-col">
                    <span class="pcm-qty-label">Lot Quantity</span>
                    <span class="pcm-qty-val">${quantity} ${buyerDashboardText(unitName)}</span>
                </div>
            </div>

            <div class="pcm-details-list">
                <div class="pcm-detail-item">
                    <i class="fa-solid fa-user"></i>
                    <span>Farmer: <strong>${buyerDashboardText(farmerName)}</strong></span>
                </div>
                <div class="pcm-detail-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${buyerDashboardText(location)}</span>
                </div>
                <div class="pcm-detail-item">
                    <i class="fa-solid fa-truck"></i>
                    <span>Ready for Dispatch (Same Day)</span>
                </div>
            </div>

            <div class="pcm-actions">
                <button
                    type="button"
                    class="pcm-btn-bid"
                    onclick="window.location.href='buyer/produce.html?search=${encodeURIComponent(displayName)}'">
                    <i class="fa-solid fa-paper-plane"></i> Place Purchase Bid
                </button>
            </div>
        </div>`;
    }).join("");
}

function renderBuyerOrders(items) {
    const body = document.getElementById("buyerRecentOrders");
    if (!body) return;
    if (!items.length) {
        body.innerHTML = '<tr><td colspan="6">No recent orders available.</td></tr>';
        return;
    }
    body.innerHTML = items.slice(0, 5).map((item) => {
        const orderNum = item.orderNumber || (item.id ? `#${item.id.slice(0, 8)}` : "--");
        const cropName = (item.items || []).map(i => i.produce?.cropName || i.produceTitle).filter(Boolean).join(", ") || item.produceName || item.produce || item.title || "Agricultural Produce";
        const farmerName = item.farmer?.name || item.farmerName || "Farmer";
        const totalQty = (item.items || []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || item.quantity || "--";
        const unit = item.items?.[0]?.produce?.unit || item.items?.[0]?.unit || item.unit || "";
        const amount = item.totalAmount !== undefined ? item.totalAmount : (item.amount || item.total || "--");
        const status = item.status || "PENDING";
        return `<tr>
            <td><strong>${buyerDashboardText(orderNum)}</strong></td>
            <td>${buyerDashboardText(cropName)}</td>
            <td>${buyerDashboardText(farmerName)}</td>
            <td>${buyerDashboardText(totalQty)} ${buyerDashboardText(unit)}</td>
            <td>₹${buyerDashboardText(amount)}</td>
            <td><span class="status ${status.toLowerCase()}">${buyerDashboardText(status)}</span></td>
        </tr>`;
    }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
    const localProfile = getRegistrationProfile("buyer") || {};
    let profile = localProfile;
    let dashboard = {};
    let produceItems = [];
    let recentOrders = [];
    let activeDelivery = null;

    try {
        const [profData, dashData, produceData, ordersData, logisticsData] = await Promise.allSettled([
            getBuyerProfile(),
            getBuyerDashboard(),
            apiRequest("/produce?limit=6"),
            apiRequest("/orders?limit=5"),
            apiRequest("/logistics?limit=1")
        ]);

        if (profData.status === "fulfilled" && profData.value) profile = { ...localProfile, ...profData.value };
        if (dashData.status === "fulfilled" && dashData.value) dashboard = dashData.value;
        if (produceData.status === "fulfilled" && produceData.value) produceItems = produceData.value.items || (Array.isArray(produceData.value) ? produceData.value : []);
        if (ordersData.status === "fulfilled" && ordersData.value) recentOrders = ordersData.value.items || (Array.isArray(ordersData.value) ? ordersData.value : []);
        if (logisticsData.status === "fulfilled" && logisticsData.value) {
            const list = logisticsData.value.items || (Array.isArray(logisticsData.value) ? logisticsData.value : []);
            if (list.length) activeDelivery = list[0];
        }
    } catch (error) {
        console.warn("Buyer dashboard data unavailable.", error);
    }

    const name = profile.name || profile.ownerName || profile.businessName || "there";
    const sidebarEl = document.getElementById("buyerSidebarName");
    const welcomeEl = document.getElementById("buyerWelcomeName");
    if (sidebarEl) sidebarEl.textContent = profile.businessName || name;
    if (welcomeEl) welcomeEl.textContent = name;

    const stats = dashboard.stats || dashboard;
    const activeOrdersVal = buyerDashboardValue(stats, ["activeOrders", "ordersCount"], "0");
    const purchasesVal = buyerDashboardValue(stats, ["transactionValue", "totalPurchases", "purchases"], "0");
    const pendingPaymentsVal = buyerDashboardValue(stats, ["pendingPayments", "paymentDue"], "0");
    const deliveriesVal = buyerDashboardValue(stats, ["activeLogistics", "deliveries"], "0");

    const activeOrdersEl = document.getElementById("buyerActiveOrdersValue");
    const purchasesEl = document.getElementById("buyerPurchasesValue");
    const pendingPaymentsEl = document.getElementById("buyerPendingPaymentsValue");
    const deliveriesEl = document.getElementById("buyerDeliveriesValue");

    if (activeOrdersEl) activeOrdersEl.textContent = activeOrdersVal;
    if (purchasesEl) purchasesEl.textContent = "₹" + Number(purchasesVal).toLocaleString();
    if (pendingPaymentsEl) pendingPaymentsEl.textContent = pendingPaymentsVal;
    if (deliveriesEl) deliveriesEl.textContent = deliveriesVal;

    renderBuyerProduce(produceItems.length ? produceItems : buyerDashboardList(dashboard.produce || dashboard, ["availableProduce", "produce", "items"]));
    renderBuyerOrders(recentOrders.length ? recentOrders : buyerDashboardList(dashboard.orders || dashboard, ["recentOrders", "orders"]));

    const delivery = activeDelivery || buyerDashboardList(dashboard.delivery || dashboard, ["activeDelivery", "deliveries"])[0] || dashboard.activeDelivery || {};
    const deliveryTitleEl = document.getElementById("buyerActiveDeliveryTitle");
    const deliveryStatusEl = document.getElementById("buyerActiveDeliveryStatus");
    if (deliveryTitleEl) deliveryTitleEl.textContent = delivery.vehicleReference || delivery.orderNumber || "No active delivery";
    if (deliveryStatusEl) deliveryStatusEl.textContent = delivery.status || "No active deliveries";
});
