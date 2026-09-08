// ============================================
// KISAN SETU - BUYER ORDERS MODULE
// File: js/orders.js
// ============================================

let currentOrderPage = 1;
const orderPageLimit = 10;


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    loadOrders();

    setupOrderControls();

    setupPagination();

    setupOrderModal();

    setupLogout();

});


// ============================================
// LOAD ORDERS
// GET /api/v1/orders
// ============================================

async function loadOrders(page = 1) {

    currentOrderPage = page;

    const container =
        document.getElementById("ordersContainer");

    const statusFilter =
        document.getElementById("statusFilter");


    if (!container) {
        return;
    }


    container.innerHTML = `
        <p>Loading orders...</p>
    `;


    try {

        let path =
            `/orders` +
            `?page=${currentOrderPage}` +
            `&limit=${orderPageLimit}`;


        /*
            Add status only when selected.
        */

        if (
            statusFilter &&
            statusFilter.value
        ) {

            path +=
                `&status=${encodeURIComponent(
                    statusFilter.value
                )}`;

        }

        const data = await apiRequest(path);


        displayOrders(data);

        updatePagination(data);


    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );


        container.innerHTML = `
            <div class="error-message">

                <p>
                    Unable to load orders.
                </p>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


// ============================================
// DISPLAY ORDERS
// ============================================

function displayOrders(data) {

    const container =
        document.getElementById("ordersContainer");


    if (!container) {
        return;
    }


    let orders = [];


    if (Array.isArray(data)) {

        orders = data;

    } else if (Array.isArray(data.data)) {

        orders = data.data;

    } else if (Array.isArray(data.items)) {

        orders = data.items;

    } else if (Array.isArray(data.orders)) {

        orders = data.orders;

    }


    if (orders.length === 0) {

        container.innerHTML = `
            <div class="no-orders">

                <h3>No Orders Found</h3>

                <p>
                    You do not have any orders yet.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML = "";


    orders.forEach(function (order) {

        const card =
            createOrderCard(order);

        container.appendChild(card);

    });

}


// ============================================
// CREATE ORDER CARD
// ============================================

function createOrderCard(order) {

    const card =
        document.createElement("div");


    card.className =
        "order-card";


    const id =
        order.id || "N/A";

    const orderNumber =
        order.orderNumber || id;

    const status =
        order.status || "N/A";

    const total =
        order.totalAmount ?? 0;

    const currency =
        order.currency || "INR";

    const createdAt =
        order.createdAt || "";


    card.innerHTML = `

        <div class="order-card-content">

            <h3>
                Order #${escapeHTML(
                    String(orderNumber)
                )}
            </h3>

            <p>
                <strong>Status:</strong>
                <span class="order-status">
                    ${escapeHTML(
                        String(status)
                    )}
                </span>
            </p>

            <p>
                <strong>Total:</strong>
                ${escapeHTML(
                    String(currency)
                )}
                ${escapeHTML(
                    String(total)
                )}
            </p>

            <p>
                <strong>Date:</strong>
                ${formatDate(createdAt)}
            </p>

            <button
                type="button"
                class="view-order-btn"
                data-id="${escapeHTML(
                    String(id)
                )}">

                View Details

            </button>

        </div>

    `;


    const button =
        card.querySelector(".view-order-btn");


    if (button) {

        button.addEventListener(
            "click",
            function () {

                const orderId =
                    this.getAttribute("data-id");


                if (
                    orderId &&
                    orderId !== "N/A"
                ) {

                    loadOrderDetails(orderId);

                }

            }
        );

    }


    return card;

}


// ============================================
// ORDER DETAILS
// GET /api/v1/orders/:id
// ============================================

