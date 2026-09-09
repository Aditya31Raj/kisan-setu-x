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
    const value = String(crop || "").toLowerCase();
    if (value.includes("potato")) return "fa-carrot";
    if (value.includes("wheat") || value.includes("rice") || value.includes("paddy")) return "fa-wheat-awn";
    if (value.includes("tomato") || value.includes("onion")) return "fa-apple-whole";
    return "fa-seedling";
}

function renderBuyerProduce(items) {
    const container = document.getElementById("buyerProduceList");
    if (!container) return;
    if (!items.length) {
        container.innerHTML = '<p class="empty-state">No produce is available right now.</p>';
        return;
    }
    container.innerHTML = items.slice(0, 6).map((item) => {
        const name = item.cropName || item.title || item.name || "Produce";
        const quantity = item.availableQuantity ?? item.quantity ?? "--";
        const unit = item.unit || "kg";
        const price = item.pricePerUnit ?? item.price ?? "--";
        const location = item.location || (item.district ? `${item.district}, ${item.state || ''}` : "Direct Farm");
        const farmer = item.farmer?.name || item.farmerName || "Verified Farmer";
        return `<div class="produce-card">
            <div class="produce-image"><i class="fa-solid ${cropIcon(name)}" aria-hidden="true"></i></div>
            <div class="produce-details">
                <h4>${buyerDashboardText(name)}</h4>
                <p>${buyerDashboardText(quantity)} ${buyerDashboardText(unit)} available<br>${buyerDashboardText(location)}<br>Farmer: ${buyerDashboardText(farmer)}</p>
                <div class="price"><strong>₹${buyerDashboardText(price)}/${buyerDashboardText(unit)}</strong><button type="button" onclick="requestBuy('${buyerDashboardText(name)}')">Request</button></div>
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
