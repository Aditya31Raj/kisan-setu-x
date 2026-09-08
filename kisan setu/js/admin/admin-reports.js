async function getMonthlyReport(params) {
	return apiRequest(`/admin/reports/monthly${queryString(params)}`);
}

async function getDemandForecast(params) {
	return apiRequest(`/admin/reports/forecast/demand${queryString(params)}`);
}

window.getMonthlyReport = getMonthlyReport;
window.getDemandForecast = getDemandForecast;
