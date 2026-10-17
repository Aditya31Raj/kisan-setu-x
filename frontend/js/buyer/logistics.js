// ============================================
// KISAN SETU - BUYER LOGISTICS MODULE
// ============================================

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
	// 1. URL direct tracking
	const urlParams = new URLSearchParams(window.location.search);
	const targetId = urlParams.get("id");
	if (targetId) {
		const input = document.getElementById("logisticsId");
		if (input) input.value = targetId;
		trackBuyerShipment(targetId);
	}

	// 2. Track button
	const trackBtn = document.getElementById("trackBtn");
	if (trackBtn) {
		trackBtn.addEventListener("click", function () {
			const id = document.getElementById("logisticsId")?.value.trim();
			if (!id) {
				const msg = document.getElementById("logisticsMessage");
				if (msg) msg.innerHTML = `<div class="status-card status-card-error" style="background:#fee2e2; border:1px solid #fca5a5; padding:10px 14px; border-radius:6px; color:#991b1b; margin-bottom:14px;">Please enter a Logistics ID.</div>`;
				return;
			}
			trackBuyerShipment(id);
		});
	}

	// 3. Refresh button
	const refreshBtn = document.getElementById("refreshLogisticsBtn");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			loadBuyerShipments();
			loadPendingBuyerOrdersForLogistics();
		});
	}

	setupBuyerLogisticsModalControls();
	loadPendingBuyerOrdersForLogistics();
	loadBuyerShipments();
});

