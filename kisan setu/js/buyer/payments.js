// ============================================
// KISAN SETU - PAYMENTS MODULE
// File: js/payments.js
// ============================================

let currentPaymentPage = 1;
const paymentPageLimit = 10;


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    loadPayments();

    setupPaymentPagination();

    setupPaymentModal();

    setupRefreshButton();

    setupLogout();

});


// ============================================
// LOAD PAYMENTS
// GET /api/v1/payments
// ============================================

async function loadPayments(page = 1) {

    currentPaymentPage = page;

    const container =
        document.getElementById("paymentsContainer");

    const pageNumber =
        document.getElementById("pageNumber");


    if (!container) {
        return;
    }


    container.innerHTML = `
        <p>Loading payments...</p>
    `;


    try {

        const data = await apiRequest(`/payments?page=${currentPaymentPage}&limit=${paymentPageLimit}`);


        displayPayments(data);

        updatePaymentPagination(data);


        if (pageNumber) {

            pageNumber.textContent =
                `Page ${currentPaymentPage}`;

        }


    } catch (error) {

        console.error(
            "Payment loading error:",
            error
        );


        container.innerHTML = `
            <div class="status-card status-card-error">
                <i class="fa-solid fa-credit-card"></i>
                <div><strong>Payments are temporarily unavailable</strong><p>${friendlyErrorMessage(error, "Please try again shortly.")}</p></div>
            </div>
        `;

    }

}


// ============================================
// DISPLAY PAYMENTS
// ============================================

function displayPayments(data) {

    const container =
        document.getElementById("paymentsContainer");


    if (!container) {
        return;
    }


    let paymentList = [];


    /*
        Support common backend response formats.
    */

    if (Array.isArray(data)) {

        paymentList = data;

    } else if (Array.isArray(data.data)) {

        paymentList = data.data;

    } else if (Array.isArray(data.items)) {

        paymentList = data.items;

    } else if (Array.isArray(data.payments)) {

        paymentList = data.payments;

    }


    updatePaymentSummary(paymentList);


    if (paymentList.length === 0) {

        container.innerHTML = `
            <div class="no-payments">

                <h3>No payments found</h3>

                <p>
                    You do not have any payment
                    payments yet.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = "";


    paymentList.forEach(function (payment) {

        const card =
            createPaymentCard(payment);

        container.appendChild(card);

    });

}


// ============================================
// CREATE PAYMENT CARD
// ============================================

function createPaymentCard(payment) {

    const card =
        document.createElement("div");


    card.className =
        "payment-card";


    const paymentId =
        payment.id || "N/A";

    const orderId =
        payment.orderId || "N/A";

    const rawAmt = Number(payment.order?.totalAmount ?? payment.totalOrderAmount ?? payment.amount ?? 0);
    const amount = rawAmt.toLocaleString('en-IN');

    const currency =
        payment.currency === 'INR' || !payment.currency ? '₹' : payment.currency;

    const status =
        payment.status || "INITIATED";

    const provider =
        payment.provider === 'upi_phonepe' ? 'PhonePe UPI Escrow' : (payment.provider || "Escrow");

    const createdAt =
        payment.createdAt || "";

    const orderRef = payment.order?.orderNumber || (payment.orderId ? `#${String(payment.orderId).slice(0, 8)}` : "N/A");

    card.innerHTML = `

        <div class="payment-card-content">

            <h3>
                Payment ${escapeHTML(String(orderRef))}
            </h3>

            <p>
                <strong>Payment ID:</strong>
                ${escapeHTML(String(paymentId))}
            </p>

            <p>
                <strong>Order Reference:</strong>
                ${escapeHTML(String(orderRef))}
            </p>

            <p>
                <strong>Order Total Amount:</strong>
                <strong style="color:#166534; font-size:16px;">${escapeHTML(String(currency))} ${escapeHTML(String(amount))}</strong>
            </p>

            <p>
                <strong>Payment Method:</strong>
                ${escapeHTML(String(provider))}
            </p>

            <p>
                <strong>Status:</strong>
                <span class="payment-status">
                    ${escapeHTML(String(status))}
                </span>
            </p>

            <p>
                <strong>Date:</strong>
                ${formatDate(createdAt)}
            </p>

            <div style="display: flex; gap: 8px; align-items: center; margin-top: 10px; flex-wrap: wrap;">
                <button
                    type="button"
                    class="view-payment-btn"
                    data-id="${escapeHTML(String(paymentId))}">
                    View Details
                </button>
                ${status === 'PENDING' ? `
                    <a href="orders.html" style="padding: 7px 14px; background: #16863b; color: white; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-qrcode"></i> Pay via UPI QR (₹1 Demo)
                    </a>
                ` : ''}
            </div>

        </div>

    `;


    const viewButton =
        card.querySelector(".view-payment-btn");


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function () {

                const id =
                    this.getAttribute("data-id");


                if (id && id !== "N/A") {

                    loadPaymentDetails(id);

                }

            }
        );

    }


    return card;

}


// ============================================
// PAYMENT SUMMARY
// ============================================

