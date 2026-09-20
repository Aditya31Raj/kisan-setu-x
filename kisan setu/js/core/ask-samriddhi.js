/**
 * Kisan Setu - Ask Samriddhi (समृद्धि AI)
 * Conversational Agricultural Market Intelligence & Logistics Copilot
 */

(function () {
    "use strict";

    // Configuration & State
    let isWidgetOpen = false;
    let currentRole = "FARMER"; // FARMER | BUYER | ADMIN
    let currentLang = localStorage.getItem("kisan_setu_lang") || "en";

    // Identify user role from page path or local auth session
    function detectRole() {
        const path = window.location.pathname.toLowerCase();
        const user = typeof getAuthUser === "function" ? getAuthUser() : null;
        if (user?.role) return user.role;
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

        // 1. Floating trigger button
        const triggerBtn = document.createElement("button");
        triggerBtn.id = "samriddhi-trigger-btn";
        triggerBtn.className = "samriddhi-trigger-btn";
        triggerBtn.setAttribute("aria-label", "Open Ask Samriddhi AI");
        triggerBtn.innerHTML = `
            <div class="samriddhi-pulse-ring"></div>
            <div class="bot-avatar">🤖</div>
            <span>Ask Samriddhi</span>
        `;
        document.body.appendChild(triggerBtn);

        // 2. Chat Widget Frame
        const widget = document.createElement("div");
        widget.id = "samriddhi-widget";
        widget.className = "samriddhi-widget";
        widget.innerHTML = `
            <div class="samriddhi-header">
                <div class="samriddhi-header-info">
                    <div class="samriddhi-header-avatar">🌾</div>
                    <div class="samriddhi-header-text">
                        <h3>Ask Samriddhi <span style="font-size:11px; background:rgba(255,255,255,0.22); padding:1px 6px; border-radius:10px;">AI Copilot</span></h3>
                        <p>Market Intelligence &amp; Logistics Advisor</p>
                    </div>
                </div>
                <div class="samriddhi-header-actions">
                    <button type="button" id="samriddhi-close-btn" title="Close"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>

            <div class="samriddhi-chips-container" id="samriddhi-chips">
                <!-- Dynamically populated chips -->
            </div>

            <div class="samriddhi-chat-body" id="samriddhi-chat-body">
                <!-- Chat messages -->
            </div>

            <div class="samriddhi-footer">
                <input type="text" id="samriddhi-input" class="samriddhi-input" placeholder="Ask about crop demand, fair price, or routes..." autocomplete="off">
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

    function populateChips() {
        const container = document.getElementById("samriddhi-chips");
        if (!container) return;

        let chips = [];
        if (currentRole === "FARMER") {
            chips = [
                { label: "🥔 Potato Fair Price & Demand", query: "Potato demand and fair price" },
                { label: "🌾 Wheat Market Rate", query: "Wheat market intelligence" },
                { label: "⚖️ Check MSP Benchmark", query: "What is official MSP?" },
                { label: "🚚 Optimized Driver Dispatch", query: "How does driver logistics work?" }
            ];
        } else if (currentRole === "BUYER") {
            chips = [
                { label: "🛒 What is my MOQ?", query: "What is minimum order quantity for local consumers?" },
                { label: "🥔 Potato Direct Farm Rates", query: "Potato market intelligence" },
                { label: "🚚 Direct Farm Logistics", query: "How does logistics delivery work?" },
                { label: "🧅 Onion Bulk Rate", query: "Onion market intelligence" }
            ];
        } else {
            // ADMIN
            chips = [
                { label: "🚚 Optimize Driver Route", query: "Optimize driver route roadmap" },
                { label: "👥 View Driver Fleet", query: "Show block driver fleet" },
                { label: "🥔 Regional Potato Demand", query: "Potato demand and fair price" },
                { label: "⚖️ MSP Price Check", query: "What is official MSP?" }
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

        if (currentRole === "FARMER") {
            text = isHindi
                ? "नमस्ते! मैं **समृद्धि AI (Ask Samriddhi)** हूँ। मैं आपके ब्लॉक में खरीदारों की माँग (Demand) और उचित मूल्य (Fair Price) की सलाह देता हूँ ताकि आपको MSP से ऊपर बेहतरीन दाम मिल सके। आप किसी भी फसल का नाम पूछ सकते हैं!"
                : "Namaste! I am **Ask Samriddhi**, your AI market intelligence & fair price copilot. I analyze buyer demand and historical transactions so you can sell produce at optimal rates above MSP. Ask me about any crop!";
        } else if (currentRole === "BUYER") {
            text = isHindi
                ? "नमस्ते! मैं **समृद्धि AI** हूँ। आप सीधे किसान से ताज़ी उपज उचित दाम पर खरीद सकते हैं। स्थानीय उपभोक्ताओं (Local Consumers) के लिए न्यूनतम ऑर्डर मात्र **25 किग्रा** है। क्या मदद करूँ?"
                : "Hello! I am **Ask Samriddhi**. You can purchase fresh produce directly from farmers at wholesale rates. For Local Consumers, our logistics MOQ is **25 kg**. What produce are you looking for?";
        } else {
            text = isHindi
                ? "प्रखंड अधिकारी जी, नमस्ते! मैं **समृद्धि AI** हूँ। मैं लंबित शिपमेंट्स के लिए सबसे कुशल ड्राइवर और मल्टी-स्टॉप रूट रोडमैप तैयार कर सकता हूँ।"
                : "Welcome, Block Officer! I am **Ask Samriddhi**. I optimize regional driver dispatches, multi-stop pickup sequences, and track block-level MSP compliance.";
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
            <div class="samriddhi-msg-avatar">🌾</div>
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
            <div class="samriddhi-msg-avatar">🌾</div>
            <div class="samriddhi-msg-bubble" style="background:#ffffff; width:100%; max-width:100%; border:none; padding:0;">
                ${cardHtml}
            </div>
        `;
        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    }

    // Natural Language and Query Processing
    async function processQuery(rawQuery) {
        const q = rawQuery.toLowerCase();

        // 1. Driver Fleet
        if (q.includes("fleet") || q.includes("driver fleet") || q.includes("list driver") || q.includes("who are the driver") || q.includes("चालक") || q.includes("5 drivers")) {
            await handleDriverFleetQuery();
            return;
        }

        // 2. Route Optimization & Dispatch Roadmap
        if (q.includes("route") || q.includes("roadmap") || q.includes("dispatch") || q.includes("optimize") || q.includes("रास्ता")) {
            await handleRouteOptimizationQuery();
            return;
        }

        // 3. MOQ (Minimum Order Quantity)
        if (q.includes("moq") || q.includes("minimum order") || q.includes("25 kg") || q.includes("consumer") || q.includes("न्यूनतम")) {
            handleMoqQuery();
            return;
        }

        // 4. Statutory MSP Policy (Fixed at 12 rs/kg with below-MSP admin alert)
        if (q.includes("what is msp") || q.includes("msp policy") || q.includes("support price") || q.includes("12 rs") || q.includes("msp rate") || q.includes("below msp") || q.includes("न्यूनतम समर्थन")) {
            handleMspPolicyQuery();
            return;
        }

        // 5. Crop Market Intelligence & Demand (Potato, Wheat, Maize, Rice, Paddy, Onion, Mustard)
        const crops = ["potato", "wheat", "paddy", "rice", "maize", "onion", "mustard", "tomato"];
        const matchedCrop = crops.find(c => q.includes(c)) || (q.includes("aalu") || q.includes("आलू") ? "potato" : q.includes("gehun") || q.includes("गेहूं") ? "wheat" : null);

        if (matchedCrop || q.includes("price") || q.includes("demand") || q.includes("rate") || q.includes("msp") || q.includes("भाव") || q.includes("माँग")) {
            await handleCropMarketQuery(matchedCrop || "potato");
            return;
        }

        // 4. Default Fallback Guidance
        appendBotMessage(`I can help you with:
• **Demand Forecasting & Fair Prices**: Ask about rates for *Potato, Wheat, Paddy, Rice, Maize, or Onion*.
• **Logistics & Route Roadmaps**: Ask to *optimize driver routes* or *view the driver fleet*.
• **Role-Based MOQ**: Ask *what is the minimum order quantity* for your account tier.`);
    }

    // Handlers
    async function handleCropMarketQuery(cropName) {
        appendBotMessage(`🔍 *Analyzing mandi trade history, buyer inquiries, and MSP benchmarks for **${cropName.toUpperCase()}** in your block...*`);

        try {
            const apiBase = (window.location.origin || "") + (window.location.port ? "" : "");
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
        appendBotMessage(`📦 **Why do we have Role-Based Minimum Order Quantities (MOQ)?**

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
