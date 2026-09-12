let currentFarmerOrderPage = 1;
const farmerOrderPageLimit = 10;

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
	// Populate farmer profile if available
	try {
		const me = await getCurrentUser();
		if (me && me.name) {
			const sName = document.getElementById("farmerSidebarName");
			const sId = document.getElementById("farmerSidebarId");
			if (sName) sName.textContent = me.name;
			if (sId) sId.textContent = `ID: KS-${me.id.substring(0, 5).toUpperCase()}`;
		}
	} catch {}

	loadFarmerOrders();
	setupFarmerOrderControls();
});

async function loadFarmerOrders(page = 1) {
	currentFarmerOrderPage = page;
	const container = document.getElementById("ordersContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `
		<div style="text-align:center; padding:32px; color:#666;">
			<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading incoming orders...
		</div>
	`;

	try {
		const statusFilter = document.getElementById("statusFilter");
		const params = {
			page: currentFarmerOrderPage,
			limit: farmerOrderPageLimit,
			status: statusFilter ? statusFilter.value : ""
		};

		const response = await getFarmerOrders(params);
		const data = response || {};
		const orders = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.orders) ? data.orders : [])));

		if (!orders.length) {
			container.innerHTML = `
				<div class="no-orders" style="background:#fff; border:1px solid #e2ece3; border-radius:10px; padding:36px; text-align:center;">
					<i class="fa-solid fa-box-open" style="font-size:32px; color:#9cb1a0; margin-bottom:12px; display:block;"></i>
					<h3 style="color:#202522; font-size:18px; margin-bottom:6px;">No Orders Found</h3>
					<p style="color:#777; font-size:13px;">You have no incoming buyer orders under this status.</p>
				</div>
			`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerOrderPage}`;
			return;
		}

		container.innerHTML = "";
		orders.forEach((order) => {
			const card = document.createElement("div");
			card.className = "order-card";
			card.style.cssText = "background:#fff; border:1px solid #e0eae2; border-radius:10px; padding:20px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.03);";

			const orderNum = order.orderNumber || `KS-${order.id.substring(0, 8)}`;
			const buyerName = order.buyer?.buyerProfile?.businessName || order.buyer?.name || order.buyerName || "Registered Buyer";
			const buyerContact = order.buyer?.phone || order.buyer?.email || "";
			const total = Number(order.totalAmount ?? order.amount ?? 0);
			const status = order.status || "PENDING_FARMER";

			let statusColor = "#d97706";
			let statusBg = "#fef3c7";
			let statusText = status.replace(/_/g, " ");

			if (status === "ACCEPTED") {
				statusColor = "#0284c7";
				statusBg = "#e0f2fe";
				statusText = "ACCEPTED (Awaiting Buyer Payment)";
			} else if (status === "PAID") {
				statusColor = "#166534";
				statusBg = "#dcfce7";
				statusText = "PAID (₹1 Demo Verified)";
			} else if (status === "COMPLETED") {
				statusColor = "#166534";
				statusBg = "#dcfce7";
			} else if (status === "CANCELLED" || status === "REJECTED") {
				statusColor = "#991b1b";
				statusBg = "#fee2e2";
			}

			// Format items
			const items = order.items || [];
			const itemsHtml = items.length ? items.map((it) => {
				const title = it.produce?.crop?.name ? `${it.produce.crop.name} (${it.produce.title})` : (it.produce?.title || "Agricultural Produce");
				const qty = it.quantity || 0;
				const unit = it.produce?.unit || "KG";
				const price = it.unitPrice || 0;
				return `<div style="font-size:14px; margin:4px 0;">🌾 <strong>${escapeHTML(title)}</strong>: ${qty} ${escapeHTML(unit)} @ ₹${price}/${escapeHTML(unit)} = <strong>₹${(qty * price).toLocaleString()}</strong></div>`;
			}).join("") : `<div style="font-size:14px; color:#666;">Produce items listed in order</div>`;

			let actionButtons = "";
			if (status === "PENDING_FARMER") {
				actionButtons = `
					<div style="margin-top:16px; padding-top:14px; border-top:1px solid #f0f4f1; display:flex; gap:12px; align-items:center;">
						<button type="button" class="accept-order-btn" style="background:#16863b; color:white; border:none; padding:9px 18px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;" onclick="handleFarmerOrderAction('${order.id}', 'ACCEPTED', this)">
							<i class="fa-solid fa-check"></i> Accept Order
						</button>
						<button type="button" class="reject-order-btn" style="background:#ba3d32; color:white; border:none; padding:9px 18px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;" onclick="handleFarmerOrderAction('${order.id}', 'REJECTED', this)">
							<i class="fa-solid fa-xmark"></i> Reject
						</button>
					</div>
				`;
			} else if (order.logistics) {
				const log = order.logistics;
				if (log.status === "PENDING") {
					actionButtons = `
						<div style="margin-top:14px; padding:10px 14px; background:#fffbeb; border:1px solid #fef3c7; border-radius:6px; font-size:12px; color:#92400e; display:flex; justify-content:space-between; align-items:center;">
							<span><i class="fa-solid fa-clock-rotate-left"></i> <strong>Logistics Requested:</strong> Awaiting Block Admin transport assignment.</span>
							<a href="logistics.html?id=${encodeURIComponent(log.id)}" style="color:#b45309; font-weight:600; text-decoration:underline;">Track &rarr;</a>
						</div>
					`;
				} else {
					actionButtons = `
						<div style="margin-top:14px; padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:12px; color:#166534; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
							<div><i class="fa-solid fa-truck"></i> <strong>Transport:</strong> ${escapeHTML(log.vehicleReference || 'Vehicle Assigned')} | <strong>Driver:</strong> ${escapeHTML(log.driverReference || 'Assigned')} (${escapeHTML(log.status)})</div>
							<a href="logistics.html?id=${encodeURIComponent(log.id)}" style="color:#15803d; font-weight:600; text-decoration:underline;">Live Tracking &rarr;</a>
						</div>
					`;
				}
			} else if (status === "ACCEPTED") {
				actionButtons = `
					<div style="margin-top:14px; padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:12px; color:#166534; display:flex; justify-content:space-between; align-items:center;">
						<span><i class="fa-solid fa-qrcode"></i> <strong>Order Accepted:</strong> PhonePe UPI QR code sent to buyer for payment confirmation.</span>
					</div>
				`;
			} else if (["PAID", "LOGISTICS_PENDING"].includes(status)) {
				actionButtons = `
					<div style="margin-top:16px; padding-top:14px; border-top:1px solid #f0f4f1; display:flex; gap:12px; align-items:center;">
						<button type="button" class="request-logistics-btn" style="background:#15803d; color:white; border:none; padding:9px 18px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;" onclick="openFarmerLogisticsModal('${order.id}', '${escapeHTML(orderNum)}', '${escapeHTML(buyerName)}')">
							<i class="fa-solid fa-truck-fast"></i> Request Block Logistics
						</button>
					</div>
				`;
			}

			card.innerHTML = `
				<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
					<div>
						<h3 style="font-size:17px; color:#202522; margin-bottom:4px;">Order #${escapeHTML(orderNum)}</h3>
						<span style="font-size:12px; color:#777;">Placed on: ${formatDate(order.createdAt)}</span>
					</div>
					<span style="background:${statusBg}; color:${statusColor}; font-weight:600; padding:5px 12px; border-radius:20px; font-size:12px; text-transform:uppercase;">
						${escapeHTML(statusText)}
					</span>
				</div>

				<div style="background:#f9fbf9; border-radius:8px; padding:12px 14px; margin-bottom:12px;">
					<p style="margin:2px 0; font-size:13px;"><strong>Buyer:</strong> ${escapeHTML(buyerName)} ${buyerContact ? `(${escapeHTML(buyerContact)})` : ""}</p>
					${itemsHtml}
				</div>

				<div style="display:flex; justify-content:space-between; align-items:center;">
					<span style="font-size:13px; color:#555;">Order Total:</span>
					<strong style="font-size:18px; color:#16863b;">₹${total.toLocaleString()}</strong>
				</div>

				${actionButtons}
			`;
			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerOrderPage}`;
	} catch (error) {
		console.error("Farmer orders loading error:", error);
		container.innerHTML = `
			<div class="status-card status-card-error" style="background:#fee2e2; border:1px solid #fca5a5; padding:18px; border-radius:8px; color:#991b1b;">
				<i class="fa-solid fa-circle-exclamation" style="margin-right:8px;"></i>
				<strong>Unable to load orders:</strong> ${escapeHTML(friendlyErrorMessage(error, "Please try again shortly."))}
			</div>
		`;
	}
}

async function handleFarmerOrderAction(orderId, nextStatus, btnElement) {
	if (!confirm(`Are you sure you want to ${nextStatus === 'ACCEPTED' ? 'ACCEPT' : 'REJECT'} this order?`)) return;

	if (btnElement) {
		btnElement.disabled = true;
		btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
	}

	try {
		await apiRequest(`/orders/${encodeURIComponent(orderId)}/status`, {
			method: "PATCH",
			body: { status: nextStatus }
		});
		loadFarmerOrders(currentFarmerOrderPage);
	} catch (err) {
		alert("Action failed: " + friendlyErrorMessage(err, "Please try again."));
		if (btnElement) {
			btnElement.disabled = false;
			btnElement.textContent = nextStatus === 'ACCEPTED' ? "Accept Order" : "Reject";
		}
	}
}

function openFarmerLogisticsModal(orderId, orderNumber, buyerName) {
	const modal = document.getElementById("logisticsModal");
	if (!modal) return;

	document.getElementById("logisticsOrderId").value = orderId;
	document.getElementById("logisticsOrderNumber").value = orderNumber || `KS-${orderId.substring(0, 8)}`;
	const destInput = document.getElementById("logisticsDestination");
	if (destInput && buyerName) {
		destInput.value = `Mandi / Warehouse for ${buyerName}`;
	}

	// Pre-fill tomorrow's date
	const dateInput = document.getElementById("logisticsDate");
	if (dateInput) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		dateInput.value = tomorrow.toISOString().split("T")[0];
	}

	const errBox = document.getElementById("logisticsFormError");
	if (errBox) errBox.style.display = "none";

	modal.style.display = "flex";
}

function closeFarmerLogisticsModal() {
	const modal = document.getElementById("logisticsModal");
	if (modal) modal.style.display = "none";
}

function setupFarmerOrderControls() {
	const statusFilter = document.getElementById("statusFilter");
	if (statusFilter) {
		statusFilter.addEventListener("change", function () {
			loadFarmerOrders(1);
		});
	}

	const refreshBtn = document.getElementById("refreshOrdersBtn");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", function () {
			loadFarmerOrders(1);
		});
	}

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) {
		prevBtn.addEventListener("click", function () {
			if (currentFarmerOrderPage > 1) loadFarmerOrders(currentFarmerOrderPage - 1);
		});
	}

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) {
		nextBtn.addEventListener("click", function () {
			loadFarmerOrders(currentFarmerOrderPage + 1);
		});
	}

	// Logistics Modal Controls
	const closeBtn = document.getElementById("closeLogisticsModalBtn");
	const cancelBtn = document.getElementById("cancelLogisticsBtn");
	if (closeBtn) closeBtn.addEventListener("click", closeFarmerLogisticsModal);
	if (cancelBtn) cancelBtn.addEventListener("click", closeFarmerLogisticsModal);

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

			if (submitBtn) {
				submitBtn.disabled = true;
				submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
			}
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

				closeFarmerLogisticsModal();
				alert("Logistics request submitted to Block Admin successfully!");
				loadFarmerOrders(currentFarmerOrderPage);
			} catch (err) {
				if (errBox) {
					errBox.textContent = friendlyErrorMessage(err, "Failed to submit logistics request. Please try again.");
					errBox.style.display = "block";
				}
			} finally {
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.textContent = "Submit Request to Admin";
				}
			}
		});
	}
}

window.loadFarmerOrders = loadFarmerOrders;
window.handleFarmerOrderAction = handleFarmerOrderAction;
window.openFarmerLogisticsModal = openFarmerLogisticsModal;
window.closeFarmerLogisticsModal = closeFarmerLogisticsModal;

