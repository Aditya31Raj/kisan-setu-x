// ============================================
// KISAN SETU - DISPUTES MODULE
// File: js/disputes.js
// ============================================

let currentDisputePage = 1;

const disputePageLimit = 10;


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    setupDisputeForm();

    loadDisputes();

    setupRefresh();

    setupPagination();

    setupModal();

    setupLogout();

});


// ============================================
// CREATE DISPUTE
// POST /api/v1/disputes
// ============================================

function setupDisputeForm() {

    const form =
        document.getElementById(
            "disputeForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            await createDispute();

        }
    );

}


// ============================================
// CREATE DISPUTE
// ============================================

async function createDispute() {

    const orderId =
        document.getElementById(
            "orderId"
        );

    const reason =
        document.getElementById(
            "reason"
        );

    const submitButton =
        document.getElementById(
            "submitDisputeBtn"
        );


    const orderValue =
        orderId
        ? orderId.value.trim()
        : "";


    const reasonValue =
        reason
        ? reason.value.trim()
        : "";


    if (!orderValue) {

        showMessage(
            "Please enter the order ID.",
            "error"
        );

        return;

    }


    if (!reasonValue) {

        showMessage(
            "Please enter the reason for the dispute.",
            "error"
        );

        return;

    }


    try {

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Submitting...";

        }


        await apiRequest(
            "/disputes",
            {
                method: "POST",
                body: {
                    orderId: orderValue,
                    reason: reasonValue
                }
            }
        );


        showMessage(
            "Dispute submitted successfully.",
            "success"
        );


        /*
            Clear form after successful
            submission.
        */

        if (orderId) {
            orderId.value = "";
        }


        if (reason) {
            reason.value = "";
        }


        /*
            Reload disputes so the newly
            created dispute appears.
        */

        loadDisputes(1);


    } catch (error) {

        console.error(
            "Create dispute error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to submit dispute.",
            "error"
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Dispute";

        }

    }

}


// ============================================
// LOAD DISPUTES
// GET /api/v1/disputes
// ============================================

