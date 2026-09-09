let allLogisticsShipments = [];
let currentLogisticsFilter = "ALL";

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
	if (!dateStr) return "N/A";
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return String(dateStr);
	return d.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric"
	});
}

document.addEventListener("DOMContentLoaded", async function () {
	try {
		if (typeof ensureAdminAuth === "function") {
			const admin = await ensureAdminAuth();
			if (!admin) return;
			if (admin.name) {
				const el = document.getElementById("adminName");
				if (el) el.textContent = admin.name;
			}
		}
	} catch (e) {
		console.warn("Admin auth check:", e);
	}

	setupFilterTabs();
	setupAssignModal();
	setupStatusModal();
	loadAdminLogistics();
});

async function loadAdminLogistics() {
	const tbody = document.getElementById("logisticsTableBody");
	if (!tbody) return;

	try {
		const res = await apiRequest("/logistics");
		allLogisticsShipments = Array.isArray(res) ? res : (res?.items || res?.data || []);
		updateStats(allLogisticsShipments);
		renderTable(allLogisticsShipments, currentLogisticsFilter);
	} catch (err) {
		console.error("Failed to load admin logistics:", err);
		tbody.innerHTML = `
			<tr>
				<td colspan="8" style="text-align:center; padding:36px; color:#b91c1c;">
					<i class="fa-solid fa-circle-exclamation" style="margin-right:8px;"></i>
					Failed to load logistics requests: ${escapeHTML(friendlyErrorMessage(err))}
				</td>
			</tr>
		`;
	}
}

function updateStats(items) {
	const total = items.length;
	const pending = items.filter(i => i.status === "PENDING").length;
	const inTransit = items.filter(i => ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(i.status)).length;
	const delivered = items.filter(i => i.status === "DELIVERED").length;

	const statTotal = document.getElementById("statTotal");
	const statPending = document.getElementById("statPending");
	const statInTransit = document.getElementById("statInTransit");
	const statDelivered = document.getElementById("statDelivered");
	const countPendingTab = document.getElementById("countPendingTab");

	if (statTotal) statTotal.textContent = total;
	if (statPending) statPending.textContent = pending;
	if (statInTransit) statInTransit.textContent = inTransit;
	if (statDelivered) statDelivered.textContent = delivered;
	if (countPendingTab) countPendingTab.textContent = pending;
}

