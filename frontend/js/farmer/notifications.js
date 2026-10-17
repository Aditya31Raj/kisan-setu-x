let currentFarmerNotificationsPage = 1;
const farmerNotificationsPageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerNotifications();
	setupFarmerNotificationControls();
	setupFarmerLogout();
});

async function loadFarmerNotifications(page = 1) {
	currentFarmerNotificationsPage = page;
	const container = document.getElementById("notificationsContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `<p>Loading notifications...</p>`;
	try {
		const response = await getFarmerNotifications({ page: currentFarmerNotificationsPage, limit: farmerNotificationsPageLimit });
		const data = response || {};
		const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.notifications) ? data.notifications : [])));

		if (!list.length) {
			container.innerHTML = `<div class="no-notifications"><h3>No notifications</h3><p>You do not have any new updates.</p></div>`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerNotificationsPage}`;
			return;
		}

		container.innerHTML = "";
		list.forEach((notification) => {
			const item = document.createElement("div");
			item.className = "notification-item";
			item.innerHTML = `
				<h3>${escapeHTML(notification.title || "New update")}</h3>
				<p>${escapeHTML(notification.message || "No details available.")}</p>
				<p><strong>Time:</strong> ${escapeHTML(notification.createdAt || "Just now")}</p>
			`;
			container.appendChild(item);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerNotificationsPage}`;
	} catch (error) {
		console.error("Farmer notifications loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error"><i class="fa-solid fa-bell-slash"></i><div><strong>Notifications are temporarily unavailable</strong><p>${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}</p></div></div>`;
	}
}

function setupFarmerNotificationControls() {
	const refreshBtn = document.getElementById("refreshNotificationsBtn");
	if (refreshBtn) refreshBtn.addEventListener("click", () => loadFarmerNotifications(1));

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) prevBtn.addEventListener("click", () => { if (currentFarmerNotificationsPage > 1) loadFarmerNotifications(currentFarmerNotificationsPage - 1); });

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) nextBtn.addEventListener("click", () => loadFarmerNotifications(currentFarmerNotificationsPage + 1));
}

function setupFarmerLogout() {
	const logoutBtn = document.getElementById("logoutBtn");
	if (!logoutBtn) return;
	logoutBtn.addEventListener("click", async function () {
		try {
			await logoutUser();
			window.location.href = "../index.html";
		} catch (error) {
			console.error("Farmer logout failed:", error);
			window.location.href = "../index.html";
		}
	});
}

window.loadFarmerNotifications = loadFarmerNotifications;