async function loadOrderDetails(orderId) {

    const modal =
        document.getElementById("orderModal");

    const details =
        document.getElementById("orderDetails");


    if (!modal || !details) {
        return;
    }


    modal.style.display = "flex";


    details.innerHTML = `
        <p>Loading order details...</p>
    `;


    try {

        const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}`);


        const order =
            data.data || data;


        displayOrderDetails(order);


    } catch (error) {

        console.error(
            "Order details error:",
            error
        );


        details.innerHTML = `
            <p>
                Unable to load order details.
            </p>
        `;

    }

}


// ============================================
// DISPLAY ORDER DETAILS
// ============================================

function displayOrderDetails(order) {

    const details =
        document.getElementById("orderDetails");


    if (!details) {
        return;
    }


    const orderNumber =
        order.orderNumber ||
        order.id ||
        "N/A";

    const status =
        order.status || "N/A";

    const subtotal =
        order.subtotal ?? 0;

    const charges =
        order.charges ?? 0;

    const total =
        order.totalAmount ?? 0;

    const currency =
        order.currency || "INR";

    const createdAt =
        order.createdAt || null;


    let itemsHTML = "";


    if (
        Array.isArray(order.items) &&
        order.items.length > 0
    ) {

        itemsHTML = `
            <h3>Order Items</h3>

            <div class="order-items">
        `;


        order.items.forEach(function (item) {

            const quantity =
                item.quantity ?? 0;

            const unitPrice =
                item.unitPrice ?? 0;

            const lineTotal =
                item.lineTotal ?? 0;


            itemsHTML += `

                <div class="order-item">

                    <p>
                        <strong>
                            Produce:
                        </strong>

                        ${escapeHTML(
                            String(
                                item.produceId ||
                                "N/A"
                            )
                        )}
                    </p>

                    <p>
                        Quantity:
                        ${escapeHTML(
                            String(quantity)
                        )}
                    </p>

                    <p>
                        Unit Price:
                        ${escapeHTML(
                            String(currency)
                        )}
                        ${escapeHTML(
                            String(unitPrice)
                        )}
                    </p>

                    <p>
                        Line Total:
                        ${escapeHTML(
                            String(currency)
                        )}
                        ${escapeHTML(
                            String(lineTotal)
                        )}
                    </p>

                </div>

            `;

        });


        itemsHTML += `</div>`;

    }


    details.innerHTML = `

        <div class="order-detail">

            <p>
                <strong>Order Number:</strong>
                ${escapeHTML(
                    String(orderNumber)
                )}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(
                    String(status)
                )}
            </p>

            <p>
                <strong>Subtotal:</strong>
                ${escapeHTML(
                    String(currency)
                )}
                ${escapeHTML(
                    String(subtotal)
                )}
            </p>

            <p>
                <strong>Charges:</strong>
                ${escapeHTML(
                    String(currency)
                )}
                ${escapeHTML(
                    String(charges)
                )}
            </p>

            <p>
                <strong>Total:</strong>
                ${escapeHTML(
                    String(currency)
                )}
                ${escapeHTML(
                    String(total)
                )}
            </p>

            <p>
                <strong>Created:</strong>
                ${formatDate(createdAt)}
            </p>

            ${itemsHTML}

        </div>

    `;

}


// ============================================
// FILTER + REFRESH
// ============================================

function setupOrderControls() {

    const filter =
        document.getElementById("statusFilter");

    const refreshButton =
        document.getElementById(
            "refreshOrdersBtn"
        );


    if (filter) {

        filter.addEventListener(
            "change",
            function () {

                loadOrders(1);

            }
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadOrders(
                    currentOrderPage
                );

            }
        );

    }

}


// ============================================
// PAGINATION
// ============================================

function setupPagination() {

    const previousButton =
        document.getElementById(
            "previousBtn"
        );

    const nextButton =
        document.getElementById(
            "nextBtn"
        );


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            function () {

                if (currentOrderPage > 1) {

                    loadOrders(
                        currentOrderPage - 1
                    );

                }

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                loadOrders(
                    currentOrderPage + 1
                );

            }
        );

    }

}


// ============================================
// UPDATE PAGINATION
// ============================================

function updatePagination(data) {

    const previousButton =
        document.getElementById(
            "previousBtn"
        );

    const nextButton =
        document.getElementById(
            "nextBtn"
        );

    const pageNumber =
        document.getElementById(
            "pageNumber"
        );


    if (previousButton) {

        previousButton.disabled =
            currentOrderPage <= 1;

    }


    if (pageNumber) {

        pageNumber.textContent =
            `Page ${currentOrderPage}`;

    }


    if (nextButton) {

        let hasNextPage = false;


        if (data.pagination) {

            hasNextPage =
                data.pagination.hasNextPage === true;

        } else if (data.meta) {

            hasNextPage =
                data.meta.hasNextPage === true;

        } else {

            let orders = [];


            if (Array.isArray(data)) {

                orders = data;

            } else if (
                Array.isArray(data.data)
            ) {

                orders = data.data;

            } else if (
                Array.isArray(data.items)
            ) {

                orders = data.items;

            } else if (
                Array.isArray(data.orders)
            ) {

                orders = data.orders;

            }


            hasNextPage =
                orders.length ===
                orderPageLimit;

        }


        nextButton.disabled =
            !hasNextPage;

    }

}


// ============================================
// MODAL
// ============================================

function setupOrderModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );

    const closeButton =
        document.getElementById(
            "closeModalBtn"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeOrderModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeOrderModal();

                }

            }
        );

    }

}


function closeOrderModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.style.display = "none";

    }

}


// ============================================
// LOGOUT
// ============================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async function () {

            if (
                typeof logoutUser ===
                "function"
            ) {

                await logoutUser();

            } else {

                window.location.href =
                    "../../buyer_login.html";

            }

        }
    );

}


// ============================================
// DATE FORMAT
// ============================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "N/A";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "N/A";
    }


    return date.toLocaleString();

}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}