function updatePaymentSummary(payments) {

    const totalElement =
        document.getElementById("totalPayments");

    const successElement =
        document.getElementById("successfulPayments");

    const pendingElement =
        document.getElementById("pendingPayments");

    const failedElement =
        document.getElementById("failedPayments");


    let successful = 0;
    let pending = 0;
    let failed = 0;


    payments.forEach(function (payment) {

        const status =
            String(payment.status || "")
            .toUpperCase();


        if (status === "SUCCESS") {

            successful++;

        } else if (
            status === "PENDING" ||
            status === "INITIATED"
        ) {

            pending++;

        } else if (status === "FAILED") {

            failed++;

        }

    });


    if (totalElement) {

        totalElement.textContent =
            payments.length;

    }


    if (successElement) {

        successElement.textContent =
            successful;

    }


    if (pendingElement) {

        pendingElement.textContent =
            pending;

    }


    if (failedElement) {

        failedElement.textContent =
            failed;

    }

}


// ============================================
// PAYMENT DETAILS
// GET /api/v1/payments/:id
// ============================================

async function loadPaymentDetails(paymentId) {

    const modal =
        document.getElementById("paymentModal");

    const details =
        document.getElementById("paymentDetails");


    if (!modal || !details) {
        return;
    }


    modal.style.display = "flex";


    details.innerHTML = `
        <p>Loading payment details...</p>
    `;


    try {

        const data = await apiRequest(`/payments/${encodeURIComponent(paymentId)}`);


        const payment =
            data.data || data;


        displayPaymentDetails(payment);


    } catch (error) {

        console.error(
            "Payment details error:",
            error
        );


        details.innerHTML = `
            <p>
                Unable to load payment details.
            </p>
        `;

    }

}


// ============================================
// DISPLAY PAYMENT DETAILS
// ============================================

function displayPaymentDetails(payment) {

    const details =
        document.getElementById("paymentDetails");


    if (!details) {
        return;
    }


    const paymentId =
        payment.id || "N/A";

    const orderId =
        payment.orderId || "N/A";

    const provider =
        payment.provider || "N/A";

    const providerPaymentId =
        payment.providerPaymentId || "N/A";

    const rawAmt = Number(payment.order?.totalAmount ?? payment.totalOrderAmount ?? payment.amount ?? 0);
    const amount = rawAmt.toLocaleString('en-IN');

    const currency =
        payment.currency === 'INR' || !payment.currency ? '₹' : payment.currency;

    const status =
        payment.status || "N/A";

    const verifiedAt =
        payment.verifiedAt || null;

    const createdAt =
        payment.createdAt || null;

    const orderRef = payment.order?.orderNumber || (payment.orderId ? `#${String(payment.orderId).slice(0, 8)}` : "N/A");

    details.innerHTML = `

        <div class="payment-detail">

            <p>
                <strong>Payment Reference:</strong>
                ${escapeHTML(String(paymentId))}
            </p>

            <p>
                <strong>Order Reference:</strong>
                ${escapeHTML(String(orderRef))}
            </p>

            <p>
                <strong>Payment Method:</strong>
                ${escapeHTML(String(provider === 'upi_phonepe' ? 'PhonePe UPI Escrow' : provider))}
            </p>

            <p>
                <strong>Transaction / UTR Reference:</strong>
                ${escapeHTML(String(providerPaymentId))}
            </p>

            <p style="background:#f0fdf4; border:1px solid #bbf7d0; padding:10px 14px; border-radius:8px; margin:12px 0;">
                <strong style="color:#166534; font-size:14px;">Total Order Amount:</strong>
                <span style="font-size:18px; font-weight:800; color:#15803d; float:right;">${escapeHTML(String(currency))} ${escapeHTML(String(amount))}</span>
            </p>

            <p>
                <strong>Escrow Status:</strong>
                <span class="payment-status" style="font-weight:700; color:#166534;">
                    ${escapeHTML(String(status))}
                </span>
            </p>

            <p>
                <strong>Created:</strong>
                ${formatDate(createdAt)}
            </p>

            <p>
                <strong>Verified:</strong>
                ${formatDate(verifiedAt)}
            </p>

        </div>

    `;

}


// ============================================
// PAGINATION
// ============================================

function setupPaymentPagination() {

    const previousButton =
        document.getElementById("previousBtn");

    const nextButton =
        document.getElementById("nextBtn");


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            function () {

                if (currentPaymentPage > 1) {

                    loadPayments(
                        currentPaymentPage - 1
                    );

                }

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                loadPayments(
                    currentPaymentPage + 1
                );

            }
        );

    }

}


// ============================================
// UPDATE PAGINATION
// ============================================

function updatePaymentPagination(data) {

    const previousButton =
        document.getElementById("previousBtn");

    const nextButton =
        document.getElementById("nextBtn");


    if (previousButton) {

        previousButton.disabled =
            currentPaymentPage <= 1;

    }


    if (nextButton) {

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

            } else if (Array.isArray(data.payments)) {

                items = data.payments;

            }


            hasNextPage =
                items.length === paymentPageLimit;

        }


        nextButton.disabled =
            !hasNextPage;

    }

}


// ============================================
// REFRESH
// ============================================

function setupRefreshButton() {

    const button =
        document.getElementById(
            "refreshPaymentsBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                loadPayments(
                    currentPaymentPage
                );

            }
        );

    }

}


// ============================================
// PAYMENT MODAL
// ============================================

function setupPaymentModal() {

    const modal =
        document.getElementById("paymentModal");

    const closeButton =
        document.getElementById("closeModalBtn");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePaymentModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {

                    closePaymentModal();

                }

            }
        );

    }

}


function closePaymentModal() {

    const modal =
        document.getElementById("paymentModal");


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
// FORMAT DATE
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