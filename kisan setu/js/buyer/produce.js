// ============================================
// KISAN SETU - PRODUCE MODULE
// File: js/produce.js
// ============================================

// Pagination
let currentPage = 1;
const pageLimit = 10;

// Current search values
let currentSearch = "";
let currentLocation = "";


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    loadProduce();

    setupSearch();

    setupPagination();

    setupModal();

    setupLogout();

});


// ============================================
// LOAD PRODUCE
// GET /api/v1/produce
// ============================================

async function loadProduce(page = 1) {

    currentPage = page;

    const container = document.getElementById("produceContainer");
    const countElement = document.getElementById("produceCount");
    const pageElement = document.getElementById("pageNumber");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <p>Loading available produce...</p>
    `;

    try {

        let path =
            `/produce?page=${currentPage}&limit=${pageLimit}`;

        // If search is active, use search API
        if (currentSearch.trim() !== "") {

            path =
                `/produce/search` +
                `?q=${encodeURIComponent(currentSearch.trim())}` +
                `&page=${currentPage}` +
                `&limit=${pageLimit}`;

        }

        const data = await apiRequest(path);

        displayProduce(data);

        if (pageElement) {
            pageElement.textContent = `Page ${currentPage}`;
        }

    } catch (error) {

        console.error("Produce loading error:", error);

        container.innerHTML = `
            <p>
                Unable to load produce at the moment.
                Please try again later.
            </p>
        `;

        if (countElement) {
            countElement.textContent = "Unable to load";
        }
    }
}


// ============================================
// DISPLAY PRODUCE
// ============================================

function displayProduce(data) {

    const container = document.getElementById("produceContainer");
    const countElement = document.getElementById("produceCount");

    if (!container) {
        return;
    }

    /*
        Backend response format can vary.

        We support common formats such as:

        data = []
        data.data = []
        data.items = []
        data.produce = []
    */

    let produceList = [];

    if (Array.isArray(data)) {
        produceList = data;
    } else if (Array.isArray(data.data)) {
        produceList = data.data;
    } else if (Array.isArray(data.items)) {
        produceList = data.items;
    } else if (Array.isArray(data.produce)) {
        produceList = data.produce;
    }

    // Filter out completely sold out produce so it is not shown to other buyers
    produceList = produceList.filter(function (produce) {
        return Number(produce.availableQuantity) > 0 && produce.status !== 'SOLD_OUT';
    });

    // No produce found
    if (produceList.length === 0) {

        container.innerHTML = `
            <div class="no-produce">
                <h3>No produce found</h3>
                <p>
                    There is currently no produce available
                    matching your search.
                </p>
            </div>
        `;

        if (countElement) {
            countElement.textContent = "0 items";
        }

        updatePagination(data);

        return;
    }


    // Display count
    if (countElement) {
        countElement.textContent =
            `${produceList.length} item${produceList.length > 1 ? "s" : ""}`;
    }


    container.innerHTML = "";


    produceList.forEach(function (produce) {

        const card = createProduceCard(produce);

        container.appendChild(card);

    });


    updatePagination(data);
}


// ============================================
// CREATE PRODUCE CARD
// ============================================

function createProduceCard(produce) {
    const card = document.createElement("div");
    card.className = "produce-card modern-card";

    const rawTitle = produce.title || produce.name || "Unnamed Produce";
    const displayName = rawTitle.replace(/\[Block Procurement[^\]]*\]/g, "").trim();

    const quantity = Number(produce.availableQuantity ?? produce.quantity ?? 0);
    const rawUnit = String(produce.unit || "Quintal").trim();
    const unitName = rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1).toLowerCase();
    const price = Number(produce.pricePerUnit ?? produce.price ?? 0);
    const formattedPrice = price.toLocaleString("en-IN");
    const location = produce.location || (produce.district ? `${produce.district}, ${produce.state || "Bihar"}` : "Sitamarhi Central Mandi, Bihar");

    // Subtitle matching "Grade A Premium • Moisture 11.2%"
    let subtitle = produce.category || "Grade A Premium";
    if (produce.description && produce.description.includes("Moisture")) {
        const match = produce.description.match(/Moisture\s*[\d\.]+%?/i);
        if (match) subtitle += ` • ${match[0]}`;
        else subtitle += ` • Moisture 11.2%`;
    } else {
        subtitle += ` • Moisture 11.2%`;
    }

    const farmerName = produce.farmer?.name || "Mohan Kumar (Dumra)";
    const produceId = produce.id;
    const cropIcon = getCropIconClass(displayName);

    card.innerHTML = `
        <div class="pcm-top-row">
            <div class="pcm-title-group">
                <div class="pcm-icon-box">
                    <i class="fa-solid ${cropIcon}" aria-hidden="true"></i>
                </div>
                <div class="pcm-title-meta">
                    <h3 class="pcm-title">${escapeHTML(displayName)}</h3>
                    <div class="pcm-subtitle">${escapeHTML(subtitle)}</div>
                </div>
            </div>
            <div class="pcm-badge pcm-badge-tested">
                <i class="fa-solid fa-check-double" style="margin-right:4px;"></i> Lab Tested
            </div>
        </div>

        <div class="pcm-rate-box">
            <div class="pcm-rate-col">
                <span class="pcm-rate-label">Price</span>
                <span class="pcm-rate-val">₹${formattedPrice}</span>
            </div>
            <div class="pcm-qty-col">
                <span class="pcm-qty-label">Lot Quantity</span>
                <span class="pcm-qty-val">${quantity} ${escapeHTML(unitName)}</span>
            </div>
        </div>

        <div class="pcm-details-list">
            <div class="pcm-detail-item">
                <i class="fa-solid fa-user"></i>
                <span>Farmer: <strong>${escapeHTML(farmerName)}</strong></span>
            </div>
            <div class="pcm-detail-item">
                <i class="fa-solid fa-location-dot"></i>
                <span>${escapeHTML(location)}</span>
            </div>
            <div class="pcm-detail-item">
                <i class="fa-solid fa-truck"></i>
                <span>Ready for Dispatch (Same Day)</span>
            </div>
        </div>

        <div class="pcm-actions">
            <button
                type="button"
                class="pcm-btn-bid view-produce-btn"
                data-id="${escapeHTML(String(produceId))}">
                <i class="fa-solid fa-paper-plane"></i> Place Purchase Bid
            </button>
        </div>
    `;

    const viewButton = card.querySelector(".view-produce-btn");
    if (viewButton) {
        viewButton.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            if (id) {
                loadProduceDetails(id);
            }
        });
    }

    return card;
}


// ============================================
// SEARCH
// GET /api/v1/produce/search
// ============================================

function setupSearch() {

    const searchForm =
        document.getElementById("produceSearchForm");

    const clearButton =
        document.getElementById("clearSearchBtn");


    if (searchForm) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();


            const searchInput =
                document.getElementById("searchInput");

            const locationInput =
                document.getElementById("locationInput");


            currentSearch =
                searchInput ? searchInput.value.trim() : "";

            currentLocation =
                locationInput ? locationInput.value.trim() : "";


            currentPage = 1;


            loadProduce(1);

        });

    }


    if (clearButton) {

        clearButton.addEventListener("click", function () {

            const searchInput =
                document.getElementById("searchInput");

            const locationInput =
                document.getElementById("locationInput");


            if (searchInput) {
                searchInput.value = "";
            }

            if (locationInput) {
                locationInput.value = "";
            }


            currentSearch = "";
            currentLocation = "";

            currentPage = 1;

            loadProduce(1);

        });

    }

}


// ============================================
// PAGINATION
// ============================================

function setupPagination() {

    const previousButton =
        document.getElementById("previousBtn");

    const nextButton =
        document.getElementById("nextBtn");


    if (previousButton) {

        previousButton.addEventListener("click", function () {

            if (currentPage > 1) {

                loadProduce(currentPage - 1);

            }

        });

    }


    if (nextButton) {

        nextButton.addEventListener("click", function () {

            loadProduce(currentPage + 1);

        });

    }

}


// ============================================
// UPDATE PAGINATION BUTTONS
// ============================================

function updatePagination(data) {

    const previousButton =
        document.getElementById("previousBtn");

    const nextButton =
        document.getElementById("nextBtn");


    if (previousButton) {

        previousButton.disabled =
            currentPage <= 1;

    }


    if (nextButton) {

        /*
            If backend provides pagination metadata,
            use it.

            Otherwise, if fewer than pageLimit records
            are returned, assume this is the last page.
        */

        let hasNextPage = false;


        if (data && data.pagination) {

            hasNextPage =
                data.pagination.hasNextPage === true;

        } else if (data && data.meta) {

            hasNextPage =
                data.meta.hasNextPage === true;

        } else {

            let items = [];

            if (Array.isArray(data)) {
                items = data;
            } else if (Array.isArray(data.data)) {
                items = data.data;
            } else if (Array.isArray(data.items)) {
                items = data.items;
            } else if (Array.isArray(data.produce)) {
                items = data.produce;
            }

            hasNextPage =
                items.length === pageLimit;

        }


        nextButton.disabled = !hasNextPage;

    }

}


// ============================================
// PRODUCE DETAILS
// GET /api/v1/produce/:id
// ============================================

async function loadProduceDetails(produceId) {

    const modal =
        document.getElementById("produceModal");

    const detailsContainer =
        document.getElementById("produceDetails");


    if (!modal || !detailsContainer) {
        return;
    }


    modal.style.display = "flex";


    detailsContainer.innerHTML = `
        <p>Loading produce details...</p>
    `;


    try {

        const data = await apiRequest(`/produce/${encodeURIComponent(produceId)}`);


        let produce = data;


        if (data.data) {
            produce = data.data;
        }


        displayProduceDetails(produce);


    } catch (error) {

        console.error(
            "Produce details error:",
            error
        );


        detailsContainer.innerHTML = `
            <p>
                Unable to load produce details.
                Please try again later.
            </p>
        `;

    }

}


// ============================================
// DISPLAY PRODUCE DETAILS
// ============================================

function displayProduceDetails(produce) {
    const detailsContainer = document.getElementById("produceDetails");
    if (!detailsContainer) return;

    const title = produce.title || "Unnamed Produce";
    const description = produce.description || "Fresh agricultural produce verified on Kisan Setu.";
    const location = produce.location || "Patna, Bihar";
    const quantity = Number(produce.availableQuantity ?? 0);
    const unit = produce.unit || "KG";
    const price = Number(produce.pricePerUnit ?? 0);
    const farmerName = produce.farmer?.name || "Verified Local Farmer";
    const defaultQty = Math.min(10, Math.max(1, quantity));

    detailsContainer.innerHTML = `
        <div class="produce-detail" style="padding: 10px 0;">
            <h3 style="font-size: 20px; color: #16863b; margin-bottom: 8px;">${escapeHTML(title)}</h3>
            <p style="color: #666; font-size: 13px; margin-bottom: 14px;">${escapeHTML(description)}</p>

            <div style="background: #f8faf8; border: 1px solid #e1ebe2; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <p style="margin: 4px 0; font-size: 13px;"><strong>Farmer:</strong> ${escapeHTML(farmerName)}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> ${escapeHTML(location)}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Available Stock:</strong> ${quantity > 0 ? `<span style="color:#16863b; font-weight:bold;">${quantity.toLocaleString()}</span> ${escapeHTML(unit)}` : `<span style="color:#dc2626; font-weight:bold;"><i class="fa-solid fa-ban"></i> 0 ${escapeHTML(unit)} (SOLD OUT)</span>`}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Price:</strong> <strong style="font-size: 15px; color:#202522;">₹${price.toLocaleString()}</strong> / ${escapeHTML(unit)}</p>
            </div>

            <!-- Direct Order Box or Sold Out Box -->
            ${quantity > 0 ? `
            <div style="background: #ffffff; border: 1px solid #d3e7d6; border-radius: 8px; padding: 16px;">
                <h4 style="color: #176d35; margin-bottom: 10px; font-size: 15px;"><i class="fa-solid fa-cart-shopping"></i> Purchase Produce</h4>
                
                <div style="margin-bottom: 12px;">
                    <label for="orderQtyInput" style="display:block; font-size: 12px; font-weight:600; color:#444; margin-bottom: 4px;">
                        Enter Quantity to Buy (${escapeHTML(unit)}):
                    </label>
                    <input type="number" id="orderQtyInput" min="1" max="${quantity}" value="${defaultQty}" style="width:100%; height:40px; padding:0 12px; border:1px solid #c8d9cb; border-radius:6px; font-size:15px;">
                </div>

                <div style="background: #edf7ee; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size: 13px; color:#444;">Total Amount:</span>
                    <strong id="orderTotalAmount" style="color: #16863b; font-size: 18px;">₹${(defaultQty * price).toLocaleString()}</strong>
                </div>

                <div id="orderFeedbackMsg" style="display:none; padding:10px; border-radius:6px; font-size:13px; margin-bottom:12px;"></div>

                <button type="button" id="submitDirectOrderBtn" style="width:100%; height:44px; background:#16863b; color:white; border:none; border-radius:6px; font-weight:600; font-size:15px; cursor:pointer;">
                    Confirm & Place Order
                </button>
            </div>
            ` : `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; text-align: center;">
                <span style="display:inline-block; background:#dc2626; color:white; font-weight:bold; padding:5px 16px; border-radius:16px; font-size:13px; margin-bottom:8px;">
                    <i class="fa-solid fa-ban"></i> SOLD OUT
                </span>
                <p style="color:#991b1b; font-size:14px; margin:0;">All stock for this produce listing has been purchased and is unavailable.</p>
            </div>
            `}
        </div>
    `;

    const qtyInput = document.getElementById("orderQtyInput");
    const totalDisplay = document.getElementById("orderTotalAmount");
    const submitBtn = document.getElementById("submitDirectOrderBtn");
    const msgBox = document.getElementById("orderFeedbackMsg");

    if (qtyInput && totalDisplay) {
        qtyInput.addEventListener("input", function() {
            const val = Number(this.value) || 0;
            totalDisplay.textContent = `₹${(val * price).toLocaleString()}`;
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async function() {
            const qty = Number(qtyInput.value);
            if (!qty || qty <= 0) {
                msgBox.style.display = "block";
                msgBox.style.background = "#fee2e2";
                msgBox.style.color = "#991b1b";
                msgBox.textContent = "Please enter a valid quantity greater than 0.";
                return;
            }
            if (qty > quantity) {
                msgBox.style.display = "block";
                msgBox.style.background = "#fee2e2";
                msgBox.style.color = "#991b1b";
                msgBox.textContent = `Requested quantity exceeds available stock (${quantity} ${unit}).`;
                return;
            }

            msgBox.style.display = "none";
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...';

            try {
                const newOrder = await apiRequest("/orders", {
                    method: "POST",
                    body: {
                        produceId: produce.id,
                        quantity: qty
                    }
                });

                msgBox.style.display = "block";
                msgBox.style.background = "#dcfce7";
                msgBox.style.color = "#166534";
                msgBox.innerHTML = `✓ <strong>Order Placed Successfully!</strong><br>Order #${escapeHTML(newOrder.orderNumber || newOrder.id)}. The farmer has been notified.`;

                submitBtn.style.display = "none";
                setTimeout(() => {
                    window.location.href = "orders.html";
                }, 2000);
            } catch (err) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Confirm & Place Order";
                msgBox.style.display = "block";
                msgBox.style.background = "#fee2e2";
                msgBox.style.color = "#991b1b";
                msgBox.textContent = friendlyErrorMessage(err, "Failed to place order. Please try again.");
            }
        });
    }
}



// ============================================
// MODAL
// ============================================

function setupModal() {

    const modal =
        document.getElementById("produceModal");

    const closeButton =
        document.getElementById("closeModalBtn");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeProduceModal();

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {

                    closeProduceModal();

                }

            }
        );

    }

}


function closeProduceModal() {

    const modal =
        document.getElementById("produceModal");


    if (modal) {

        modal.style.display = "none";

    }

}


// ============================================
// LOGOUT
// ============================================

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutBtn");


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async function () {

            /*
                Actual logout API handling will be
                centralized in auth.js/api.js.
            */

            if (
                typeof logoutUser === "function"
            ) {

                await logoutUser();

            } else {

                window.location.href =
                    "../buyer_login.html";

            }

        }
    );

}


// ============================================
// HTML ESCAPE
// Prevent unsafe HTML injection
// ============================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function getCropIconClass(crop) {
    const value = String(crop || "").toLowerCase();
    if (value.includes("potato")) return "fa-carrot";
    if (value.includes("wheat") || value.includes("rice") || value.includes("paddy")) return "fa-wheat-awn";
    if (value.includes("tomato") || value.includes("onion")) return "fa-apple-whole";
    return "fa-seedling";
}