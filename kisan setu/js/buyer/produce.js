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

    card.className = "produce-card";


    const title =
        produce.title || "Unnamed Produce";

    const description =
        produce.description || "No description available.";

    const location =
        produce.location || "Location not specified";

    const quantity =
        produce.availableQuantity ?? 0;

    const unit =
        produce.unit || "KG";

    const price =
        produce.pricePerUnit ?? 0;

    const status =
        produce.status || "LISTED";

    const produceId =
        produce.id;

    const cropIcon = getCropIconClass(title);


    card.innerHTML = `

        <div class="produce-card-content">

            <div class="produce-icon"><i class="fa-solid ${cropIcon}" aria-hidden="true"></i></div>

            <h3>${escapeHTML(title)}</h3>

            <p class="produce-description">
                ${escapeHTML(description)}
            </p>

            <p>
                <strong>Location:</strong>
                ${escapeHTML(location)}
            </p>

            <p>
                <strong>Available:</strong>
                ${escapeHTML(String(quantity))}
                ${escapeHTML(unit)}
            </p>

            <p>
                <strong>Price:</strong>
                ₹${escapeHTML(String(price))}
                / ${escapeHTML(unit)}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(status)}
            </p>

            <button
                type="button"
                class="view-produce-btn"
                data-id="${escapeHTML(String(produceId))}">
                View Details
            </button>

        </div>

    `;


    const viewButton =
        card.querySelector(".view-produce-btn");


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

    const detailsContainer =
        document.getElementById("produceDetails");


    if (!detailsContainer) {
        return;
    }


    const title =
        produce.title || "Unnamed Produce";

    const description =
        produce.description || "No description available.";

    const location =
        produce.location || "Not specified";

    const quantity =
        produce.availableQuantity ?? 0;

    const unit =
        produce.unit || "KG";

    const price =
        produce.pricePerUnit ?? 0;

    const status =
        produce.status || "LISTED";


    detailsContainer.innerHTML = `

        <div class="produce-detail">

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

            <hr>

            <p>
                <strong>Location:</strong>
                ${escapeHTML(location)}
            </p>

            <p>
                <strong>Available Quantity:</strong>
                ${escapeHTML(String(quantity))}
                ${escapeHTML(unit)}
            </p>

            <p>
                <strong>Price:</strong>
                ₹${escapeHTML(String(price))}
                / ${escapeHTML(unit)}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(status)}
            </p>

            <button
                type="button"
                id="orderProduceBtn"
                data-produce-id="${escapeHTML(String(produce.id || ""))}">
                Order This Produce
            </button>

        </div>

    `;


    const orderButton =
        document.getElementById("orderProduceBtn");


    if (orderButton) {

        orderButton.addEventListener(
            "click",
            function () {

                const id =
                    this.getAttribute("data-produce-id");


                if (!id) {
                    return;
                }


                /*
                    Order creation will be handled
                    by orders.js.

                    For now, redirect to orders page
                    with the produce ID.
                */

                window.location.href =
                    `orders.html?produceId=${encodeURIComponent(id)}`;

            }
        );

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
                    "../../buyer_login.html";

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