async function trackBuyerShipment(logisticsId) {
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

async function loadBuyerShipments() {
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
					<p style="color:#777; font-size:13px; margin:0;">When you or the farmer requests transport for an accepted order, it will appear here.</p>
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
			const farmerName = s.order?.farmer?.name || "Farmer";
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

			// Stepper
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
						<span style="font-size:12px; color:#777;">Order: <strong>#${escapeHTML(orderNum)}</strong> &bull; Requested: ${formatDate(s.createdAt)}</span>
					</div>
					<span style="background:${statusBg}; color:${statusColor}; font-weight:700; padding:4px 12px; border-radius:20px; font-size:12px; text-transform:uppercase;">
						${escapeHTML(statusText)}
					</span>
				</div>

				${stepperHtml}

				<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px; background:#f9fbf9; padding:14px; border-radius:8px; margin-top:12px; font-size:13px;">
					<div>
						<strong><i class="fa-solid fa-location-dot" style="color:#16863b;"></i> Pickup Location:</strong><br>
						<span style="color:#555;">${escapeHTML(s.pickupAddress?.line1 || "Farmer's farm")} (${escapeHTML(farmerName)})</span>
					</div>
					<div>
						<strong><i class="fa-solid fa-flag-checkered" style="color:#dc2626;"></i> Delivery To:</strong><br>
						<span style="color:#555;">${escapeHTML(s.destinationAddress?.line1 || "Your Delivery Address")}</span>
					</div>
					<div>
						<strong><i class="fa-solid fa-truck" style="color:#2563eb;"></i> Transport Fleet:</strong><br>
						<span style="color:#333;">${s.vehicleReference ? `<strong>${escapeHTML(s.vehicleReference)}</strong>` : '<em style="color:#888;">Awaiting Block Admin assignment</em>'}</span><br>
						<span style="color:#555;">Driver: ${s.driverReference ? `<strong>${escapeHTML(s.driverReference)}</strong>` : 'Not assigned'}</span>
					</div>
					<div>
						<strong><i class="fa-solid fa-wheat-awn" style="color:#d97706;"></i> Produce:</strong><br>
						<span style="color:#555;">${escapeHTML(itemsSummary || "Produce Item")}</span>
					</div>
				</div>

				<div style="margin-top:12px; display:flex; justify-content:flex-end; gap:10px;">
					<button type="button" style="background:#16863b; color:white; border:none; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;" onclick="trackBuyerShipment('${s.id}')">
						<i class="fa-solid fa-eye"></i> View Live Status
					</button>
				</div>
			`;
			container.appendChild(card);
		});
	} catch (err) {
		console.error("Error loading buyer shipments:", err);
		container.innerHTML = `<div class="status-card status-card-error" style="padding:16px; background:#fee2e2; border-radius:8px; color:#991b1b;">Failed to load shipments: ${escapeHTML(friendlyErrorMessage(err))}</div>`;
	}
}

async function loadPendingBuyerOrdersForLogistics() {
	const section = document.getElementById("pendingOrdersSection");
	const container = document.getElementById("pendingOrdersContainer");
	const countEl = document.getElementById("pendingOrdersCount");
	if (!section || !container) return;

	try {
		const res = await apiRequest("/orders?status=ACCEPTED");
		const orders = Array.isArray(res) ? res : (res?.items || res?.data || []);
		const needLogistics = orders.filter(o => !o.logistics);

		if (!needLogistics.length) {
			section.style.display = "none";
			return;
		}

		section.style.display = "block";
		if (countEl) countEl.textContent = `${needLogistics.length} Order(s)`;

		container.innerHTML = needLogistics.map(o => {
			const orderNum = o.orderNumber || `KS-${o.id.slice(0, 8)}`;
			const farmer = o.farmer?.name || "Farmer";
			const items = (o.items || []).map(i => `${i.produce?.crop?.name || i.produce?.title || 'Produce'} (${i.quantity} ${i.produce?.unit || 'KG'})`).join(", ");
			return `
				<div style="background:white; border:1px solid #fef3c7; border-left:4px solid #f59e0b; border-radius:8px; padding:14px; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
					<div style="font-weight:700; font-size:14px; color:#202522; margin-bottom:4px;">Order #${escapeHTML(orderNum)}</div>
					<div style="font-size:12px; color:#555; margin-bottom:6px;">Farmer: <strong>${escapeHTML(farmer)}</strong> &bull; ${escapeHTML(items)}</div>
					<button type="button" style="background:#16863b; color:white; border:none; padding:7px 14px; border-radius:5px; font-size:12px; font-weight:600; cursor:pointer;" onclick="openBuyerLogisticsModalFromLogisticsPage('${o.id}', '${escapeHTML(orderNum)}', '${escapeHTML(farmer)}')">
						<i class="fa-solid fa-truck-fast"></i> Request Transport
					</button>
				</div>
			`;
		}).join("");
	} catch (err) {
		console.warn("Could not load pending buyer orders for logistics:", err);
	}
}

function openBuyerLogisticsModalFromLogisticsPage(orderId, orderNum, farmerName) {
	const modal = document.getElementById("buyerLogisticsModal");
	if (!modal) return;
	document.getElementById("buyerLogisticsOrderId").value = orderId;
	document.getElementById("buyerLogisticsOrderNumber").value = orderNum;
	const pickup = document.getElementById("buyerLogisticsPickup");
	if (pickup && farmerName) pickup.value = `Farm / Village of ${farmerName}`;

	const dateInput = document.getElementById("buyerLogisticsDate");
	if (dateInput) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		dateInput.value = tomorrow.toISOString().split("T")[0];
	}

	modal.style.display = "flex";
}

function setupBuyerLogisticsModalControls() {
	const modal = document.getElementById("buyerLogisticsModal");
	const closeBtn = document.getElementById("closeBuyerLogisticsModalBtn");
	const cancelBtn = document.getElementById("cancelBuyerLogisticsBtn");
	if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
	if (cancelBtn) cancelBtn.addEventListener("click", () => modal.style.display = "none");

	const form = document.getElementById("buyerLogisticsRequestForm");
	if (form) {
		form.addEventListener("submit", async function (e) {
			e.preventDefault();
			const orderId = document.getElementById("buyerLogisticsOrderId").value;
			const pickup = document.getElementById("buyerLogisticsPickup").value.trim();
			const dest = document.getElementById("buyerLogisticsDestination").value.trim();
			const date = document.getElementById("buyerLogisticsDate").value;
			const submitBtn = document.getElementById("submitBuyerLogisticsBtn");
			const errBox = document.getElementById("buyerLogisticsFormError");

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
				loadPendingBuyerOrdersForLogistics();
				loadBuyerShipments();
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

window.trackBuyerShipment = trackBuyerShipment;window.openBuyerLogisticsModalFromLogisticsPage = openBuyerLogisticsModalFromLogisticsPage;