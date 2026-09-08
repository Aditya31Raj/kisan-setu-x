let currentFarmerLogisticsPage = 1;
const farmerLogisticsPageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
	const trackBtn = document.getElementById("trackBtn");
	if (trackBtn) {
		trackBtn.addEventListener("click", async function () {
			const logisticsId = document.getElementById("logisticsId")?.value || "";
			if (!logisticsId) {
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="error-message">Please enter a logistics ID.</div>`;
				return;
			}
			try {
				const result = await getFarmerLogistics({ id: logisticsId });
				const data = result || {};
				document.getElementById("displayLogisticsId").textContent = data.id || logisticsId;
				document.getElementById("orderId").textContent = data.orderId || "N/A";
				document.getElementById("logisticsStatus").textContent = data.status || "N/A";
				document.getElementById("vehicleReference").textContent = data.vehicle || data.vehicleReference || "N/A";
				document.getElementById("driverReference").textContent = data.driver || data.driverReference || "N/A";
				document.getElementById("estimatedDelivery").textContent = data.estimatedDelivery || "N/A";
				document.getElementById("actualDelivery").textContent = data.actualDelivery || "Pending";
				document.getElementById("logisticsDetails").style.display = "block";
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = "";
			} catch (error) {
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="error-message">${escapeHTML(error.message || "Unable to track delivery.")}</div>`;
			}
		});
	}

	const updateBtn = document.getElementById("updateStatusBtn");
	if (updateBtn) {
		updateBtn.addEventListener("click", async function () {
			const logisticsId = document.getElementById("logisticsId")?.value || "";
			const status = document.getElementById("newStatus")?.value || "";
			if (!logisticsId || !status) {
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="error-message">Please select a delivery status.</div>`;
				return;
			}
			try {
				await apiRequest(`/farmers/logistics/${encodeURIComponent(logisticsId)}/status`, { method: "PATCH", body: { status } });
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="success-message">Delivery status updated.</div>`;
			} catch (error) {
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="error-message">${escapeHTML(error.message || "Update failed.")}</div>`;
			}
		});
	}

	setupFarmerLogout();
});

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

window.loadFarmerLogistics = getFarmerLogistics;
