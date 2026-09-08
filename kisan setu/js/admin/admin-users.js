async function getAdminUsers(params) {
	return apiRequest(`/admin/users${queryString(params)}`);
}

async function updateAdminUser(userId, changes) {
	return apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
		method: "PATCH",
		body: changes
	});
}

async function getAdminFarmers(params) {
	return apiRequest(`/admin/farmers${queryString(params)}`);
}

async function getAdminBuyers(params) {
	return apiRequest(`/admin/buyers${queryString(params)}`);
}

window.getAdminUsers = getAdminUsers;
window.updateAdminUser = updateAdminUser;
window.getAdminFarmers = getAdminFarmers;
window.getAdminBuyers = getAdminBuyers;
