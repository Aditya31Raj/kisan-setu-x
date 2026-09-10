// ============================================
// KISAN SETU - NOTIFICATIONS MODULE
// File: js/notifications.js
// ============================================

let currentNotificationPage = 1;

const notificationPageLimit = 10;


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    loadNotifications();

    setupNotificationControls();

    setupPagination();

    setupLogout();

});


// ============================================
// LOAD NOTIFICATIONS
// GET /api/v1/notifications
// ============================================

async function loadNotifications(page = 1) {

    currentNotificationPage = page;


    const container =
        document.getElementById(
            "notificationsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <p>Loading notifications...</p>
    `;


    try {

        const data = await apiRequest(`/notifications?page=${currentNotificationPage}&limit=${notificationPageLimit}`);


        displayNotifications(data);

        updatePagination(data);


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );


        container.innerHTML = `
            <div class="error-message">

                <p>
                    Unable to load notifications.
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
// DISPLAY NOTIFICATIONS
// ============================================

function displayNotifications(data) {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    if (!container) {
        return;
    }


    let notifications = [];


    if (Array.isArray(data)) {

        notifications = data;

    } else if (
        Array.isArray(data.data)
    ) {

        notifications = data.data;

    } else if (
        Array.isArray(data.items)
    ) {

        notifications = data.items;

    } else if (
        Array.isArray(data.notifications)
    ) {

        notifications = data.notifications;

    }


    if (notifications.length === 0) {

        container.innerHTML = `
            <div class="no-notifications">

                <h3>
                    No Notifications
                </h3>

                <p>
                    You don't have any notifications.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML = "";


    notifications.forEach(function (notification) {

        const card =
            createNotificationCard(
                notification
            );


        container.appendChild(card);

    });

}


// ============================================
// CREATE NOTIFICATION CARD
// ============================================

function createNotificationCard(
    notification
) {

    const card =
        document.createElement("div");


    card.className =
        "notification-card";


    /*
        readAt is null when notification
        is unread.
    */

    const isUnread =
        !notification.readAt;


    if (isUnread) {

        card.classList.add("unread");

    }


    const title =
        notification.title ||
        "Notification";


    const message =
        notification.message ||
        "";


    const type =
        notification.type ||
        "IN_APP";


    const createdAt =
        notification.createdAt ||
        "";


    const id =
        notification.id ||
        "";


    card.innerHTML = `

        <div class="notification-content">

            <h3>
                ${escapeHTML(
                    String(title)
                )}
            </h3>

            <p>
                ${escapeHTML(
                    String(message)
                )}
            </p>

            <small>
                Type:
                ${escapeHTML(
                    String(type)
                )}
            </small>

            <br>

            <small>
                ${formatDate(createdAt)}
            </small>

        </div>

        <div class="notification-action">

            ${
                isUnread
                ?
                `
                <button
                    type="button"
                    class="mark-read-btn"
                    data-id="${escapeHTML(
                        String(id)
                    )}">

                    Mark as Read

                </button>
                `
                :
                `
                <span>
                    ✓ Read
                </span>
                `
            }

        </div>

    `;


    const markReadButton =
        card.querySelector(
            ".mark-read-btn"
        );


    if (markReadButton) {

        markReadButton.addEventListener(
            "click",
            function () {

                const notificationId =
                    this.getAttribute(
                        "data-id"
                    );


                if (notificationId) {

                    markNotificationRead(
                        notificationId
                    );

                }

            }
        );

    }


    return card;

}


// ============================================
// MARK NOTIFICATION AS READ
// PATCH /api/v1/notifications/:id/read
// ============================================

async function markNotificationRead(
    notificationId
) {

    try {

        await apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH" });


        showMessage(
            "Notification marked as read.",
            "success"
        );


        /*
            Reload current page so the
            notification changes from
            unread to read.
        */

        loadNotifications(
            currentNotificationPage
        );


    } catch (error) {

        console.error(
            "Mark read error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to update notification.",
            "error"
        );

    }

}


// ============================================
// REFRESH
// ============================================

function setupNotificationControls() {

    const refreshButton =
        document.getElementById(
            "refreshNotificationsBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadNotifications(
                    currentNotificationPage
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
                    currentNotificationPage > 1
                ) {

                    loadNotifications(
                        currentNotificationPage - 1
                    );

                }

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                loadNotifications(
                    currentNotificationPage + 1
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
            currentNotificationPage <= 1;

    }


    if (pageNumber) {

        pageNumber.textContent =
            `Page ${currentNotificationPage}`;

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

            let notifications = [];


            if (Array.isArray(data)) {

                notifications = data;

            } else if (
                Array.isArray(data.data)
            ) {

                notifications = data.data;

            } else if (
                Array.isArray(data.items)
            ) {

                notifications = data.items;

            } else if (
                Array.isArray(data.notifications)
            ) {

                notifications =
                    data.notifications;

            }


            hasNextPage =
                notifications.length ===
                notificationPageLimit;

        }


        nextButton.disabled =
            !hasNextPage;

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
            "notificationMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `notification-message ${type}`;

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