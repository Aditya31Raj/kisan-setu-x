async function getAdminPayments(params) {
	return apiRequest(`/admin/payments${queryString(params)}`);
}

async function getAdminPayment(paymentId) {
	return apiRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

window.getAdminPayments = getAdminPayments;
window.getAdminPayment = getAdminPayment;
