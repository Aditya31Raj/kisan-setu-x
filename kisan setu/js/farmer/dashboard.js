function dashboardList(response, keys) {
    if (Array.isArray(response)) return response;
    for (const key of keys) if (Array.isArray(response?.[key])) return response[key];
    return [];
}

function dashboardValue(response, keys, fallback = "--") {
    for (const key of keys) if (response?.[key] !== undefined && response[key] !== null) return response[key];
    return fallback;
}

function dashboardText(value) {
    return String(value ?? "--").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

function setFarmerDashboardProfile(profile) {
    const name = profile?.name || profile?.fullName || "there";
    document.getElementById("farmerSidebarName").textContent = name;
    document.getElementById("farmerTopbarName").textContent = name;
    document.getElementById("farmerWelcomeName").textContent = name;
    document.getElementById("farmerSidebarId").textContent = `Farmer ID: ${profile?.id || profile?.farmerId || "--"}`;
}

function renderFarmerOrdersList(id, orders, emptyMessage) {
    const container = document.getElementById(id);
    if (!container) return;
    if (!orders || !orders.length) {
        container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
    }
    container.innerHTML = orders.slice(0, 5).map((order) => {
        const cropNames = (order.items || []).map(i => i.produce?.cropName || i.produceTitle || "Produce").join(", ") || order.crop || "Produce";
        const buyerName = order.buyer?.name || order.buyerName || "Buyer";
        const total = order.totalAmount ? `₹${Number(order.totalAmount).toLocaleString()}` : "";
        const orderNum = order.orderNumber || (order.id ? `#${order.id.slice(0, 8)}` : "");
        const status = order.status || "PENDING";
        const statusClass = status === "ACCEPTED" || status === "COMPLETED" ? "tag success" : status === "REJECTED" || status === "CANCELLED" ? "tag danger" : "tag warning";
        return `
            <div class="list-item">
                <div>
                    <strong>${dashboardText(cropNames)} <small style="color:var(--text-muted,#737b75);font-weight:normal;">(${dashboardText(orderNum)})</small></strong>
                    <span>Buyer: ${dashboardText(buyerName)} ${total ? `• ${total}` : ""}</span>
                </div>
                <span class="${statusClass}">${dashboardText(status)}</span>
            </div>`;
    }).join("");
}

function renderFarmerGenericItems(id, items, emptyMessage) {
    const container = document.getElementById(id);
    if (!container) return;
    if (!items || !items.length) {
        container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
    }
    container.innerHTML = items.slice(0, 4).map((item) => {
        const isPayment = id === "farmerPaymentSummary" || item.provider || item.orderId;
        let title = item.title || item.name || item.method || item.trackingNumber || "Record";
        let sub = item.description || item.carrierName || item.status || "Details";

        if (isPayment) {
            const orderRef = item.order?.orderNumber || (item.orderId ? `#${String(item.orderId).slice(0, 8)}` : null);
            title = orderRef ? `Payment for ${orderRef}` : (item.id ? `Payment #${String(item.id).slice(0, 8)}` : "Order Payment");
            const rawAmt = Number(item.order?.totalAmount ?? item.totalOrderAmount ?? item.totalAmount ?? item.amount ?? 0);
            sub = `Total Order Amount: ₹${rawAmt.toLocaleString('en-IN')}`;
        } else if (item.amount) {
            sub = `₹${Number(item.amount).toLocaleString('en-IN')}`;
        }

        return `
            <div class="list-item">
                <div><strong>${dashboardText(title)}</strong>
                <span>${dashboardText(sub)}</span></div>
                <span class="tag">${dashboardText(item.status || "Active")}</span>
            </div>`;
    }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
    const localProfile = getRegistrationProfile("farmer") || {};
    let profile = localProfile;
    let dashboard = {};
    let orders = [];
    let payments = [];
    let logistics = [];

    try {
        const [profData, dashData, ordersData, paymentsData, logisticsData] = await Promise.allSettled([
            getFarmerProfile(),
            getFarmerDashboard(),
            getFarmerOrders({ limit: 10 }),
            getFarmerPayments({ limit: 4 }),
            getFarmerLogistics({ limit: 4 })
        ]);

        if (profData.status === "fulfilled" && profData.value) profile = { ...localProfile, ...profData.value };
        if (dashData.status === "fulfilled" && dashData.value) dashboard = dashData.value;
        if (ordersData.status === "fulfilled" && ordersData.value) orders = ordersData.value.items || (Array.isArray(ordersData.value) ? ordersData.value : []);
        if (paymentsData.status === "fulfilled" && paymentsData.value) payments = paymentsData.value.items || (Array.isArray(paymentsData.value) ? paymentsData.value : []);
        if (logisticsData.status === "fulfilled" && logisticsData.value) logistics = logisticsData.value.items || (Array.isArray(logisticsData.value) ? logisticsData.value : []);
    } catch (error) {
        console.warn("Farmer dashboard data unavailable.", error);
    }

    setFarmerDashboardProfile(profile);
    const stats = dashboard.stats || dashboard;

    const produceCount = dashboardValue(stats, ["totalProduceListings", "listedProduce", "produceCount"], "0");
    const activeOrdersCount = dashboardValue(stats, ["activeOrders", "pendingOrders", "ordersCount"], "0");
    const earningsVal = dashboardValue(stats, ["totalEarnings", "monthlyRevenue", "revenue"], "0");

    const produceEl = document.getElementById("farmerListedProduceValue");
    const pendingEl = document.getElementById("farmerPendingOrdersValue");
    const revenueEl = document.getElementById("farmerRevenueValue");
    const healthEl = document.getElementById("farmerCropHealthValue");

    if (produceEl) produceEl.textContent = produceCount;
    if (pendingEl) pendingEl.textContent = activeOrdersCount;
    if (revenueEl) revenueEl.textContent = "₹" + Number(earningsVal).toLocaleString();
    if (healthEl) healthEl.textContent = "Optimal";

    const noteProduce = document.getElementById("farmerListedProduceNote");
    const notePending = document.getElementById("farmerPendingOrdersNote");
    const noteRevenue = document.getElementById("farmerRevenueNote");
    const noteHealth = document.getElementById("farmerCropHealthNote");
    const welcomeMsg = document.getElementById("farmerWelcomeMessage");

    if (noteProduce) noteProduce.textContent = "Active in marketplace";
    if (notePending) notePending.textContent = "Orders awaiting fulfillment";
    if (noteRevenue) noteRevenue.textContent = "All-time cleared earnings";
    if (noteHealth) noteHealth.textContent = "Monitored healthy";
    if (welcomeMsg) welcomeMsg.textContent = `You have ${activeOrdersCount} pending orders and ${produceCount} active listings.`;

    const ordersList = orders.length ? orders : dashboardList(dashboard.orders || dashboard, ["recentOrders", "orders"]);
    renderFarmerOrdersList("farmerRecentOrders", ordersList, "No recent orders available.");
    renderFarmerOrdersList("farmerBuyerRequests", ordersList.filter(o => o.status === "PENDING_FARMER"), "No buyer requests pending.");
    renderFarmerGenericItems("farmerPaymentSummary", payments.length ? payments : dashboardList(dashboard.payments || dashboard, ["paymentSummary", "payments"]), "No payment records found.");
    renderFarmerGenericItems("farmerShipmentAlerts", logistics.length ? logistics : dashboardList(dashboard.shipments || dashboard, ["shipmentAlerts", "shipments", "logistics"]), "No shipment alerts found.");
});
