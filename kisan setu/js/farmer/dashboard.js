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

function renderFarmerItems(id, items, emptyMessage) {
    const container = document.getElementById(id);
    if (!container) return;
    if (!items.length) {
        container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
    }
    container.innerHTML = items.slice(0, 4).map((item) => `
        <div class="list-item">
            <div><strong>${dashboardText(item.title || item.name || item.crop || item.produce || "Update")}</strong>
            <span>${dashboardText(item.buyerName || item.quantity || item.description || item.status || "Details unavailable")}</span></div>
            <span class="tag">${dashboardText(item.status || "New")}</span>
        </div>`).join("");
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
            getFarmerOrders({ limit: 4 }),
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

    document.getElementById("farmerListedProduceValue").textContent = produceCount;
    document.getElementById("farmerPendingOrdersValue").textContent = activeOrdersCount;
    document.getElementById("farmerRevenueValue").textContent = "₹" + Number(earningsVal).toLocaleString();
    document.getElementById("farmerCropHealthValue").textContent = "Good";

    const ordersList = orders.length ? orders : dashboardList(dashboard.orders || dashboard, ["recentOrders", "orders"]);
    renderFarmerItems("farmerRecentOrders", ordersList, "No recent orders available.");
    renderFarmerItems("farmerBuyerRequests", ordersList.filter(o => o.status === "PENDING_FARMER"), "No buyer requests available.");
    renderFarmerItems("farmerPaymentSummary", payments.length ? payments : dashboardList(dashboard.payments || dashboard, ["paymentSummary", "payments"]), "No payment data available.");
    renderFarmerItems("farmerShipmentAlerts", logistics.length ? logistics : dashboardList(dashboard.shipments || dashboard, ["shipmentAlerts", "shipments", "logistics"]), "No shipment alerts available.");
});
