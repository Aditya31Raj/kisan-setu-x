// ============================================
// KISAN SETU - LOGISTICS MODULE
// File: js/logistics.js
// ============================================

let currentLogisticsId = null;


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    setupTracking();

    setupStatusUpdate();

    setupLogout();

});


// ============================================
// TRACK DELIVERY
// GET /api/v1/logistics/:id
// ============================================

function setupTracking() {

    const trackButton =
        document.getElementById("trackBtn");

    const logisticsInput =
        document.getElementById("logisticsId");


    if (trackButton) {

        trackButton.addEventListener(
            "click",
            function () {

                const logisticsId =
                    logisticsInput
                    ? logisticsInput.value.trim()
                    : "";


                if (!logisticsId) {

                    showMessage(
                        "Please enter a logistics ID.",
                        "error"
                    );

                    return;

                }


                loadLogistics(
                    logisticsId
                );

            }
        );

    }

}


// ============================================
// LOAD LOGISTICS
// ============================================

async function loadLogistics(logisticsId) {

    showMessage(
        "Loading delivery information...",
        "info"
    );


        const data = await apiRequest(`/logistics/${encodeURIComponent(logisticsId)}`);


        const logistics =
            data.data || data;


        currentLogisticsId =
            logistics.id || logisticsId;


        displayLogistics(
            logistics
        );


        showMessage(
            "Delivery information loaded.",
            "success"
        );


    } catch (error) {

        console.error(
            "Logistics error:",
            error
        );


        hideLogisticsDetails();


        showMessage(
            error.message ||
            "Unable to load delivery information.",
            "error"
        );

    }

}


// ============================================
// DISPLAY LOGISTICS
// ============================================

function displayLogistics(logistics) {

    const details =
        document.getElementById(
            "logisticsDetails"
        );


    if (!details) {
        return;
    }


    details.style.display = "block";


    setText(
        "displayLogisticsId",
        logistics.id || "-"
    );


    setText(
        "orderId",
        logistics.orderId || "-"
    );


    setText(
        "logisticsStatus",
        logistics.status || "-"
    );


    setText(
        "vehicleReference",
        logistics.vehicleReference || "-"
    );


    setText(
        "driverReference",
        logistics.driverReference || "-"
    );


    setText(
        "estimatedDelivery",
        formatDate(
            logistics.estimatedDelivery
        )
    );


    setText(
        "actualDelivery",
        formatDate(
            logistics.actualDelivery
        )
    );

}


// ============================================
// UPDATE STATUS
// PATCH /api/v1/logistics/:id/status
// ============================================

function setupStatusUpdate() {

    const button =
        document.getElementById(
            "updateStatusBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            updateLogisticsStatus();

        }
    );

}


// ============================================
// UPDATE LOGISTICS STATUS
// ============================================

async function updateLogisticsStatus() {

    const statusSelect =
        document.getElementById(
            "newStatus"
        );


    if (!currentLogisticsId) {

        showMessage(
            "Track a logistics record first.",
            "error"
        );

        return;

    }


    if (
        !statusSelect ||
        !statusSelect.value
    ) {

        showMessage(
            "Please select a new status.",
            "error"
        );

        return;

    }


    const status =
        statusSelect.value;


    const updateButton =
        document.getElementById(
            "updateStatusBtn"
        );


    try {

        if (updateButton) {

            updateButton.disabled = true;

            updateButton.textContent =
                "Updating...";

        }


        const data = await apiRequest(
            `/logistics/${encodeURIComponent(currentLogisticsId)}/status`,
            {
                method: "PATCH",
                body: { status }
            }
        );


        const updatedLogistics =
            data.data || data;


        displayLogistics(
            updatedLogistics
        );


        statusSelect.value = "";


        showMessage(
            "Delivery status updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to update delivery status.",
            "error"
        );


    } finally {

        if (updateButton) {

            updateButton.disabled = false;

            updateButton.textContent =
                "Update Status";

        }

    }

}


// ============================================
// HIDE DETAILS
// ============================================

function hideLogisticsDetails() {

    const details =
        document.getElementById(
            "logisticsDetails"
        );


    if (details) {

        details.style.display =
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
            "logisticsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.className =
        `logistics-message ${type}`;

}


// ============================================
// SET TEXT
// ============================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================
// DATE FORMAT
// ============================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleString();

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