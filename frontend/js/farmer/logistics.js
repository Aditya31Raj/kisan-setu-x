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
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});
}

document.addEventListener("DOMContentLoaded", async function () {
	// 1. Check URL parameters for direct ID tracking
	const urlParams = new URLSearchParams(window.location.search);
	const targetId = urlParams.get("id");
	if (targetId) {
		const input = document.getElementById("logisticsId");
		if (input) input.value = targetId;
		trackShipment(targetId);
	}

	// 2. Setup Track Button
	const trackBtn = document.getElementById("trackBtn");
	if (trackBtn) {
		trackBtn.addEventListener("click", function () {
			const id = document.getElementById("logisticsId")?.value.trim();
			if (!id) {
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="status-card status-card-error" style="background:#fee2e2; border:1px solid #fca5a5; padding:10px 14px; border-radius:6px; color:#991b1b; margin-bottom:14px;">Please enter a Logistics ID.</div>`;
				return;
			}
			trackShipment(id);
		});
	}

	// 3. Status Update Button in details card
	const updateBtn = document.getElementById("updateStatusBtn");
	if (updateBtn) {
		updateBtn.addEventListener("click", async function () {
			const logisticsId = document.getElementById("displayLogisticsId")?.textContent;
			const status = document.getElementById("newStatus")?.value;
			if (!logisticsId || logisticsId === "-" || !status) {
				alert("Please select a status to update.");
				return;
			}
			try {
				updateBtn.disabled = true;
				updateBtn.textContent = "Updating...";
				await apiRequest(`/logistics/${encodeURIComponent(logisticsId)}/status`, {
					method: "PATCH",
					body: { status }
				});
				alert("Status updated successfully.");
				trackShipment(logisticsId);
				loadFarmerShipments();
			} catch (err) {
				alert("Failed to update status: " + friendlyErrorMessage(err));
			} finally {
				updateBtn.disabled = false;
				updateBtn.textContent = "Update Status";
			}
		});
	}

	// 4. Refresh Button
	const refreshBtn = document.getElementById("refreshLogisticsBtn");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			loadFarmerShipments();
			loadPendingOrdersForLogistics();
		});
	}

	setupLogisticsModal();
	loadPendingOrdersForLogistics();
	loadFarmerShipments();
});

async function trackShipment(logisticsId) {
	const msg = document.getElementById("logisticsMessage");
	const details = document.getElementById("logisticsDetails");
	if (msg) msg.innerHTML = `<div style="color:#666; font-size:13px; margin-bottom:12px;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching delivery details...</div>`;

	try {
		const data = await apiRequest(`/logistics/${encodeURIComponent(logisticsId)}`);
		if (!data) throw new Error("Logistics record not found.");

		document.getElementById("displayLogisticsId").textContent = data.id || logisticsId;
		document.getElementById("orderId").textContent = data.order?.orderNumber || data.orderId || "N/A";
		document.getElementById("logisticsStatus").textContent = data.status || "N/A";
		document.getElementById("vehicleReference").textContent = data.vehicleReference || "Pending Assignment by Admin";
		document.getElementById("driverReference").textContent = data.driverReference || "Pending Assignment by Admin";
		document.getElementById("estimatedDelivery").textContent = formatDate(data.estimatedDelivery);
		document.getElementById("actualDelivery").textContent = data.actualDelivery ? formatDate(data.actualDelivery) : "Pending";

		if (details) {
			details.style.display = "block";
			details.scrollIntoView({ behavior: "smooth" });
		}
		if (msg) msg.innerHTML = "";
	} catch (error) {
		if (msg) {
			msg.innerHTML = `<div class="status-card status-card-error" style="background:#fee2e2; border:1px solid #fca5a5; padding:10px 14px; border-radius:6px; color:#991b1b; margin-bottom:14px;"><i class="fa-solid fa-circle-exclamation"></i> ${escapeHTML(friendlyErrorMessage(error, "Unable to track delivery."))}</div>`;
		}
	}
}

async function loadFarmerShipments() {
	const container = document.getElementById("shipmentsContainer");
	if (!container) return;

	try {
		const items = await apiRequest("/logistics");
		const shipments = Array.isArray(items) ? items : (items?.items || []);

		if (!shipments.length) {
			container.innerHTML = `
				<div style="background:white; border:1px solid #e0eae2; border-radius:10px; padding:36px; text-align:center;">
					<i class="fa-solid fa-truck" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
					<h3 style="color:#202522; font-size:16px; margin-bottom:6px;">No Active Shipments</h3>
					<p style="color:#777; font-size:13px; margin:0;">When you or a buyer requests transport for an accepted order, it will appear here.</p>
				</div>
			`;
			return;
		}

		container.innerHTML = "";
		shipments.forEach((s) => {
			const card = document.createElement("div");
			card.className = "shipment-card";
			card.style.cssText = "background:white; border:1px solid #e2ece3; border-radius:10px; padding:20px; margin-bottom:16px; box-shadow:0 2px 6px rgba(0,0,0,0.02);";

			const orderNum = s.order?.orderNumber || (s.orderId ? `KS-${s.orderId.slice(0, 8)}` : "N/A");
			const buyerName = s.order?.buyer?.name || "Buyer";
			const buyerContact = s.order?.buyer?.phone || "";
			const itemsSummary = (s.order?.items || []).map(i => `${i.produce?.crop?.name || i.produce?.title || 'Produce'} (${i.quantity} ${i.produce?.unit || 'KG'})`).join(", ");

			let statusColor = "#d97706";
			let statusBg = "#fef3c7";
			let statusText = (s.status || "PENDING").replace(/_/g, " ");

			if (["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(s.status)) {
				statusColor = "#1d4ed8";
				statusBg = "#eff6ff";
			} else if (s.status === "DELIVERED") {
				statusColor = "#166534";
				statusBg = "#dcfce7";
			}

			// Stage tracker helper
			const stages = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
			const curIdx = stages.indexOf(s.status);

			const stepperHtml = `
				<div style="display:flex; justify-content:space-between; margin:16px 0 14px; position:relative;">
					<div style="position:absolute; top:12px; left:20px; right:20px; height:2px; background:#e2e8f0; z-index:1;"></div>
					${stages.map((st, idx) => {
						const isDone = curIdx >= idx;
						const isCurrent = curIdx === idx;
						const dotColor = isDone ? "#16863b" : "#cbd5e1";
						const label = st === "PENDING" ? "Requested" : st === "ASSIGNED" ? "Assigned" : st === "PICKED_UP" ? "Picked Up" : st === "IN_TRANSIT" ? "In Transit" : "Delivered";
						return `
							<div style="position:relative; z-index:2; text-align:center; flex:1;">
								<div style="width:24px; height:24px; border-radius:50%; background:${dotColor}; color:white; margin:0 auto 4px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">
									${isDone ? "✓" : idx + 1}
								</div>
								<span style="font-size:11px; color:${isCurrent ? '#16863b' : isDone ? '#333' : '#94a3b8'}; font-weight:${isCurrent ? '700' : '500'};">${label}</span>
							</div>
						`;
					}).join("")}
				</div>
			`;

			card.innerHTML = `
				<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
					<div>
						<h3 style="font-size:16px; color:#202522; margin:0 0 4px;">Shipment #${escapeHTML(s.id.slice(0, 8).toUpperCase())}</h3>
						<span style="font-size:12px; color:#777;">Order: <strong>#${escapeHTML(orderNum)}</strong> &bull; Requested on: ${formatDate(s.createdAt)}</span>
					</div>
					<span style="background:${statusBg}; color:${statusColor}; font-weight:700; padding:4px 12px; border-radius:20px; font-size:12px; text-transform:uppercase;">
						${escapeHTML(statusText)}
					</span>
				</div>

				${stepperHtml}

				<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px; background:#f9fbf9; padding:14px; border-radius:8px; margin-top:12px; font-size:13px;">
					<div>
						<strong><i class="fa-solid fa-location-dot" style="color:#16863b;"></i> Pickup:</strong><br>
						<span style="color:#555;">${escapeHTML(s.pickupAddress?.line1 || "Farmer's registered location")}</span>
					</div>
					<div>
						<strong><i class="fa-solid fa-flag-checkered" style="color:#dc2626;"></i> Delivery To:</strong><br>
						<span style="color:#555;">${escapeHTML(s.destinationAddress?.line1 || "Buyer warehouse")} (${escapeHTML(buyerName)})</span>
					</div>
					<div>
						<strong><i class="fa-solid fa-truck" style="color:#2563eb;"></i> Transport Fleet:</strong><br>
						<span style="color:#333;">${s.vehicleReference ? `<strong>${escapeHTML(s.vehicleReference)}</strong>` : '<em style="color:#888;">Awaiting Block Admin assignment</em>'}</span><br>
						<span style="color:#555;">Driver: ${s.driverReference ? `<strong>${escapeHTML(s.driverReference)}</strong>` : 'Not assigned'}</span>
					</div>
					<div>
						<strong><i class="fa-solid fa-wheat-awn" style="color:#d97706;"></i> Produce:</strong><br>
						<span style="color:#555;">${escapeHTML(itemsSummary || "Agricultural Produce")}</span>
					</div>
				</div>

				<div style="margin-top:12px; display:flex; justify-content:flex-end; gap:10px;">
					<button type="button" style="background:#16863b; color:white; border:none; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;" onclick="trackShipment('${s.id}')">
						<i class="fa-solid fa-eye"></i> View Live Status
					</button>
				</div>
			`;
			container.appendChild(card);
		});
	} catch (err) {
		console.error("Error loading shipments:", err);
		container.innerHTML = `<div class="status-card status-card-error" style="padding:16px; background:#fee2e2; border-radius:8px; color:#991b1b;">Failed to load shipments: ${escapeHTML(friendlyErrorMessage(err))}</div>`;
	}
}

async function loadPendingOrdersForLogistics() {
	const section = document.getElementById("pendingOrdersSection");
	const container = document.getElementById("pendingOrdersContainer");
	const countEl = document.getElementById("pendingOrdersCount");
	if (!section || !container) return;

	try {
		const res = await apiRequest("/farmers/me/orders?status=ACCEPTED");
		const orders = Array.isArray(res) ? res : (res?.items || res?.data || []);
		// Filter out orders that already have a logistics record
		const needLogistics = orders.filter(o => !o.logistics);

		if (!needLogistics.length) {
			section.style.display = "none";
			return;
		}

		section.style.display = "block";
		if (countEl) countEl.textContent = `${needLogistics.length} Order(s)`;

		container.innerHTML = needLogistics.map(o => {
			const orderNum = o.orderNumber || `KS-${o.id.slice(0, 8)}`;
			const buyer = o.buyer?.name || "Buyer";
			const items = (o.items || []).map(i => `${i.produce?.crop?.name || i.produce?.title || 'Produce'} (${i.quantity} ${i.produce?.unit || 'KG'})`).join(", ");
			return `
				<div style="background:white; border:1px solid #fef3c7; border-left:4px solid #f59e0b; border-radius:8px; padding:14px; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
					<div style="font-weight:700; font-size:14px; color:#202522; margin-bottom:4px;">Order #${escapeHTML(orderNum)}</div>
					<div style="font-size:12px; color:#555; margin-bottom:6px;">Buyer: <strong>${escapeHTML(buyer)}</strong> &bull; ${escapeHTML(items)}</div>
					<button type="button" style="background:#16863b; color:white; border:none; padding:7px 14px; border-radius:5px; font-size:12px; font-weight:600; cursor:pointer;" onclick="openLogisticsModalFromLogisticsPage('${o.id}', '${escapeHTML(orderNum)}', '${escapeHTML(buyer)}')">
						<i class="fa-solid fa-truck-fast"></i> Request Transport
					</button>
				</div>
			`;
		}).join("");
	} catch (err) {
		console.warn("Could not load pending orders for logistics:", err);
	}
}

function openLogisticsModalFromLogisticsPage(orderId, orderNum, buyerName) {
	const modal = document.getElementById("logisticsModal");
	if (!modal) return;
	document.getElementById("logisticsOrderId").value = orderId;
	document.getElementById("logisticsOrderNumber").value = orderNum;
	const dest = document.getElementById("logisticsDestination");
	if (dest && buyerName) dest.value = `Mandi / Warehouse for ${buyerName}`;

	const dateInput = document.getElementById("logisticsDate");
	if (dateInput) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		dateInput.value = tomorrow.toISOString().split("T")[0];
	}

	modal.style.display = "flex";
}

function setupLogisticsModal() {
	const modal = document.getElementById("logisticsModal");
	const closeBtn = document.getElementById("closeLogisticsModalBtn");
	const cancelBtn = document.getElementById("cancelLogisticsBtn");
	if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
	if (cancelBtn) cancelBtn.addEventListener("click", () => modal.style.display = "none");

	const form = document.getElementById("logisticsRequestForm");
	if (form) {
		form.addEventListener("submit", async function (e) {
			e.preventDefault();
			const orderId = document.getElementById("logisticsOrderId").value;
			const pickup = document.getElementById("logisticsPickup").value.trim();
			const dest = document.getElementById("logisticsDestination").value.trim();
			const date = document.getElementById("logisticsDate").value;
			const submitBtn = document.getElementById("submitLogisticsBtn");
			const errBox = document.getElementById("logisticsFormError");

			if (!pickup || !dest) {
				if (errBox) {
					errBox.textContent = "Please provide both pickup and destination locations.";
					errBox.style.display = "block";
				}
				return;
			}

			submitBtn.disabled = true;
			submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
			if (errBox) errBox.style.display = "none";

			try {
				await apiRequest("/logistics", {
					method: "POST",
					body: {
						orderId,
						pickupAddress: { line1: pickup },
						destinationAddress: { line1: dest },
						estimatedDelivery: date ? new Date(date).toISOString() : undefined
					}
				});
				modal.style.display = "none";
				alert("Logistics request submitted to Block Admin successfully!");
				loadPendingOrdersForLogistics();
				loadFarmerShipments();
			} catch (err) {
				if (errBox) {
					errBox.textContent = friendlyErrorMessage(err, "Failed to submit request.");
					errBox.style.display = "block";
				}
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent = "Submit Request to Admin";
			}
		});
	}
}

window.trackShipment = trackShipment;
window.openLogisticsModalFromLogisticsPage = openLogisticsModalFromLogisticsPage;