async function loadDisputes(page = 1) {

    currentDisputePage = page;


    const container =
        document.getElementById(
            "disputesContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <p>Loading disputes...</p>
    `;


    try {

        const data = await apiRequest(`/disputes?page=${currentDisputePage}&limit=${disputePageLimit}`);


        displayDisputes(data);

        updatePagination(data);


    } catch (error) {

        console.error(
            "Load disputes error:",
            error
        );


        container.innerHTML = `
            <div class="error-message">

                <p>
                    Unable to load disputes.
                </p>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


// ============================================
// DISPLAY DISPUTES
// ============================================

function displayDisputes(data) {

    const container =
        document.getElementById(
            "disputesContainer"
        );


    if (!container) {
        return;
    }


    let disputes = [];


    if (Array.isArray(data)) {

        disputes = data;

    } else if (
        Array.isArray(data.data)
    ) {

        disputes = data.data;

    } else if (
        Array.isArray(data.items)
    ) {

        disputes = data.items;

    } else if (
        Array.isArray(data.disputes)
    ) {

        disputes = data.disputes;

    }


    if (disputes.length === 0) {

        container.innerHTML = `
            <div class="no-disputes">

                <h3>
                    No Disputes
                </h3>

                <p>
                    You have not raised any disputes.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML = "";


    disputes.forEach(function (dispute) {

        const card =
            createDisputeCard(
                dispute
            );


        container.appendChild(card);

    });

}


// ============================================
// CREATE DISPUTE CARD
// ============================================

function createDisputeCard(dispute) {

    const card =
        document.createElement("div");


    card.className =
        "dispute-card";


    const id =
        dispute.id || "";


    const orderId =
        dispute.orderId || "N/A";


    const reason =
        dispute.reason || "N/A";


    const status =
        dispute.status || "OPEN";


    const createdAt =
        dispute.createdAt || "";


    card.innerHTML = `

        <div class="dispute-card-content">

            <h3>
                Dispute #${escapeHTML(
                    String(id)
                )}
            </h3>

            <p>
                <strong>
                    Order:
                </strong>

                ${escapeHTML(
                    String(orderId)
                )}
            </p>

            <p>
                <strong>
                    Reason:
                </strong>

                ${escapeHTML(
                    String(reason)
                )}
            </p>

            <p>
                <strong>
                    Status:
                </strong>

                <span class="dispute-status">
                    ${escapeHTML(
                        String(status)
                    )}
                </span>
            </p>

            <p>
                <strong>
                    Created:
                </strong>

                ${formatDate(createdAt)}

            </p>


            <button
                type="button"
                class="view-dispute-btn"
                data-id="${escapeHTML(
                    String(id)
                )}">

                View Details

            </button>

        </div>

    `;


    const viewButton =
        card.querySelector(
            ".view-dispute-btn"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function () {

                const disputeId =
                    this.getAttribute(
                        "data-id"
                    );


                if (disputeId) {

                    loadDisputeDetails(
                        disputeId
                    );

                }

            }
        );

    }


    return card;

}


// ============================================
// DISPUTE DETAILS
// GET /api/v1/disputes/:id
// ============================================

async function loadDisputeDetails(
    disputeId
) {

    const modal =
        document.getElementById(
            "disputeModal"
        );


    const details =
        document.getElementById(
            "disputeDetails"
        );


    if (!modal || !details) {
        return;
    }


    modal.style.display = "flex";


    details.innerHTML = `
        <p>
            Loading dispute details...
        </p>
    `;


    try {
        const data = await apiRequest(`/disputes/${encodeURIComponent(disputeId)}`);


        const dispute =
            data.data || data;


        displayDisputeDetails(
            dispute
        );


    } catch (error) {

        console.error(
            "Dispute details error:",
            error
        );


        details.innerHTML = `
            <p>
                Unable to load dispute details.
            </p>
        `;

    }

}


// ============================================
// DISPLAY DISPUTE DETAILS
// ============================================

function displayDisputeDetails(
    dispute
) {

    const details =
        document.getElementById(
            "disputeDetails"
        );


    if (!details) {
        return;
    }


    details.innerHTML = `

        <div class="dispute-detail">

            <p>
                <strong>
                    Dispute ID:
                </strong>

                ${escapeHTML(
                    String(
                        dispute.id || "N/A"
                    )
                )}
            </p>


            <p>
                <strong>
                    Order ID:
                </strong>

                ${escapeHTML(
                    String(
                        dispute.orderId || "N/A"
                    )
                )}
            </p>


            <p>
                <strong>
                    Reason:
                </strong>

                ${escapeHTML(
                    String(
                        dispute.reason || "N/A"
                    )
                )}
            </p>


            <p>
                <strong>
                    Status:
                </strong>

                ${escapeHTML(
                    String(
                        dispute.status || "N/A"
                    )
                )}
            </p>


            <p>
                <strong>
                    Created:
                </strong>

                ${formatDate(
                    dispute.createdAt
                )}
            </p>


            <p>
                <strong>
                    Resolution:
                </strong>

                ${escapeHTML(
                    String(
                        dispute.resolution ||
                        "Not resolved yet."
                    )
                )}
            </p>


            ${
                dispute.resolvedAt
                ?
                `
                <p>
                    <strong>
                        Resolved:
                    </strong>

                    ${formatDate(
                        dispute.resolvedAt
                    )}
                </p>
                `
                :
                ""
            }

        </div>

    `;

}


// ============================================
// REFRESH
// ============================================

function setupRefresh() {

    const refreshButton =
        document.getElementById(
            "refreshDisputesBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadDisputes(
                    currentDisputePage
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

                if (
                    currentDisputePage > 1
                ) {

                    loadDisputes(
                        currentDisputePage - 1
                    );

                }

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                loadDisputes(
                    currentDisputePage + 1
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
            currentDisputePage <= 1;

    }


    if (pageNumber) {

        pageNumber.textContent =
            `Page ${currentDisputePage}`;

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

            let disputes = [];


            if (Array.isArray(data)) {

                disputes = data;

            } else if (
                Array.isArray(data.data)
            ) {

                disputes = data.data;

            } else if (
                Array.isArray(data.items)
            ) {

                disputes = data.items;

            } else if (
                Array.isArray(data.disputes)
            ) {

                disputes = data.disputes;

            }


            hasNextPage =
                disputes.length ===
                disputePageLimit;

        }


        nextButton.disabled =
            !hasNextPage;

    }

}


// ============================================
// MODAL
// ============================================

function setupModal() {

    const modal =
        document.getElementById(
            "disputeModal"
        );


    const closeButton =
        document.getElementById(
            "closeModalBtn"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeDisputeModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeDisputeModal();

                }

            }
        );

    }

}


function closeDisputeModal() {

    const modal =
        document.getElementById(
            "disputeModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ============================================
// MESSAGE
// ============================================

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "disputeMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `dispute-message ${type}`;

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
        .replace(
            /'/g,
            "&#039;"
        );

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