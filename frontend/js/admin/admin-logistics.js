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
				<div style="display:flex; flex-direction:column; gap:6px; min-width:130px;">
					<button type="button" class="btn-assign" onclick="openAssignModal('${s.id}', 'manual')" style="font-size:11.5px; padding:6px 10px; display:flex; align-items:center; justify-content:center; gap:5px;" title="Manually assign a fleet driver">
						<i class="fa-solid fa-user-pen"></i> Assign Manually
					</button>
					<button type="button" class="btn-samriddhi-assign" onclick="openAssignModal('${s.id}', 'samriddhi')" style="background:#059669; color:white; border:none; padding:6px 10px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 1px 3px rgba(5,150,105,0.25);" title="Let Ask Samriddhi AI match the best driver">
						🤖 Ask Samriddhi
					</button>
				</div>
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

function calculateShipmentWeightKg(shipment) {
	let totalKg = 0;
	(shipment?.order?.items || []).forEach(item => {
		const q = Number(item.quantity) || 0;
		const u = String(item.produce?.unit || "QUINTAL").toUpperCase();
		totalKg += u.includes("QUINTAL") ? q * 100 : u.includes("TON") ? q * 1000 : q;
	});
	return totalKg > 0 ? totalKg : 350;
}

function getOptimalDriverForWeight(weightKg) {
	if (weightKg <= 450) {
		return {
			id: "AV 60",
			name: "Ayush Vardhan (+91 98563 00060)",
			vehicle: "Piaggio Ape E-City [BR-06-AV-0060] (ID: AV 60)",
			capacity: "450 kg",
			reason: `Optimal for compact payload (${weightKg} kg). Zero-emission electric cargo with lowest logistics cost.`
		};
	} else if (weightKg <= 1000) {
		return {
			id: "SN 365",
			name: "Soham Nayek (+91 98321 00365)",
			vehicle: "Tata Ace [BR-06-SN-0365] (ID: SN 365)",
			capacity: "1,000 kg",
			reason: `Optimal 1,000 kg capacity match for ${weightKg} kg shipment. Best fuel economy for village pickup.`
		};
	} else if (weightKg <= 1250) {
		return {
			id: "PB 25",
			name: "Piyush Bhagat (+91 98674 00025)",
			vehicle: "Ashok Leyland Dost+ [BR-06-PB-0025] (ID: PB 25)",
			capacity: "1,250 kg",
			reason: `Optimal 1,250 kg capacity match for ${weightKg} kg shipment. Fast inter-block transit to Mandi.`
		};
	} else if (weightKg <= 1500) {
		return {
			id: "HS 265",
			name: "Harsh Sahu (+91 98452 00265)",
			vehicle: "Mahindra Bolero Maxi [BR-06-HS-0265] (ID: HS 265)",
			capacity: "1,500 kg",
			reason: `Rugged 1,500 kg Bolero Maxi carrier suited for rough-terrain ${weightKg} kg farm collection.`
		};
	} else {
		return {
			id: "AK 47",
			name: "Abhijeet Kumar (+91 98785 00047)",
			vehicle: "Eicher Pro 2049 [BR-06-AK-0047] (ID: AK 47)",
			capacity: "4,000 kg",
			reason: `Heavy commercial 4,000 kg carrier required to safely transport ${weightKg} kg multi-quintal bulk consignment.`
		};
	}
}

function applyAskSamriddhiRecommendation(shipment) {
	if (!shipment) return;
	const weightKg = calculateShipmentWeightKg(shipment);
	const rec = getOptimalDriverForWeight(weightKg);

	const quickSelect = document.getElementById("quickDriverSelect");
	if (quickSelect) quickSelect.value = rec.id;

	const vInput = document.getElementById("vehicleReferenceInput");
	if (vInput) vInput.value = rec.vehicle;

	const dInput = document.getElementById("driverReferenceInput");
	if (dInput) dInput.value = rec.name;

	const badge = document.getElementById("samriddhiMatchBadge");
	if (badge) {
		badge.innerHTML = `
			<div style="display:flex; align-items:flex-start; gap:8px;">
				<span style="font-size:16px;">🤖</span>
				<div>
					<strong style="color:#065f46;">Ask Samriddhi AI Recommendation:</strong>
					<div style="font-size:12px; color:#1e293b; margin-top:2px;">
						Matched <strong>${escapeHTML(rec.name)}</strong> &bull; ${escapeHTML(rec.vehicle)} (Max ${rec.capacity})
					</div>
					<div style="font-size:11px; color:#475569; margin-top:2px;">
						💡 ${escapeHTML(rec.reason)}
					</div>
				</div>
			</div>
		`;
		badge.style.display = "block";
	}

	const errBox = document.getElementById("assignFormError");
	if (errBox) errBox.style.display = "none";
}

