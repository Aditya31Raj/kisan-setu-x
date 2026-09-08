async function getAdminOrders(params) {
	return apiRequest(`/admin/orders${queryString(params)}`);
}

async function getAdminOrder(orderId) {
	return apiRequest(`/orders/${encodeURIComponent(orderId)}`);
}

window.getAdminOrders = getAdminOrders;
window.getAdminOrder = getAdminOrder;