function renderTable(items, filter = "ALL") {
	const tbody = document.getElementById("logisticsTableBody");
	if (!tbody) return;

	let filtered = items;
	if (filter === "PENDING") filtered = items.filter(i => i.status === "PENDING");
	else if (filter === "ASSIGNED") filtered = items.filter(i => i.status === "ASSIGNED");
	else if (filter === "IN_TRANSIT") filtered = items.filter(i => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(i.status));
	else if (filter === "DELIVERED") filtered = items.filter(i => i.status === "DELIVERED");

	if (!filtered.length) {
		tbody.innerHTML = `
			<tr>
				<td colspan="8" style="text-align:center; padding:36px; color:#6b7280;">
					<i class="fa-solid fa-truck" style="font-size:28px; color:#cbd5e1; margin-bottom:8px; display:block;"></i>
					No logistics shipments found under this status.
				</td>
			</tr>
		`;
		return;
	}

	tbody.innerHTML = filtered.map(s => {
		const orderNum = s.order?.orderNumber || (s.orderId ? `KS-${s.orderId.slice(0, 8)}` : "N/A");
		const farmer = s.order?.farmer?.name || "Farmer";
		const farmerPhone = s.order?.farmer?.phone || "";
		const buyer = s.order?.buyer?.name || "Buyer";
		const buyerPhone = s.order?.buyer?.phone || "";
		const itemsSummary = (s.order?.items || []).map(i => `${i.produce?.crop?.name || i.produce?.title || 'Produce'} (${i.quantity} ${i.produce?.unit || 'KG'})`).join(", ");

		let badgeClass = "badge-pending";
		if (s.status === "ASSIGNED") badgeClass = "badge-assigned";
		else if (["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)) badgeClass = "badge-intransit";
		else if (s.status === "DELIVERED") badgeClass = "badge-delivered";

		const transportInfo = s.vehicleReference
			? `<strong>${escapeHTML(s.vehicleReference)}</strong><br><span style="color:#666; font-size:11px;">Driver: ${escapeHTML(s.driverReference || 'Assigned')}</span>`
			: `<span style="color:#d97706; font-weight:600; font-size:11px;"><i class="fa-solid fa-clock"></i> Needs Fleet Assignment</span>`;

		let actionButtons = "";
		if (s.status === "PENDING") {
			actionButtons = `
				<button type="button" class="btn-assign" onclick="openAssignModal('${s.id}')">
					<i class="fa-solid fa-check"></i> Assign Fleet
				</button>
			`;
		} else {
			actionButtons = `
				<button type="button" class="btn-update" onclick="openStatusModal('${s.id}', '${s.status}')">
					<i class="fa-solid fa-pen-to-square"></i> Status
				</button>
			`;
		}

		return `
			<tr>
				<td><strong>#${escapeHTML(s.id.slice(0, 8).toUpperCase())}</strong><br><span style="color:#94a3b8; font-size:10px;">${formatDate(s.createdAt)}</span></td>
				<td><strong>#${escapeHTML(orderNum)}</strong></td>
				<td>
					<strong>${escapeHTML(farmer)}</strong><br>
					<span style="color:#666; font-size:11px;">📍 ${escapeHTML(s.pickupAddress?.line1 || "Farm location")}</span>
					${farmerPhone ? `<br><span style="color:#777; font-size:10px;">📞 ${escapeHTML(farmerPhone)}</span>` : ""}
				</td>
				<td>
					<strong>${escapeHTML(buyer)}</strong><br>
					<span style="color:#666; font-size:11px;">🏢 ${escapeHTML(s.destinationAddress?.line1 || "Warehouse / Mandi")}</span>
					${buyerPhone ? `<br><span style="color:#777; font-size:10px;">📞 ${escapeHTML(buyerPhone)}</span>` : ""}
				</td>
				<td><span style="color:#333; font-weight:500;">${escapeHTML(itemsSummary || "Produce item")}</span></td>
				<td>${transportInfo}</td>
				<td><span class="badge ${badgeClass}">${escapeHTML((s.status || 'PENDING').replace(/_/g, ' '))}</span></td>
				<td>${actionButtons}</td>
			</tr>
		`;
	}).join("");
}

function setupFilterTabs() {
	const tabs = document.querySelectorAll(".tab-btn");
	tabs.forEach(btn => {
		btn.addEventListener("click", function () {
			tabs.forEach(t => t.classList.remove("active"));
			this.classList.add("active");
			currentLogisticsFilter = this.getAttribute("data-filter");
			renderTable(allLogisticsShipments, currentLogisticsFilter);
		});
	});
}

function openAssignModal(logisticsId) {
	const shipment = allLogisticsShipments.find(s => s.id === logisticsId);
	if (!shipment) return;

	const modal = document.getElementById("assignModal");
	if (!modal) return;

	document.getElementById("assignLogisticsId").value = shipment.id;
	document.getElementById("assignModalOrderNum").textContent = shipment.order?.orderNumber || `KS-${shipment.orderId?.slice(0, 8)}`;
	document.getElementById("assignModalFarmer").textContent = `${shipment.order?.farmer?.name || 'Farmer'} (${shipment.pickupAddress?.line1 || 'Farm'})`;
	document.getElementById("assignModalBuyer").textContent = `${shipment.order?.buyer?.name || 'Buyer'} (${shipment.destinationAddress?.line1 || 'Mandi'})`;

	const itemsSummary = (shipment.order?.items || []).map(i => `${i.produce?.crop?.name || i.produce?.title || 'Produce'} (${i.quantity} ${i.produce?.unit || 'KG'})`).join(", ");
	document.getElementById("assignModalProduce").textContent = itemsSummary || "Agricultural produce";

	// Default delivery date to tomorrow
	const dateInput = document.getElementById("estimatedDeliveryInput");
	if (dateInput) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		dateInput.value = tomorrow.toISOString().split("T")[0];
	}

	const errBox = document.getElementById("assignFormError");
	if (errBox) errBox.style.display = "none";

	modal.style.display = "flex";
}

function setupAssignModal() {
	const modal = document.getElementById("assignModal");
	const closeBtn = document.getElementById("closeAssignModalBtn");
	const cancelBtn = document.getElementById("cancelAssignBtn");
	if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
	if (cancelBtn) cancelBtn.addEventListener("click", () => modal.style.display = "none");

	const form = document.getElementById("assignTransportForm");
	if (form) {
		form.addEventListener("submit", async function (e) {
			e.preventDefault();
			const id = document.getElementById("assignLogisticsId").value;
			const vehicle = document.getElementById("vehicleReferenceInput").value.trim();
			const driver = document.getElementById("driverReferenceInput").value.trim();
			const date = document.getElementById("estimatedDeliveryInput").value;
			const submitBtn = document.getElementById("submitAssignBtn");
			const errBox = document.getElementById("assignFormError");

			if (!vehicle || !driver) {
				if (errBox) {
					errBox.textContent = "Please enter both vehicle registration and driver contact.";
					errBox.style.display = "block";
				}
				return;
			}

			submitBtn.disabled = true;
			submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Assigning...';
			if (errBox) errBox.style.display = "none";

			try {
				await apiRequest(`/logistics/${encodeURIComponent(id)}/status`, {
					method: "PATCH",
					body: {
						status: "ASSIGNED",
						vehicleReference: vehicle,
						driverReference: driver,
						estimatedDelivery: date ? new Date(date).toISOString() : undefined
					}
				});

				modal.style.display = "none";
				alert("Transport fleet successfully assigned! Both Farmer and Buyer have been notified.");
				loadAdminLogistics();
			} catch (err) {
				if (errBox) {
					errBox.textContent = friendlyErrorMessage(err, "Failed to assign transport fleet.");
					errBox.style.display = "block";
				}
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent = "Confirm & Dispatch";
			}
		});
	}
}

function openStatusModal(logisticsId, currentStatus) {
	const modal = document.getElementById("statusModal");
	if (!modal) return;
	document.getElementById("statusLogisticsId").value = logisticsId;
	const sel = document.getElementById("statusSelect");
	if (sel && currentStatus) sel.value = currentStatus;
	modal.style.display = "flex";
}

function setupStatusModal() {
	const modal = document.getElementById("statusModal");
	const closeBtn = document.getElementById("closeStatusModalBtn");
	const cancelBtn = document.getElementById("cancelStatusBtn");
	if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
	if (cancelBtn) cancelBtn.addEventListener("click", () => modal.style.display = "none");

	const form = document.getElementById("updateStatusForm");
	if (form) {
		form.addEventListener("submit", async function (e) {
			e.preventDefault();
			const id = document.getElementById("statusLogisticsId").value;
			const status = document.getElementById("statusSelect").value;
			const submitBtn = document.getElementById("submitStatusBtn");

			submitBtn.disabled = true;
			submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

			try {
				await apiRequest(`/logistics/${encodeURIComponent(id)}/status`, {
					method: "PATCH",
					body: { status }
				});

				modal.style.display = "none";
				alert("Shipment status updated successfully.");
				loadAdminLogistics();
			} catch (err) {
				alert("Failed to update status: " + friendlyErrorMessage(err));
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent = "Update Status";
			}
		});
	}
}

window.openAssignModal = openAssignModal;
window.openStatusModal = openStatusModal;
