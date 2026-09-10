let currentFarmerDisputePage = 1;
const farmerDisputePageLimit = 10;

function escapeHTML(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
	loadFarmerDisputes();
	setupFarmerDisputeForm();
	populateFarmerOrdersDropdown();
	setupFarmerLogout();
});

async function populateFarmerOrdersDropdown() {
	try {
		const orderInput = document.getElementById("orderId");
		if (!orderInput) return;

		const response = await getFarmerOrders({ limit: 50 });
		const orders = Array.isArray(response) ? response : (response?.items || response?.data || []);
		if (orders.length > 0) {
			let selectElem = document.getElementById("orderQuickSelect");
			if (!selectElem) {
				const group = document.createElement("div");
				group.className = "form-group";
				group.style.marginBottom = "12px";
				group.innerHTML = `
					<label for="orderQuickSelect" style="display:block; margin-bottom:6px; font-weight:600; font-size:13px; color:#404844;">
						Quick Select from Your Orders:
					</label>
					<select id="orderQuickSelect" style="width:100%; padding:10px 12px; border:1px solid #d5ded8; border-radius:7px; font-size:13px; background:#fff;">
						<option value="">-- Select an Order --</option>
						${orders.map(o => `<option value="${escapeHTML(o.id)}">${escapeHTML(o.orderNumber || o.id.slice(0, 8))} &bull; ₹${escapeHTML(o.totalAmount || "--")} &bull; ${escapeHTML(o.status)}</option>`).join("")}
					</select>
				`;
				orderInput.closest(".form-group")?.before(group);
				document.getElementById("orderQuickSelect")?.addEventListener("change", (e) => {
					if (e.target.value) {
						orderInput.value = e.target.value;
					}
				});
			}
		}
	} catch (err) {
		console.debug("Could not prefetch farmer orders for dropdown:", err);
	}
}

async function loadFarmerDisputes(page = 1) {
	currentFarmerDisputePage = page;
	const container = document.getElementById("disputesContainer");
	const pageNumber = document.getElementById("pageNumber");
	if (!container) return;

	container.innerHTML = `<p>Loading disputes...</p>`;
	try {
		const response = await getFarmerDisputes({ page: currentFarmerDisputePage, limit: farmerDisputePageLimit });
		const data = response || {};
		const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.disputes) ? data.disputes : [])));

		if (!list.length) {
			container.innerHTML = `<div class="no-disputes" style="padding:24px; text-align:center; background:#fff; border-radius:8px; border:1px dashed #c8d8cb;"><h3 style="margin:0 0 6px;">No disputes found</h3><p style="margin:0; color:#666;">You have not raised any disputes yet.</p></div>`;
			if (pageNumber) pageNumber.textContent = `Page ${currentFarmerDisputePage}`;
			return;
		}

		container.innerHTML = "";
		list.forEach((dispute) => {
			const card = document.createElement("div");
			card.className = "dispute-card";
			card.style.cssText = "background:#fff; border:1px solid #e1e8e2; border-radius:8px; padding:16px 20px; margin-bottom:12px; box-shadow:0 2px 5px rgba(0,0,0,0.03);";

			const orderNum = dispute.order?.orderNumber || dispute.orderId || "N/A";
			const status = (dispute.status || "OPEN").toUpperCase();
			let statusBg = "#fff5dc";
			let statusColor = "#8a6500";
			if (status === "RESOLVED") { statusBg = "#e9f6ec"; statusColor = "#176b38"; }
			else if (status === "REJECTED") { statusBg = "#fdeaea"; statusColor = "#b3261e"; }

			card.innerHTML = `
				<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
					<h3 style="margin:0; font-size:15px; color:#16863b;">Dispute #${escapeHTML(dispute.id?.slice(0, 8).toUpperCase() || "N/A")}</h3>
					<span style="background:${statusBg}; color:${statusColor}; font-size:11px; font-weight:700; padding:3px 9px; border-radius:12px; text-transform:uppercase;">${escapeHTML(status)}</span>
				</div>
				<p style="margin:0 0 6px; font-size:13px; color:#333;"><strong>Order:</strong> #${escapeHTML(orderNum)}</p>
				<p style="margin:0 0 6px; font-size:13px; color:#555;"><strong>Reason:</strong> ${escapeHTML(dispute.reason || "Not specified")}</p>
				${dispute.resolution ? `<p style="margin:6px 0 0; font-size:12px; color:#176b38; background:#edf8ef; padding:6px 10px; border-radius:6px;"><strong>Admin Resolution:</strong> ${escapeHTML(dispute.resolution)}</p>` : ""}
			`;
			container.appendChild(card);
		});

		if (pageNumber) pageNumber.textContent = `Page ${currentFarmerDisputePage}`;
	} catch (error) {
		console.error("Farmer disputes loading error:", error);
		container.innerHTML = `<div class="status-card status-card-error" style="padding:16px; background:#fff; border-left:4px solid #ba3d32;"><p style="margin:0; color:#ba3d32;"><strong>Disputes are temporarily unavailable:</strong> ${escapeHTML(error.message || "Please try again shortly.")}</p></div>`;
	}
}

function setupFarmerDisputeForm() {
	const form = document.getElementById("disputeForm");
	if (!form) return;

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const orderId = (document.getElementById("orderId")?.value || "").trim();
		const reason = (document.getElementById("reason")?.value || "").trim();
		const msg = document.getElementById("disputeMessage");
		const submitBtn = document.getElementById("submitDisputeBtn");

		if (!orderId) {
			if (msg) msg.innerHTML = `<div style="color:#ba3d32; padding:8px 0;">Please enter or select an Order ID.</div>`;
			return;
		}

		if (reason.length < 5) {
			if (msg) msg.innerHTML = `<div style="color:#ba3d32; padding:8px 0;">Please provide a dispute reason (minimum 5 characters).</div>`;
			return;
		}

		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.textContent = "Submitting...";
		}

		try {
			// POST /disputes (Correct unified dispute endpoint)
			await apiRequest("/disputes", {
				method: "POST",
				body: { orderId, reason }
			});

			if (msg) {
				msg.innerHTML = `<div style="background:#e9f6ec; color:#176b38; border:1px solid #c3e6cb; padding:12px; border-radius:6px; margin:12px 0;">Dispute submitted successfully! It is now visible to the administration.</div>`;
			}
			form.reset();
			await loadFarmerDisputes(1);
		} catch (error) {
			console.error("Dispute submit error:", error);
			if (msg) {
				msg.innerHTML = `<div style="background:#fdeaea; color:#ba3d32; border:1px solid #f5c6cb; padding:12px; border-radius:6px; margin:12px 0;">${escapeHTML(error.message || "Failed to submit dispute. Please verify the order ID.")}</div>`;
			}
		} finally {
			if (submitBtn) {
				submitBtn.disabled = false;
				submitBtn.textContent = "Submit Dispute";
			}
		}
	});

	const refreshBtn = document.getElementById("refreshDisputesBtn");
	if (refreshBtn) refreshBtn.addEventListener("click", () => loadFarmerDisputes(1));

	const prevBtn = document.getElementById("previousBtn");
	if (prevBtn) prevBtn.addEventListener("click", () => { if (currentFarmerDisputePage > 1) loadFarmerDisputes(currentFarmerDisputePage - 1); });

	const nextBtn = document.getElementById("nextBtn");
	if (nextBtn) nextBtn.addEventListener("click", () => loadFarmerDisputes(currentFarmerDisputePage + 1));
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

window.loadFarmerDisputes = loadFarmerDisputes;