function openAssignModal(logisticsId, mode = "manual") {
	const shipment = allLogisticsShipments.find(s => s.id === logisticsId);
	if (!shipment) return;

	const modal = document.getElementById("assignModal");
	if (!modal) return;

	document.getElementById("assignLogisticsId").value = shipment.id;
	document.getElementById("assignModalOrderNum").textContent = shipment.order?.orderNumber || `KS-${shipment.orderId?.slice(0, 8)}`;
	document.getElementById("assignModalFarmer").textContent = `${shipment.order?.farmer?.name || 'Farmer'} (${shipment.pickupAddress?.line1 || 'Farm'})`;
	document.getElementById("assignModalBuyer").textContent = `${shipment.order?.buyer?.name || 'Buyer'} (${shipment.destinationAddress?.line1 || 'Mandi'})`;

	const itemsSummary = (shipment.order?.items || []).map(i => `${i.produce?.crop?.name || i.produce?.title || 'Produce'} (${i.quantity} ${i.produce?.unit || 'KG'})`).join(", ");
	const weightKg = calculateShipmentWeightKg(shipment);
	document.getElementById("assignModalProduce").textContent = `${itemsSummary || "Agricultural produce"} [Total Est. Weight: ${weightKg} kg]`;

	// Default delivery date to tomorrow
	const dateInput = document.getElementById("estimatedDeliveryInput");
	if (dateInput) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		dateInput.value = tomorrow.toISOString().split("T")[0];
	}

	const errBox = document.getElementById("assignFormError");
	if (errBox) errBox.style.display = "none";

	const quickSelect = document.getElementById("quickDriverSelect");
	const vInput = document.getElementById("vehicleReferenceInput");
	const dInput = document.getElementById("driverReferenceInput");
	const badge = document.getElementById("samriddhiMatchBadge");

	if (mode === "samriddhi") {
		applyAskSamriddhiRecommendation(shipment);
	} else {
		// Manual mode: reset dropdown and fields so admin has full manual control
		if (quickSelect) quickSelect.value = "";
		if (vInput) vInput.value = "";
		if (dInput) dInput.value = "";
		if (badge) badge.style.display = "none";
	}

	modal.style.display = "flex";
}

function setupAssignModal() {
	const modal = document.getElementById("assignModal");
	const closeBtn = document.getElementById("closeAssignModalBtn");
	const cancelBtn = document.getElementById("cancelAssignBtn");
	if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
	if (cancelBtn) cancelBtn.addEventListener("click", () => modal.style.display = "none");

	// Quick Select Driver dropdown listener
	const quickSelect = document.getElementById("quickDriverSelect");
	if (quickSelect) {
		quickSelect.addEventListener("change", function () {
			const opt = this.options[this.selectedIndex];
			if (!opt || !opt.value) return;
			const vehicle = opt.getAttribute("data-vehicle");
			const name = opt.getAttribute("data-name");
			if (vehicle) document.getElementById("vehicleReferenceInput").value = vehicle;
			if (name) document.getElementById("driverReferenceInput").value = name;
			const errBox = document.getElementById("assignFormError");
			if (errBox) errBox.style.display = "none";
			const badge = document.getElementById("samriddhiMatchBadge");
			if (badge) badge.style.display = "none";
		});
	}

	// Ask Samriddhi button inside the modal
	const askBtn = document.getElementById("askSamriddhiAssignBtn");
	if (askBtn) {
		askBtn.addEventListener("click", function () {
			const id = document.getElementById("assignLogisticsId").value;
			const shipment = allLogisticsShipments.find(s => s.id === id);
			applyAskSamriddhiRecommendation(shipment);
		});
	}

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
					errBox.textContent = "Please select or enter both vehicle registration and driver contact.";
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
window.triggerAskSamriddhiAssign = function (logisticsId) {
	openAssignModal(logisticsId, "samriddhi");
};
