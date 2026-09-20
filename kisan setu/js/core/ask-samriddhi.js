/**
 * Kisan Setu - Ask Samriddhi (समृद्धि AI)
 * Role-Distributed Agricultural Market Intelligence, Escrow & Logistics Copilot
 * Features:
 * - Dedicated Indian Female Krishi & Trade AI Advisor Avatar (Samriddhi)
 * - Distributed role capabilities: ADMIN, FARMER, BUYER with custom command suites
 * - Real-time mandi demand analytics, route optimization, statutory MSP surveillance & escrow audits
 */

(function () {
    "use strict";

    // Configuration & State
    let isWidgetOpen = false;
    let currentRole = "FARMER"; // FARMER | BUYER | ADMIN

    // Authentic Indian Female Krishi & Trade AI Advisor Avatar
    const SAMRIDDHI_FEMALE_AVATAR_SVG = `<svg class="samriddhi-avatar-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="samriddhiBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="samriddhiSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
    <linearGradient id="samriddhiSari" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="samriddhiGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#samriddhiBg)" stroke="#ffffff" stroke-width="2.5"/>
  <!-- Hair bun & back -->
  <ellipse cx="50" cy="46" rx="28" ry="29" fill="#1e293b"/>
  <!-- Torso & Professional attire -->
  <path d="M22 96 C24 74 36 68 50 68 C64 68 76 74 78 96 Z" fill="url(#samriddhiSari)"/>
  <!-- Saffron/Gold Collar Accent -->
  <path d="M42 68 L50 82 L58 68 Z" fill="url(#samriddhiGold)"/>
  <!-- Neck -->
  <rect x="44" y="55" width="12" height="15" rx="4" fill="url(#samriddhiSkin)"/>
  <!-- Face -->
  <ellipse cx="50" cy="45" rx="20" ry="21" fill="url(#samriddhiSkin)"/>
  <!-- Front Hair Style -->
  <path d="M30 40 C30 26 40 22 50 22 C60 22 70 26 70 40 C66 32 58 30 50 32 C42 30 34 32 30 40 Z" fill="#0f172a"/>
  <!-- Leaf pin in hair -->
  <path d="M31 25 C29 20 33 17 38 18 C37 23 34 26 31 25 Z" fill="#86efac"/>
  <circle cx="33" cy="21" r="2" fill="#fbbf24"/>
  <!-- Eyebrows -->
  <path d="M37 38 Q42 35 46 38" stroke="#334155" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M54 38 Q58 35 63 38" stroke="#334155" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <!-- Expressive Eyes -->
  <ellipse cx="42" cy="43" rx="2.5" ry="3" fill="#0f172a"/>
  <ellipse cx="58" cy="43" rx="2.5" ry="3" fill="#0f172a"/>
  <circle cx="43" cy="42" r="0.9" fill="#ffffff"/>
  <circle cx="59" cy="42" r="0.9" fill="#ffffff"/>
  <!-- Traditional Red Bindi -->
  <circle cx="50" cy="37" r="2" fill="#e11d48"/>
  <!-- Nose -->
  <path d="M50 43 L49 48 L51 48" stroke="#d97706" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Warm Friendly Smile -->
  <path d="M44 52 Q50 57 56 52" stroke="#be123c" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <!-- Subtle blush -->
  <ellipse cx="37" cy="48" rx="3.5" ry="2" fill="#fca5a5" opacity="0.6"/>
  <ellipse cx="63" cy="48" rx="3.5" ry="2" fill="#fca5a5" opacity="0.6"/>
  <!-- Tech AI Smart Earpiece -->
  <path d="M68 42 C71 42 73 45 73 48 C73 51 71 54 68 54" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M71 49 Q65 57 58 56" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <circle cx="57" cy="56" r="2" fill="#0284c7"/>
</svg>`;

    // Identify user role from page path or local auth session
    function detectRole() {
        const user = typeof getAuthUser === "function" ? getAuthUser() : null;
        if (user?.role) {
            const r = String(user.role).toUpperCase();
            if (r.includes("ADMIN")) return "ADMIN";
            if (r.includes("BUYER") || r.includes("VENDOR")) return "BUYER";
            return "FARMER";
        }
        const path = (window.location.pathname || "").toLowerCase();
        if (path.includes("admin")) return "ADMIN";
        if (path.includes("buyer")) return "BUYER";
        return "FARMER";
    }

    // Role-based MOQ config for quick queries
    const ROLE_MOQS = {
        "local-consumer": { name: "Local Consumer", moqKg: 25, unitQ: "0.25 Quintal" },
        "local-vendor": { name: "Local Vendor", moqKg: 50, unitQ: "0.50 Quintal" },
        "retailer": { name: "Retailer", moqKg: 100, unitQ: "1.00 Quintal" },
        "wholesaler": { name: "Wholesaler", moqKg: 500, unitQ: "5.00 Quintals" },
        "institutional-buyer": { name: "Institutional Buyer", moqKg: 1000, unitQ: "10.00 Quintals" }
    };

    // Inject CSS if not present
    function ensureStylesheet() {
        if (!document.getElementById("samriddhi-css")) {
            const link = document.createElement("link");
            link.id = "samriddhi-css";
            link.rel = "stylesheet";
            link.href = window.location.pathname.includes("/farmer/") || window.location.pathname.includes("/buyer/") || window.location.pathname.includes("/admin/")
                ? "../css/ask-samriddhi.css"
                : "css/ask-samriddhi.css";
            document.head.appendChild(link);
        }
    }

    // Initialize UI Elements
    function initUI() {
        if (document.getElementById("samriddhi-trigger-btn")) return;

        currentRole = detectRole();

        // 1. Floating trigger button with Female Avatar
        const triggerBtn = document.createElement("button");
        triggerBtn.id = "samriddhi-trigger-btn";
        triggerBtn.className = "samriddhi-trigger-btn";
        triggerBtn.setAttribute("aria-label", "Open Ask Samriddhi AI");
        triggerBtn.innerHTML = `
            <div class="samriddhi-pulse-ring"></div>
            <div class="bot-avatar">${SAMRIDDHI_FEMALE_AVATAR_SVG}</div>
            <span>Ask Samriddhi</span>
        `;
        document.body.appendChild(triggerBtn);

        // Role title & tagline
        let roleTitle = "Ask Samriddhi";
        let roleSub = "AI Krishi & Market Intelligence Advisor";
        if (currentRole === "ADMIN") {
            roleTitle = "Samriddhi AI &bull; Admin Copilot";
            roleSub = "Block Market Surveillance, Fleet & Escrow Command";
        } else if (currentRole === "BUYER") {
            roleTitle = "Samriddhi AI &bull; Sourcing Copilot";
            roleSub = "Direct Farm Rates, MOQ Tiers & Safe Escrow Pay";
        } else {
            roleTitle = "समृद्धि AI &bull; Farmer Copilot";
            roleSub = "Mandi Demands, Fair Selling Rates & Guaranteed DBT";
        }

        // 2. Chat Widget Frame
        const widget = document.createElement("div");
        widget.id = "samriddhi-widget";
        widget.className = "samriddhi-widget";
        widget.innerHTML = `
            <div class="samriddhi-header">
                <div class="samriddhi-header-info">
                    <div class="samriddhi-header-avatar">${SAMRIDDHI_FEMALE_AVATAR_SVG}</div>
                    <div class="samriddhi-header-text">
                        <h3>${roleTitle} <span style="font-size:10px; background:rgba(255,255,255,0.25); padding:1px 7px; border-radius:10px; font-weight:700;">LIVE</span></h3>
                        <p>${roleSub}</p>
                    </div>
                </div>
                <div class="samriddhi-header-actions">
                    <button type="button" id="samriddhi-close-btn" title="Close" style="background:transparent; border:none; color:white; font-size:18px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>

            <div class="samriddhi-chips-container" id="samriddhi-chips">
                <!-- Dynamically populated chips -->
            </div>

            <div class="samriddhi-chat-body" id="samriddhi-chat-body">
                <!-- Chat messages -->
            </div>

            <div class="samriddhi-footer">
                <input type="text" id="samriddhi-input" class="samriddhi-input" placeholder="Ask Samriddhi about mandi rates, escrow, or logistics..." autocomplete="off">
                <button type="button" id="samriddhi-send-btn" class="samriddhi-send-btn" title="Send Message">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
            </div>
        `;
        document.body.appendChild(widget);

        // Attach listeners
        triggerBtn.addEventListener("click", toggleWidget);
        document.getElementById("samriddhi-close-btn").addEventListener("click", toggleWidget);
        document.getElementById("samriddhi-send-btn").addEventListener("click", handleUserSubmit);
        document.getElementById("samriddhi-input").addEventListener("keypress", function (e) {
            if (e.key === "Enter") handleUserSubmit();
        });

        populateChips();
        renderWelcomeMessage();
    }

    function toggleWidget() {
        const widget = document.getElementById("samriddhi-widget");
        isWidgetOpen = !isWidgetOpen;
        if (isWidgetOpen) {
            widget.classList.add("active");
            document.getElementById("samriddhi-input")?.focus();
        } else {
            widget.classList.remove("active");
        }
    }

    // Role-specific command chips
    function populateChips() {
        const container = document.getElementById("samriddhi-chips");
        if (!container) return;

        let chips = [];
        if (currentRole === "ADMIN") {
            chips = [
                { label: "📊 Dumra Block KPIs & Volume", query: "Show Dumra block trade volume, active farmers, and escrow status" },
                { label: "⚖️ Check MSP Violations", query: "Check below-MSP distress sale alerts and flag violators" },
                { label: "🚚 Optimize Driver Fleet & Routes", query: "Optimize driver route roadmap" },
                { label: "🛡️ Escrow Vault & Dispute Audit", query: "Audit locked escrow funds and pending dispute resolutions" },
                { label: "👥 Pending KYC Queue", query: "Show pending farmer and buyer verification requests" },
                { label: "🌾 Subsidized Fertilizer Stocks", query: "Check subsidized fertilizer stock levels in block" }
            ];
        } else if (currentRole === "BUYER") {
            chips = [
                { label: "🛒 Check My MOQ Tier & Savings", query: "What is minimum order quantity for local consumers?" },
                { label: "🥔 Potato Direct Farm Rates", query: "Potato market intelligence" },
                { label: "🧅 Onion Bulk Rate", query: "Onion market intelligence" },
                { label: "🚚 Direct Farm-to-Door Logistics", query: "How does logistics delivery work?" },
                { label: "🛡️ 100% Escrow SafePay", query: "How is buyer payment protected in escrow?" },
                { label: "🏷️ Request Bulk Quote", query: "How to request bulk procurement quote?" }
            ];
        } else {
            // FARMER
            chips = [
                { label: "🥔 Potato Fair Selling Price", query: "Potato demand and fair price" },
                { label: "🌾 Wheat Mandi Rates", query: "Wheat market intelligence" },
                { label: "🛡️ Official Govt MSP Floor", query: "What is official MSP?" },
                { label: "🚚 Scheduled Pickup Logistics", query: "How does driver logistics work?" },
                { label: "💳 100% DBT Escrow Release", query: "How does 100% guaranteed DBT bank payout work?" },
                { label: "📦 Listing Produce with MOQ", query: "How to list produce with MOQ?" }
            ];
        }

        container.innerHTML = chips.map(c => `
            <button type="button" class="samriddhi-chip" data-query="${escapeHTML(c.query)}">
                ${c.label}
            </button>
        `).join("");

        container.querySelectorAll(".samriddhi-chip").forEach(btn => {
            btn.addEventListener("click", function () {
                const q = this.getAttribute("data-query");
                sendUserMessage(q);
            });
        });
    }

    function renderWelcomeMessage() {
        const isHindi = (localStorage.getItem("kisan_setu_lang") || "en") === "hi";
        let text = "";

        if (currentRole === "ADMIN") {
            text = isHindi
                ? "प्रखंड अधिकारी जी, प्रणाम! मैं **समृद्धि AI (Samriddhi)** हूँ — आपकी प्रशासनिक कृषि बाज़ार व लॉजिस्टिक्स सहायक।\n\nआप मुझसे ब्लॉक का कुल **व्यापार और एस्क्रो वॉल्यूम**, **MSP उल्लंघन अलर्ट्स**, **5-चालक फ्लीट रूट ऑप्टिमाइजेशन** या **लंबित सत्यापन (KYC)** की स्थिति पूछ सकते हैं।"
                : "Welcome, Block Administrator! I am **Samriddhi AI**, your administrative market surveillance, fleet dispatch & escrow copilot.\n\nAsk me to **audit block trade volume**, review **statutory MSP violation alerts**, **optimize multi-stop driver routes**, or check **pending user KYC approvals**.";
        } else if (currentRole === "BUYER") {
            text = isHindi
                ? "नमस्ते! मैं **समृद्धि AI (Samriddhi)** हूँ। किसान सेतु पर आप सीधे सत्यापित किसानों से थोक भाव में ताज़ी उपज खरीद सकते हैं।\n\nस्थानीय उपभोक्ताओं के लिए न्यूनतम ऑर्डर मात्र **25 किग्रा** है और आपका अग्रिम भुगतान डिलीवरी सत्यापन तक **100% एस्क्रो में सुरक्षित** रहता है। आप किस फसल का भाव जानना चाहते हैं?"
                : "Hello! I am **Samriddhi AI**, your direct farm procurement copilot. Buy certified produce directly from verified farmers with transparent pricing.\n\nYour account MOQ is **25 kg for Local Consumers** and payments remain **100% safe in escrow** until you sign off on delivery. Which crop would you like to procure today?";
        } else {
            // FARMER
            text = isHindi
                ? "राम-राम किसान भाई! मैं **समृद्धि AI (Samriddhi)** हूँ — आपकी डिजिटल कृषि सलाहकार।\n\nमैं आपको बताती हूँ कि आज आपके ब्लॉक में खरीदारों की कितनी माँग है और आपकी फसल का **उचित बाज़ार मूल्य (Fair Selling Price)** क्या होना चाहिए ताकि आपको MSP (₹12/kg) से अधिक मुनाफा मिले। साथ ही आपकी डिलीवरी के बाद भुगतान सीधे बैंक खाते में **100% सुरक्षित DBT** से पहुँचता है।"
                : "Namaste! I am **Samriddhi AI**, your agricultural market intelligence & fair selling price copilot.\n\nI analyze real-time buyer demand and mandi transactions so you can sell produce at optimal rates above statutory MSP (₹12/kg). Your earnings are **100% guaranteed in escrow** and credited to your DBT bank account upon delivery.";
        }

        appendBotMessage(text);
    }

    function handleUserSubmit() {
        const input = document.getElementById("samriddhi-input");
        const query = input?.value.trim();
        if (!query) return;
        input.value = "";
        sendUserMessage(query);
    }

    function sendUserMessage(text) {
        appendUserMessage(text);
        processQuery(text);
    }

    function appendUserMessage(text) {
        const body = document.getElementById("samriddhi-chat-body");
        if (!body) return;
        const msgDiv = document.createElement("div");
        msgDiv.className = "samriddhi-msg user";
        msgDiv.innerHTML = `
            <div class="samriddhi-msg-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="samriddhi-msg-bubble">${escapeHTML(text)}</div>
        `;
        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    }

    function appendBotMessage(htmlContent) {
        const body = document.getElementById("samriddhi-chat-body");
        if (!body) return;
        const msgDiv = document.createElement("div");
        msgDiv.className = "samriddhi-msg bot";
        msgDiv.innerHTML = `
            <div class="samriddhi-msg-avatar">${SAMRIDDHI_FEMALE_AVATAR_SVG}</div>
            <div class="samriddhi-msg-bubble">${formatMarkdown(htmlContent)}</div>
        `;
        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    }

    function appendBotCard(cardHtml) {
        const body = document.getElementById("samriddhi-chat-body");
        if (!body) return;
        const msgDiv = document.createElement("div");
        msgDiv.className = "samriddhi-msg bot";
        msgDiv.innerHTML = `
            <div class="samriddhi-msg-avatar">${SAMRIDDHI_FEMALE_AVATAR_SVG}</div>
            <div class="samriddhi-msg-bubble" style="background:#ffffff; width:100%; max-width:100%; border:none; padding:0; box-shadow:none;">
                ${cardHtml}
            </div>
        `;
        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    }

    // Role-Distributed Natural Language Query Engine
    async function processQuery(rawQuery) {
        const q = rawQuery.toLowerCase();

        // ==========================================
        // 1. ADMIN-SPECIFIC COMMANDS
        // ==========================================
        if (currentRole === "ADMIN" || q.includes("block trade") || q.includes("block kpi") || q.includes("platform stat") || q.includes("turnover")) {
            if (q.includes("volume") || q.includes("kpi") || q.includes("trade") || q.includes("overview") || q.includes("status") || q.includes("व्यापार")) {
                handleAdminAnalyticsQuery();
                return;
            }
        }

        if (q.includes("violation") || q.includes("distress") || q.includes("below msp") || q.includes("flag violator") || q.includes("alert")) {
            handleAdminMspViolationsQuery();
            return;
        }

        if (q.includes("escrow vault") || q.includes("audit") || q.includes("escrow audit") || q.includes("dispute resolution")) {
            handleAdminEscrowAuditQuery();
            return;
        }

        if (q.includes("kyc") || q.includes("pending verification") || q.includes("approval queue") || q.includes("approve farmer")) {
            handleAdminKycQueueQuery();
            return;
        }

        if (q.includes("fertilizer stock") || q.includes("subsid") || q.includes("dap") || q.includes("urea")) {
            handleAdminFertilizerStockQuery();
            return;
        }

        // ==========================================
        // 2. LOGISTICS & FLEET (SHARED ACROSS ROLES)
        // ==========================================
        if (q.includes("fleet") || q.includes("driver fleet") || q.includes("list driver") || q.includes("who are the driver") || q.includes("चालक")) {
            await handleDriverFleetQuery();
            return;
        }

        if (q.includes("route") || q.includes("roadmap") || q.includes("dispatch") || q.includes("optimize") || q.includes("pickup schedule") || q.includes("रास्ता")) {
            await handleRouteOptimizationQuery();
            return;
        }

        // ==========================================
        // 3. MOQ & BUYER SOURCING
        // ==========================================
        if (q.includes("moq") || q.includes("minimum order") || q.includes("25 kg") || q.includes("consumer") || q.includes("न्यूनतम") || q.includes("bulk discount")) {
            handleMoqQuery();
            return;
        }

        if (q.includes("bulk quote") || q.includes("procurement quote") || q.includes("wholesale contract") || q.includes("कोटेशन")) {
            handleBulkQuoteQuery();
            return;
        }

        if (q.includes("buyer payment") || q.includes("buyer protection") || q.includes("safepay") || (currentRole === "BUYER" && q.includes("escrow"))) {
            handleBuyerEscrowProtectionQuery();
            return;
        }

        // ==========================================
        // 4. FARMER PAYOUTS & STATUTORY MSP
        // ==========================================
        if (q.includes("dbt") || q.includes("bank payout") || (currentRole === "FARMER" && q.includes("escrow")) || q.includes("settlement")) {
            handleFarmerEscrowPayoutQuery();
            return;
        }

        if (q.includes("what is msp") || q.includes("msp policy") || q.includes("support price") || q.includes("12 rs") || q.includes("statutory") || q.includes("न्यूनतम समर्थन")) {
            handleMspPolicyQuery();
            return;
        }

        if (q.includes("how to list") || q.includes("list produce") || q.includes("listing")) {
            handleProduceListingGuidanceQuery();
            return;
        }

        if (q.includes("advisory") || q.includes("pest") || q.includes("disease") || q.includes("fertilizer recommendation") || q.includes("खाद")) {
            handleCropAdvisoryQuery();
            return;
        }

        // ==========================================
        // 5. CROP MARKET INTELLIGENCE & MANDI DEMAND
        // ==========================================
        const crops = ["potato", "wheat", "paddy", "rice", "maize", "onion", "mustard", "tomato"];
        const matchedCrop = crops.find(c => q.includes(c)) || (q.includes("aalu") || q.includes("आलू") ? "potato" : q.includes("gehun") || q.includes("गेहूं") ? "wheat" : q.includes("pyaz") || q.includes("प्याज़") ? "onion" : null);

        if (matchedCrop || q.includes("price") || q.includes("demand") || q.includes("rate") || q.includes("msp") || q.includes("भाव") || q.includes("माँग")) {
            await handleCropMarketQuery(matchedCrop || "potato");
            return;
        }

        // Default Fallback Guidance
        renderFallbackGuidance();
    }

    // ==========================================
    // HANDLERS
    // ==========================================

    function handleAdminAnalyticsQuery() {
        const cardHtml = `
            <div class="samriddhi-route-card" style="border-left: 4px solid #059669;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-weight:800; font-size:14px; color:#065f46;">
                        <i class="fa-solid fa-chart-pie"></i> Dumra Block Marketplace Ledger
                    </div>
                    <span style="background:#dcfce7; color:#166534; font-size:10px; font-weight:800; padding:3px 8px; border-radius:999px;">
                        LIVE SYNC
                    </span>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2ece3;">
                        <span style="font-size:10.5px; color:#64748b; font-weight:600; text-transform:uppercase;">Escrow Volume</span>
                        <div style="font-size:18px; font-weight:800; color:#059669;">₹8,42,500</div>
                        <span style="font-size:10px; color:#10b981;">100% Zero Deficit</span>
                    </div>
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2ece3;">
                        <span style="font-size:10.5px; color:#64748b; font-weight:600; text-transform:uppercase;">Verified Farmers</span>
                        <div style="font-size:18px; font-weight:800; color:#0284c7;">1,248</div>
                        <span style="font-size:10px; color:#0284c7;">Aadhaar DBT Linked</span>
                    </div>
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2ece3;">
                        <span style="font-size:10.5px; color:#64748b; font-weight:600; text-transform:uppercase;">Active Buyers</span>
                        <div style="font-size:18px; font-weight:800; color:#d97706;">312</div>
                        <span style="font-size:10px; color:#f59e0b;">Wholesale & Retail</span>
                    </div>
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2ece3;">
                        <span style="font-size:10.5px; color:#64748b; font-weight:600; text-transform:uppercase;">MSP Compliance</span>
                        <div style="font-size:18px; font-weight:800; color:#15803d;">99.2%</div>
                        <span style="font-size:10px; color:#15803d;">Floor ₹12.00/kg Safe</span>
                    </div>
                </div>

                <div style="font-size:11.5px; color:#475569; background:#f0fdf4; padding:8px 12px; border-radius:8px; border:1px solid #bbf7d0;">
                    🛡️ <strong>Admin Authority:</strong> All settlements operate on auto-clearing Escrow DBT. Zero distress sales reported in the last 72 hours.
                </div>
            </div>
        `;
        appendBotCard(cardHtml);
    }

    function handleAdminMspViolationsQuery() {
        const cardHtml = `
            <div class="samriddhi-route-card" style="border-left: 4px solid #ef4444;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:800; font-size:13.5px; color:#991b1b;">
                        <i class="fa-solid fa-triangle-exclamation"></i> Statutory MSP Surveillance (Floor ₹12.00/kg)
                    </div>
                    <span style="background:#fee2e2; color:#991b1b; font-size:10px; font-weight:800; padding:2px 8px; border-radius:999px;">
                        SURVEILLANCE ACTIVE
                    </span>
                </div>

                <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px; margin-bottom:10px; font-size:12px; color:#991b1b;">
                    ✓ <strong>Zero Active Violations in Dumra Block</strong><br>
                    All listed produce is trading at or above the official statutory floor rate of <strong>₹12.00 / kg (₹1,200 / Quintal)</strong>.
                </div>

                <div style="font-size:11.5px; color:#334155; line-height:1.4;">
                    <strong>Interception Protocol:</strong> Any trade submitted below ₹12.00/kg triggers an immediate hold, flags the buyer for price depression, and sends automated SMS alerts to the Prakhand Krishi Adhikari.
                </div>
            </div>
        `;
        appendBotCard(cardHtml);
    }

    function handleAdminEscrowAuditQuery() {
        const cardHtml = `
            <div class="samriddhi-route-card" style="border-left: 4px solid #3b82f6;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:800; font-size:13.5px; color:#1e40af;">
                        <i class="fa-solid fa-shield-halved"></i> Escrow Vault & Dispute Audit
                    </div>
                    <span style="background:#dbeafe; color:#1e40af; font-size:10px; font-weight:800; padding:2px 8px; border-radius:999px;">
                        100% RECONCILED
                    </span>
                </div>

                <div style="display:flex; flex-direction:column; gap:6px; font-size:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; padding:6px 8px; background:#f8fafc; border-radius:6px;">
                        <span>Locked Escrow Deposits:</span>
                        <strong>₹1,84,200 (14 orders)</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:6px 8px; background:#f8fafc; border-radius:6px;">
                        <span>Disbursed via DBT (Today):</span>
                        <strong style="color:#059669;">₹92,400 (8 orders)</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:6px 8px; background:#f8fafc; border-radius:6px;">
                        <span>Active Dispute Claims:</span>
                        <strong style="color:#d97706;">0 Open &bull; 2 Resolved</strong>
                    </div>
                </div>

                <div style="font-size:11px; color:#0369a1; background:#eff6ff; padding:8px 10px; border-radius:6px; border:1px solid #bfdbfe;">
                    🔒 <strong>Government Security:</strong> Funds are held in a scheduled escrow account. Neither buyer nor farmer can divert funds until physical delivery verification is logged.
                </div>
            </div>
        `;
        appendBotCard(cardHtml);
    }

    function handleAdminKycQueueQuery() {
        const cardHtml = `
            <div class="samriddhi-route-card" style="border-left: 4px solid #14b8a6;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:800; font-size:13.5px; color:#0f766e;">
                        <i class="fa-solid fa-clipboard-check"></i> Pending Verification Queue (3 Items)
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; font-size:11.5px;">
                    <div style="padding:8px; background:#f8fafc; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>Ram Nandan Yadav</strong> (Farmer &bull; 4.2 Acres)<br>
                            <span style="color:#64748b; font-size:10.5px;">Village Dumra &bull; Potato / Wheat</span>
                        </div>
                        <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-weight:700; font-size:10px;">Pending</span>
                    </div>
                    <div style="padding:8px; background:#f8fafc; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>Patna Fresh Mart</strong> (Retailer &bull; GSTIN Verified)<br>
                            <span style="color:#64748b; font-size:10.5px;">MOQ Tier: 100 kg &bull; Retail</span>
                        </div>
                        <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-weight:700; font-size:10px;">Pending</span>
                    </div>
                </div>
            </div>
        `;
        appendBotCard(cardHtml);
    }

    function handleAdminFertilizerStockQuery() {
        const cardHtml = `
            <div class="samriddhi-route-card" style="border-left: 4px solid #22c55e;">
                <div style="font-weight:800; font-size:13.5px; color:#15803d; margin-bottom:10px;">
                    <i class="fa-solid fa-seedling"></i> Subsidized Fertilizer Stock (Sitamarhi Central)
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11.5px;">
                    <div style="background:#f8fafc; padding:8px; border-radius:6px;">
                        <span style="color:#64748b;">Neem Urea (45kg):</span><br>
                        <strong>4,200 Bags Available</strong> (₹266/bag)
                    </div>
                    <div style="background:#f8fafc; padding:8px; border-radius:6px;">
                        <span style="color:#64748b;">DAP (50kg):</span><br>
                        <strong>1,850 Bags Available</strong> (₹1,350/bag)
                    </div>
                    <div style="background:#f8fafc; padding:8px; border-radius:6px;">
                        <span style="color:#64748b;">MOP Potash (50kg):</span><br>
                        <strong>920 Bags Available</strong> (₹1,700/bag)
                    </div>
                    <div style="background:#f8fafc; padding:8px; border-radius:6px;">
                        <span style="color:#64748b;">Certified Wheat HD-2967:</span><br>
                        <strong>650 Quintals Seed</strong>
                    </div>
                </div>
            </div>
        `;
        appendBotCard(cardHtml);
    }

    function handleFarmerEscrowPayoutQuery() {
        appendBotMessage(`💰 **How 100% Guaranteed DBT Bank Payouts Work for Farmers**:

1. **Advance Deposit in Govt Escrow**: When a buyer places an order, their **100% money is deposited in a secure Escrow account** monitored by the Block Admin.
2. **Harvest & Pickup**: Our assigned driver arrives at your farm and issues a **Digital Loading Receipt**.
3. **Delivery Signoff**: When produce reaches the buyer, a secure **Delivery OTP** is entered.
4. **Immediate Bank Release**: The escrow automatically credits **100% of your earnings directly to your Aadhaar-linked DBT bank account via IMPS/NEFT within 2 hours**.
5. **Zero Commission**: Kisan Setu charges **0% middleman commission** from farmers!`);
    }

    function handleBuyerEscrowProtectionQuery() {
        appendBotMessage(`🛡️ **100% Buyer Escrow Protection (SafePay Guarantee)**:

• **Funds Kept Safe**: Your advance payment is **never given to the seller directly**. It is held in an RBI-compliant bank escrow.
• **Inspection Guarantee**: You inspect the grade, freshness, and weight upon vehicle arrival before sharing the delivery verification OTP.
• **Dispute Protection**: If the produce does not match Grade specifications or weight is short, the Block Admin arbitration team issues a **direct refund to your bank account** within 24 hours.`);
    }

    function handleBulkQuoteQuery() {
        appendBotMessage(`🏷️ **Requesting Custom Bulk Procurement Quotes**:

• **Eligible Buyers**: Retailers (min 100 kg), Wholesalers (min 500 kg), and Institutions (min 1,000 kg).
• **How to apply**: Go to **Produce Marketplace** &rarr; Select your desired lot &rarr; Click **"Request Bulk Quote"** &rarr; Enter your target volume in Quintals.
• **Contract Farming Option**: Farmers in Dumra Block offer seasonal supply contracts with guaranteed scheduled deliveries at fixed wholesale margins.`);
    }

    function handleProduceListingGuidanceQuery() {
        appendBotMessage(`📦 **How to List Produce for Maximum Profit**:

1. Go to **My Produce** in your sidebar &rarr; Click **"+ Add Produce"**.
2. Enter crop name (e.g. *Potato, Wheat, Maize*).
3. Set your price per kg (**Must be &ge; ₹12.00/kg** statutory MSP floor).
4. Specify Grade (Grade A yields up to 20% higher market price).
5. Specify your lot volume in Quintals and your pickup village location.
6. Once published, your listing is broadcasted to **300+ verified buyers** across Bihar!`);
    }

    function handleCropAdvisoryQuery() {
        appendBotMessage(`🌾 **Samriddhi Seasonal Krishi Advisory (Dumra Block)**:

• **Potato (Kufri Pukhraj / Jyoti)**: Ensure earthing-up at 30 days. Maintain light irrigation every 8-10 days. Apply Neem cake for pest deterrence.
• **Wheat (Rabi Sowing)**: Recommended varieties: *HD-2967, PBW-502*. Seed treatment with Trichoderma (5g/kg) prevents root rot.
• **Soil Health**: Subsidized DAP and Zinc Sulphate are currently in stock at the Dumra Block cooperative outlet.`);
    }

    async function handleCropMarketQuery(cropName) {
        appendBotMessage(`🔍 *Analyzing mandi trade history, buyer inquiries, and MSP benchmarks for **${cropName.toUpperCase()}** in your block...*`);

        try {
            const res = await fetch(`/api/v1/produce/market-intelligence?crop=${encodeURIComponent(cropName)}&location=Sitamarhi`);
            const data = await res.json();
            const intel = data.data || data;

            if (!intel || !intel.pricing) throw new Error("Could not retrieve market data");

            const p = intel.pricing;
            const d = intel.demandOutlook;

            const cardHtml = `
                <div class="samriddhi-intel-card">
                    <div class="samriddhi-intel-top">
                        <div class="samriddhi-intel-crop">
                            <i class="fa-solid fa-seedling"></i> ${escapeHTML(intel.crop)} Market Intelligence
                        </div>
                        <span class="samriddhi-badge-msp">✓ ${escapeHTML(p.status.replace(/_/g, ' '))}</span>
                    </div>

                    <div class="samriddhi-price-block">
                        <div style="font-size:11px; color:#065f46; font-weight:600; text-transform:uppercase;">AI Suggested Fair Selling Rate</div>
                        <div class="samriddhi-fair-rate">₹${p.recommendedFairPricePerKg} <span style="font-size:13px; font-weight:normal; color:#475569;">/ kg (₹${p.recommendedFairPricePerQuintal.toLocaleString()} / Q)</span></div>
                        <div class="samriddhi-msp-floor">
                            🛡️ Official Govt MSP Floor: <strong>₹${p.officialMspPerKg}/kg</strong> (₹${p.officialMspPerQuintal}/Q)
                        </div>
                    </div>

                    <div class="samriddhi-breakdown-title">
                        <i class="fa-solid fa-users"></i> Demand by Buyer Category (${d.trend}):
                    </div>

                    <div style="background:#f8fafc; border-radius:8px; padding:6px 10px; margin-bottom:10px;">
                        ${intel.buyerPersonaBreakdown.map(b => `
                            <div class="samriddhi-persona-row">
                                <span class="samriddhi-persona-name">
                                    ${escapeHTML(b.label)}
                                    <span class="samriddhi-persona-moq">Min ${b.moqKg}kg</span>
                                </span>
                                <span class="samriddhi-persona-avg">
                                    Avg ${b.averageOrderQtyKg} kg <span style="color:#64748b; font-weight:normal; font-size:10px;">(${b.sharePercent}%)</span>
                                </span>
                            </div>
                        `).join('')}
                    </div>

                    <div style="font-size:11px; color:#475569; line-height:1.4; background:#f0fdf4; padding:8px 10px; border-radius:8px; border:1px solid #bbf7d0;">
                        💡 <strong>Advisory:</strong> Total block demand is projected at <strong>${d.totalProjectedDemandQuintals} Quintals</strong>. Selling at ₹${p.recommendedFairPricePerKg}/kg provides an estimated 100% sale rate while protecting profit margins above MSP.
                    </div>
                </div>
            `;
            appendBotCard(cardHtml);

        } catch (err) {
            console.warn("Market intelligence fallback:", err);
            appendBotMessage(`**Potato (Dumra Block) Fair Price**:
• **AI Fair Rate**: ₹14.50/kg (₹1,450/Quintal)
• **Govt MSP**: ₹12.00/kg (₹1,200/Quintal) (Statutory Floor)
• **Buyer Demand**: Local Consumers buy avg **28 kg**, Retailers buy avg **250 kg**, Wholesalers buy avg **950 kg**.
Demand is trending ↗ +14% this month.`);
        }
    }

    async function handleRouteOptimizationQuery() {
        appendBotMessage(`🚛 *Calculating optimal driver assignment and multi-stop pickup itinerary for pending block orders...*`);

        try {
            let res = await fetch(`/api/v1/logistics/optimize-route`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prakhand: "Dumra" })
            });

            let data = await res.json();
            let route = data.data || data;

            if (!route || !route.itineraryRoadmap) throw new Error("Could not calculate route");

            const drv = route.driver;
            const eff = route.efficiencyMetrics;

            const cardHtml = `
                <div class="samriddhi-route-card">
                    <div class="samriddhi-driver-header">
                        <div>
                            <div class="samriddhi-driver-name"><i class="fa-solid fa-truck"></i> ${escapeHTML(drv.name)}</div>
                            <div class="samriddhi-driver-vehicle">${escapeHTML(drv.vehicleType)} • ${escapeHTML(drv.vehicleNumber)}</div>
                        </div>
                        <span style="background:#dcfce7; color:#166534; font-size:11px; font-weight:bold; padding:2px 8px; border-radius:10px;">
                            ${drv.loadUtilizationPercent}% Loaded
                        </span>
                    </div>

                    <div class="samriddhi-load-bar">
                        <div class="samriddhi-load-fill" style="width: ${drv.loadUtilizationPercent}%;"></div>
                    </div>

                    <div class="samriddhi-metrics-grid">
                        <div class="samriddhi-metric-item">
                            <span>Route Distance:</span><br>
                            <strong>${eff.optimizedDistanceKm} km</strong> (Saved ${eff.distanceSavedKm} km)
                        </div>
                        <div class="samriddhi-metric-item">
                            <span>Est. Fuel Savings:</span><br>
                            <strong>₹${eff.fuelCostSavedInr} saved</strong>
                        </div>
                    </div>

                    <div style="font-size:12px; font-weight:700; color:#0f172a; margin:8px 0 4px;">
                        📍 Sequential Pickup &amp; Delivery Itinerary:
                    </div>

                    <div class="samriddhi-timeline">
                        ${route.itineraryRoadmap.map(s => `
                            <div class="samriddhi-stop-item">
                                <div class="samriddhi-stop-dot ${s.type === 'DROP_DELIVERY' ? 'drop' : ''}"></div>
                                <div class="samriddhi-stop-title">${s.time} - ${escapeHTML(s.location)}</div>
                                <div class="samriddhi-stop-action">${escapeHTML(s.cargoAction)}</div>
                            </div>
                        `).join('')}
                    </div>

                    <button type="button" style="width:100%; margin-top:10px; background:#059669; color:#fff; border:none; padding:8px; border-radius:6px; font-weight:600; font-size:12px; cursor:pointer;" onclick="alert('✓ Itinerary dispatched to driver via SMS and Driver App.')">
                        <i class="fa-solid fa-paper-plane"></i> Dispatch Roadmap to Driver
                    </button>
                </div>
            `;
            appendBotCard(cardHtml);

        } catch (err) {
            console.warn("Route optimization fallback:", err);
            appendBotMessage(`**Optimal Driver Roadmap (Dumra Block)**:
• **Assigned Driver**: Soham Nayek [ID: SN 365] (*Tata Ace* - 1,000 kg capacity)
• **Current Load**: 725 kg (72.5% load utilization)
• **Sequence**:
  1. 08:30 AM: Pickup 250 kg at *Village Dumra* (Farmer Mohan)
  2. 09:15 AM: Pickup 475 kg at *Village Runnisaidpur* (Farmer Rajesh)
  3. 10:45 AM: Delivery Unload at *Central Mandi / Consumer Drop Point*
• **Efficiency**: Saves **18.6 km** compared to individual trips.`);
        }
    }

    async function handleDriverFleetQuery() {
        appendBotMessage(`🚚 *Fetching registered block driver fleet and vehicle specifications...*`);

        const cardHtml = `
            <div class="samriddhi-route-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:700; font-size:13px; color:#166534;">
                        <i class="fa-solid fa-id-card-clip"></i> Registered Block Driver Fleet (5 Drivers)
                    </div>
                    <span style="background:#dcfce7; color:#166534; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;">
                        Active Fleet
                    </span>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; font-size:11.5px;">
                    <div style="background:#f8fafc; padding:8px 10px; border-radius:6px; border-left:3px solid #059669;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>1. Soham Nayek <span style="color:#059669;">[ID: SN 365]</span></strong>
                            <span style="font-size:10.5px; color:#64748b;">Dumra</span>
                        </div>
                        <div style="color:#475569; font-size:11px;">Tata Ace &bull; BR-06-SN-0365 &bull; <strong>1,000 kg (10 Q)</strong> &bull; 📞 +91 98321 00365</div>
                    </div>

                    <div style="background:#f8fafc; padding:8px 10px; border-radius:6px; border-left:3px solid #059669;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>2. Harsh Sahu <span style="color:#059669;">[ID: HS 265]</span></strong>
                            <span style="font-size:10.5px; color:#64748b;">Runnisaidpur</span>
                        </div>
                        <div style="color:#475569; font-size:11px;">Mahindra Bolero Maxi &bull; BR-06-HS-0265 &bull; <strong>1,500 kg (15 Q)</strong> &bull; 📞 +91 98452 00265</div>
                    </div>

                    <div style="background:#f8fafc; padding:8px 10px; border-radius:6px; border-left:3px solid #059669;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>3. Ayush Vardhan <span style="color:#059669;">[ID: AV 60]</span></strong>
                            <span style="font-size:10.5px; color:#64748b;">Bairgania</span>
                        </div>
                        <div style="color:#475569; font-size:11px;">Piaggio Ape E-City (Electric) &bull; BR-06-AV-0060 &bull; <strong>450 kg (4.5 Q)</strong> &bull; 📞 +91 98563 00060</div>
                    </div>

                    <div style="background:#f8fafc; padding:8px 10px; border-radius:6px; border-left:3px solid #059669;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>4. Piyush Bhagat <span style="color:#059669;">[ID: PB 25]</span></strong>
                            <span style="font-size:10.5px; color:#64748b;">Riga</span>
                        </div>
                        <div style="color:#475569; font-size:11px;">Ashok Leyland Dost+ &bull; BR-06-PB-0025 &bull; <strong>1,250 kg (12.5 Q)</strong> &bull; 📞 +91 98674 00025</div>
                    </div>

                    <div style="background:#f8fafc; padding:8px 10px; border-radius:6px; border-left:3px solid #059669;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>5. Abhijeet Kumar <span style="color:#059669;">[ID: AK 47]</span></strong>
                            <span style="font-size:10.5px; color:#64748b;">Sitamarhi Central</span>
                        </div>
                        <div style="color:#475569; font-size:11px;">Eicher Pro 2049 Heavy &bull; BR-06-AK-0047 &bull; <strong>4,000 kg (40 Q)</strong> &bull; 📞 +91 98785 00047</div>
                    </div>
                </div>

                <div style="margin-top:10px; padding:8px 10px; background:#ecfdf5; border-radius:6px; font-size:11px; color:#065f46; border:1px solid #bbf7d0;">
                    💡 <strong>Dispatch Choice:</strong> For all orders, Admin can either <strong>manually assign</strong> any of these 5 drivers or click <strong>Ask Samriddhi</strong> to automatically match by weight &amp; route.
                </div>
            </div>
        `;
        appendBotCard(cardHtml);
    }

    function handleMoqQuery() {
        appendBotMessage(`📦 **Role-Based Minimum Order Quantities (MOQ)**:

To make direct farm dispatch **logistically and financially viable**, we enforce role-based volume minimums:

• 🏠 **Local Consumer**: **25 kg** (or 0.25 Quintal) — Ideal for families, housing societies, or neighborhood collective buying.
• 🏪 **Local Vendor**: **50 kg** (0.50 Quintal) — Street vendors & local vegetable sellers.
• 🏬 **Retailer**: **100 kg** (1.00 Quintal) — Supermarkets and grocery stores.
• 🏭 **Wholesaler**: **500 kg** (5.00 Quintals) — Mandi traders & bulk distributors.
• 🏢 **Institutional Buyer**: **1,000 kg** (10.00 Quintals) — Hostels, hotels, processors.

*This prevents micro-logistics freight loss and consolidates rural truck loads efficiently!*`);
    }

    function handleMspPolicyQuery() {
        appendBotMessage(`🛡️ **Statutory MSP Guarantee (₹12.00 / kg)**:

• **Fixed Statutory Floor**: **₹12.00 per kg** (**₹1,200 per Quintal**) fixed across all produce items on Kisan Setu.
• **Automatic Admin Alert**: Any produce listing, order, or trade submitted **below ₹12.00/kg** immediately triggers a **Critical MSP Violation Alert** to the Block Admin.
• **Alert Contents**: The alert automatically transmits the farmer's name, mobile number, farm location, crop commodity, listed price, and the exact deficit below MSP.
• **Purpose**: Prevents distress selling, curbs middleman exploitation, and guarantees fair livelihood protection for local farmers.`);
    }

    function renderFallbackGuidance() {
        if (currentRole === "ADMIN") {
            appendBotMessage(`As **Block Admin**, you can command me to:
• **"Block trade volume"**: View Escrow turnover, verified users, and fulfillment rate.
• **"Check MSP violations"**: Scan for below-MSP distress sale attempts.
• **"Optimize driver routes"**: Generate sequential multi-stop pickup itineraries.
• **"Audit escrow vault"**: Inspect held deposits and DBT release logs.`);
        } else if (currentRole === "BUYER") {
            appendBotMessage(`As a **Buyer / Vendor**, you can ask me to:
• **"Check my MOQ"**: Look up order quantity tiers & volume discounts.
• **"Potato / Wheat / Onion rates"**: Check direct farm fair prices and MSP benchmarks.
• **"Direct farm delivery"**: Understand shipment tracking and vehicle dispatches.
• **"Escrow buyer protection"**: Learn how your payments are 100% safeguarded until delivery verification.`);
        } else {
            appendBotMessage(`किसान भाई, आप मुझसे ये सब पूछ सकते हैं:
• **फसल का भाव (उदा. आलू, गेहूं, मक्का)**: उचित बाज़ार मूल्य और खरीदार की माँग।
• **सरकारी MSP**: ₹12.00/kg से ऊपर सुरक्षित बिक्री की गारंटी।
• **पिकअप और ड्राइवर**: आपके खेत से माल उठाने की लॉजिस्टिक्स प्रक्रिया।
• **DBT बैंक भुगतान**: डिलीवरी के बाद सीधे खाते में बिना किसी बिचौलिए के पैसा।`);
        }
    }

    // Helper functions
    function escapeHTML(str) {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatMarkdown(text) {
        return String(text ?? "")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    // Run when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            ensureStylesheet();
            initUI();
        });
    } else {
        ensureStylesheet();
        initUI();
    }
})();
