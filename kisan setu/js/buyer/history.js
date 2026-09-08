async function getBuyerOrderHistory(params = {}) {
    return apiRequest(`/orders${queryString({ ...params, status: "COMPLETED" })}`);
}

window.getBuyerOrderHistory = getBuyerOrderHistory;
