/**
 * Kisan Setu - Centralized Internationalization (i18n) Engine
 * Supports English ('en') and Hindi ('hi') with persistent preference via localStorage.
 */
(function(window) {
    "use strict";

    const STORAGE_KEY = "kisan_setu_lang";

    const DICTIONARY = {
        en: {
            // Brand & Navigation
            brandName: "KISAN SETU",
            brandTagline: "Direct Market. Fair Price. Stronger Farmers.",
            portal_farmer: "FARMER PORTAL",
            portal_buyer: "BUYER / VENDOR PORTAL",
            portal_admin: "ADMIN PORTAL",
            navHome: "Home",
            navAbout: "About Us",
            navHow: "How It Works",
            navFeatures: "Features",
            navMsp: "MSP Info",
            navMspInfo: "MSP Information",
            navContact: "Contact Us",
            languageEnglish: "English",
            languageHindi: "हिन्दी",
            login: "Login",
            overview: "Overview",

            // Sidebar navigation
            nav_dashboard: "Dashboard",
            nav_produce: "Produce",
            nav_find_produce: "Find Produce",
            nav_orders: "Orders",
            nav_my_orders: "My Orders",
            nav_payments: "Payments",
            nav_logistics: "Logistics",
            nav_history: "History",
            nav_disputes: "Disputes",
            nav_notifications: "Notifications",
            nav_profile: "Profile",
            nav_requests: "Requests",
            nav_users: "Users",
            nav_logout: "Logout",

            // Landing Page Hero & Features
            heroTitle1: "Empowering Farmers.",
            heroTitle2: "Connecting Markets.",
            heroTitle3: "Building a Stronger India.",
            heroText: "Kisan Setu is a digital platform that connects farmers directly with buyers and government authorities for better prices, transparent payments and a sustainable agriculture ecosystem.",
            featureFairPrice: "Fair Price",
            featureMspProtection: "MSP Protection",
            featureDirectMarket: "Direct Market",
            featureNoMiddlemen: "No Middlemen",
            featureSecureTransparent: "Secure & Transparent",
            featureSafety: "End-to-End Safety",
            featureTogether: "Stronger Together",
            featureFuture: "Better Future",
            chooseRoleTitle: "CHOOSE YOUR ROLE",
            chooseRoleText: "Select the option that best describes you to continue.",
            farmerTitle: "I am a Farmer",
            farmerText: "List your produce, connect with buyers, get fair prices and grow your business.",
            continueFarmer: "Continue as Farmer",
            newFarmerRegister: "New Farmer? Register Now",
            buyerTitle: "I am a Buyer / Vendor",
            buyerText: "Find quality produce, place orders and build strong connections.",
            continueBuyer: "Continue as Buyer",
            newBuyerRegister: "New Buyer? Register Now",
            statFarmers: "Farmers Registered",
            statOrders: "Orders Completed",
            statPayments: "Worth Payments",
            statStates: "States Covered",
            footerBrand: "🌾 KISAN SETU",
            footerText: "Direct Market. Fair Price. Stronger Farmers. Connecting farmers and buyers for a more transparent agricultural ecosystem.",
            footerQuickLinks: "Quick Links",
            footerInfo: "Information",
            footerAccount: "Account",
            farmerLoginLink: "Farmer Login",
            buyerLoginLink: "Buyer Login",
            copyrightText: "© 2026 Kisan Setu. All Rights Reserved.",

            // Auth Common
            farmer_login_title: "Farmer Login",
            farmer_login_subtitle: "Welcome back! Sign in to your farmer dashboard.",
            buyer_login_title: "Buyer Login",
            buyer_login_subtitle: "Welcome back! Sign in to source fresh produce.",
            farmer_register_title: "Farmer Registration",
            buyer_register_title: "Buyer Registration",
            auth_grow_smarter: "Grow smarter. Sell directly. Earn more.",
            auth_grow_smarter_sub: "Connect with buyers, manage harvest orders, track payments, and keep your farm business moving with transparent digital tools.",
            auth_buyer_hero: "Buy directly from local verified farmers.",
            auth_buyer_hero_sub: "Get fair farm prices, transparent logistics, quality guarantee, and real-time status updates.",
            email_or_phone: "Email Address or Phone",
            email_or_phone_ph: "farmer@example.com or phone",
            password: "Password",
            password_ph: "Enter your password",
            remember_me: "Remember me",
            forgot_password: "Forgot password?",
            login_btn: "Login to Dashboard",
            logging_in: "Logging in...",
            new_to_kisan: "New to Kisan Setu?",
            register_now: "Register Now",
            already_account: "Already have an account?",
            login_here: "Login here",
            back_to_home: "Back to home",

            // Dashboards Common
            farmer_dashboard_title: "Farmer Dashboard",
            farmer_dashboard_sub: "Manage your produce, orders, and earnings",
            buyer_dashboard_title: "Buyer / Vendor Dashboard",
            buyer_dashboard_sub: "Manage your produce orders, payments, and trade logistics",
            admin_dashboard_title: "Prakhand & Super Admin Portal",
            admin_dashboard_sub: "Monitor regional MSP compliance, resolve disputes, and verify farmers",
            welcome_back: "Welcome back",
            loading_profile: "Loading profile...",
            loading: "Loading...",
            stat_listed_produce: "Listed Produce",
            stat_pending_orders: "Pending Orders",
            stat_completed_orders: "Completed Orders",
            stat_total_earnings: "Total Earnings",
            stat_monthly_revenue: "Monthly Revenue",
            stat_crop_health: "Crop Health",
            stat_active_orders: "Active Orders",
            stat_total_purchases: "Total Purchases",
            stat_wallet_balance: "Wallet Balance",
            stat_total_farmers: "Total Farmers",
            stat_pending_verifications: "Pending Verifications",
            quick_actions: "Quick Actions",
            add_new_produce: "Add New Produce",
            view_all_orders: "View All Orders",
            recent_orders: "Recent Orders",
            buyer_requests: "Buyer Requests",
            payment_summary: "Payment Summary",
            shipment_alerts: "Shipment Alerts",
            active_listings: "Active Listings",
            view_all: "View all",
            btn_manage: "Manage",
            no_orders_yet: "No orders yet",
            my_produce: "My Produce",
            my_produce_sub: "Manage your listed crops and incoming buyer interest.",
            add_produce: "Add Produce",
            farmer_orders_title: "Farmer Orders",
            farmer_orders_sub: "Review and manage orders received from buyers.",
            order_status_label: "Order Status",
            refresh_btn: "Refresh",

            // Table Headers & Fields
            th_order_id: "Order ID",
            th_crop: "Crop / Item",
            th_buyer: "Buyer",
            th_farmer: "Farmer",
            th_quantity: "Quantity",
            th_total_price: "Total Price",
            th_status: "Status",
            th_action: "Action",
            th_date: "Date",
            th_prakhand: "Prakhand",

            // Statuses
            STATUS_PENDING: "Pending",
            STATUS_APPROVED: "Approved",
            STATUS_CONFIRMED: "Confirmed",
            STATUS_REJECTED: "Rejected",
            STATUS_DISPATCHED: "Dispatched",
            STATUS_IN_TRANSIT: "In Transit",
            STATUS_DELIVERED: "Delivered",
            STATUS_COMPLETED: "Completed",
            STATUS_CANCELLED: "Cancelled",
            STATUS_PAID: "Paid",
            STATUS_ESCROW_LOCKED: "Payment Held in Escrow",

            // Actions
            btn_accept: "Accept",
            btn_reject: "Reject",
            btn_view: "View",
            btn_details: "Details",
            btn_track: "Track",
            btn_dispatch: "Dispatch",
            btn_save: "Save Changes",
            btn_cancel: "Cancel",
            btn_delete: "Delete",
            btn_submit: "Submit",
            btn_search: "Search",
            search_ph: "Search...",

            // Common labels
            change_language: "Change Language / भाषा बदलें",
            lang_toggle_text: "हिन्दी"
        },

        hi: {
            // Brand & Navigation
            brandName: "किसान सेतु",
            brandTagline: "सीधा बाजार। उचित मूल्य। मजबूत किसान।",
            portal_farmer: "किसान पोर्टल",
            portal_buyer: "खरीदार / व्यापारी पोर्टल",
            portal_admin: "प्रशासन पोर्टल",
            navHome: "होम",
            navAbout: "हमारे बारे में",
            navHow: "यह कैसे काम करता है",
            navFeatures: "विशेषताएँ",
            navMsp: "एमएसपी जानकारी",
            navMspInfo: "एमएसपी जानकारी",
            navContact: "संपर्क करें",
            languageEnglish: "English",
            languageHindi: "हिन्दी",
            login: "लॉगिन",
            overview: "अवलोकन",

            // Sidebar navigation
            nav_dashboard: "डैशबोर्ड",
            nav_produce: "मेरी फसलें",
            nav_find_produce: "फसलें खोजें",
            nav_orders: "ऑर्डर्स",
            nav_my_orders: "मेरे ऑर्डर्स",
            nav_payments: "भुगतान",
            nav_logistics: "परिवहन / लॉजिस्टिक्स",
            nav_history: "इतिहास",
            nav_disputes: "विवाद निवारण",
            nav_notifications: "सूचनाएँ",
            nav_profile: "मेरी प्रोफ़ाइल",
            nav_requests: "अनुरोध",
            nav_users: "उपयोगकर्ता",
            nav_logout: "लॉगआउट",

            // Landing Page Hero & Features
            heroTitle1: "किसानों को सशक्त बनाना।",
            heroTitle2: "बाजारों को जोड़ना।",
            heroTitle3: "मजबूत भारत बनाना।",
            heroText: "किसान सेतु एक डिजिटल प्लेटफॉर्म है जो किसानों को सीधे खरीदारों और सरकारी अधिकारियों से जोड़ता है ताकि उन्हें बेहतर कीमत और पारदर्शी लेन-देन मिले।",
            featureFairPrice: "न्यायपूर्ण मूल्य",
            featureMspProtection: "एमएसपी संरक्षण",
            featureDirectMarket: "सीधा बाजार",
            featureNoMiddlemen: "बिना बिचौलियों",
            featureSecureTransparent: "सुरक्षित और पारदर्शी",
            featureSafety: "अंत तक सुरक्षा",
            featureTogether: "साथ मिलकर मजबूत",
            featureFuture: "बेहतर भविष्य",
            chooseRoleTitle: "अपना रोल चुनें",
            chooseRoleText: "जारी रखने के लिए अपनी सही श्रेणी चुनें।",
            farmerTitle: "मैं किसान हूँ",
            farmerText: "अपना उत्पाद सूचीबद्ध करें, खरीदारों से जुड़ें और उचित कीमत प्राप्त करें।",
            continueFarmer: "किसान के रूप में जारी रखें",
            newFarmerRegister: "नया किसान? अभी रजिस्टर करें",
            buyerTitle: "मैं खरीदार / विक्रेता हूँ",
            buyerText: "गुणवत्ता वाली फसलें खोजें और ऑर्डर दें।",
            continueBuyer: "खरीदार के रूप में जारी रखें",
            newBuyerRegister: "नया खरीदार? अभी रजिस्टर करें",
            statFarmers: "पंजीकृत किसान",
            statOrders: "पूर्ण ऑर्डर",
            statPayments: "लेनदेन की राशि",
            statStates: "आच्छादित राज्य",
            footerBrand: "🌾 किसान सेतु",
            footerText: "सीधा बाजार। उचित मूल्य। मजबूत किसान। किसानों और खरीदारों को पारदर्शी कृषि तंत्र से जोड़ना।",
            footerQuickLinks: "त्वरित लिंक",
            footerInfo: "जानकारी",
            footerAccount: "अकाउंट",
            farmerLoginLink: "किसान लॉगिन",
            buyerLoginLink: "खरीदार लॉगिन",
            copyrightText: "© 2026 किसान सेतु। सर्वाधिकार सुरक्षित।",

            // Auth Common
            farmer_login_title: "किसान लॉगिन",
            farmer_login_subtitle: "वापसी पर स्वागत है! अपने किसान डैशबोर्ड में साइन इन करें।",
            buyer_login_title: "खरीदार लॉगिन",
            buyer_login_subtitle: "वापसी पर स्वागत है! ताज़ी उपज खरीदने के लिए साइन इन करें।",
            farmer_register_title: "किसान पंजीकरण",
            buyer_register_title: "खरीदार पंजीकरण",
            auth_grow_smarter: "स्मार्ट खेती। सीधी बिक्री। अधिक कमाई।",
            auth_grow_smarter_sub: "खरीदारों से जुड़ें, ऑर्डर्स प्रबंधित करें, भुगतान ट्रैक करें और पारदर्शी डिजिटल माध्यम से अपनी आय बढ़ाएं।",
            auth_buyer_hero: "स्थानीय सत्यापित किसानों से सीधे खरीदें।",
            auth_buyer_hero_sub: "उचित मूल्य, पारदर्शी लॉजिस्टिक्स, गुणवत्ता का भरोसा और रीयल-टाइम अपडेट प्राप्त करें।",
            email_or_phone: "ईमेल पता या मोबाइल नंबर",
            email_or_phone_ph: "ईमेल या 10 अंकों का मोबाइल नंबर",
            password: "पासवर्ड",
            password_ph: "अपना पासवर्ड दर्ज करें",
            remember_me: "मुझे याद रखें",
            forgot_password: "पासवर्ड भूल गए?",
            login_btn: "डैशबोर्ड में लॉगिन करें",
            logging_in: "लॉगिन हो रहा है...",
            new_to_kisan: "किसान सेतु पर नए हैं?",
            register_now: "अभी रजिस्टर करें",
            already_account: "क्या आपका पहले से खाता है?",
            login_here: "यहाँ लॉगिन करें",
            back_to_home: "होमपेज पर वापस जाएं",

            // Dashboards Common
            farmer_dashboard_title: "किसान डैशबोर्ड",
            farmer_dashboard_sub: "अपनी फसलें, ऑर्डर्स और आय का प्रबंधन करें",
            buyer_dashboard_title: "खरीदार / व्यापारी डैशबोर्ड",
            buyer_dashboard_sub: "अपने फसल ऑर्डर्स, भुगतान और लॉजिस्टिक्स को प्रबंधित करें",
            admin_dashboard_title: "प्रखंड एवं सुपर एडमिन पोर्टल",
            admin_dashboard_sub: "क्षेत्रीय एमएसपी निगरानी, विवाद निवारण और किसान सत्यापन",
            welcome_back: "स्वागत है",
            loading_profile: "प्रोफ़ाइल लोड हो रही है...",
            loading: "लोड हो रहा है...",
            stat_listed_produce: "सूचीबद्ध फसलें",
            stat_pending_orders: "लंबित ऑर्डर्स",
            stat_completed_orders: "पूर्ण ऑर्डर्स",
            stat_total_earnings: "कुल कमाई",
            stat_monthly_revenue: "मासिक आय",
            stat_crop_health: "फसल स्वास्थ्य",
            stat_active_orders: "सक्रिय ऑर्डर्स",
            stat_total_purchases: "कुल खरीद",
            stat_wallet_balance: "वॉलेट शेष",
            stat_total_farmers: "कुल पंजीकृत किसान",
            stat_pending_verifications: "लंबित सत्यापन",
            quick_actions: "त्वरित कार्य",
            add_new_produce: "नई फसल जोड़ें",
            view_all_orders: "सभी ऑर्डर्स देखें",
            recent_orders: "हालिया ऑर्डर्स",
            buyer_requests: "खरीदार अनुरोध",
            payment_summary: "भुगतान सारांश",
            shipment_alerts: "परिवहन सूचनाएँ",
            active_listings: "सक्रिय फसल लिस्टिंग",
            view_all: "सभी देखें",
            btn_manage: "प्रबंधन करें",
            no_orders_yet: "अभी कोई ऑर्डर नहीं है",
            my_produce: "मेरी फसलें (Produce)",
            my_produce_sub: "अपनी सूचीबद्ध फसलों और खरीदार मांग का प्रबंधन करें।",
            add_produce: "नई फसल जोड़ें",
            farmer_orders_title: "किसान ऑर्डर्स",
            farmer_orders_sub: "खरीदारों से प्राप्त ऑर्डर्स की समीक्षा और प्रबंधन करें।",
            order_status_label: "ऑर्डर स्थिति (Status)",
            refresh_btn: "रिफ्रेश करें",

            // Table Headers & Fields
            th_order_id: "ऑर्डर आईडी",
            th_crop: "फसल / उपज",
            th_buyer: "खरीदार",
            th_farmer: "किसान",
            th_quantity: "मात्रा",
            th_total_price: "कुल मूल्य",
            th_status: "स्थिति (स्टेटस)",
            th_action: "कार्रवाई",
            th_date: "दिनांक",
            th_prakhand: "प्रखंड",

            // Statuses
            STATUS_PENDING: "लंबित (Pending)",
            STATUS_APPROVED: "स्वीकृत (Approved)",
            STATUS_CONFIRMED: "पुष्टीकृत (Confirmed)",
            STATUS_REJECTED: "अस्वीकृत (Rejected)",
            STATUS_DISPATCHED: "भेज दिया गया (Dispatched)",
            STATUS_IN_TRANSIT: "रास्ते में है (In Transit)",
            STATUS_DELIVERED: "पहुँच गया (Delivered)",
            STATUS_COMPLETED: "सफलतापूर्वक पूर्ण",
            STATUS_CANCELLED: "रद्द किया गया",
            STATUS_PAID: "भुगतान पूर्ण",
            STATUS_ESCROW_LOCKED: "एस्क्रो में सुरक्षित",

            // Actions
            btn_accept: "स्वीकारें",
            btn_reject: "अस्वीकार करें",
            btn_view: "देखें",
            btn_details: "विवरण",
            btn_track: "ट्रैक करें",
            btn_dispatch: "रवाना करें",
            btn_save: "परिवर्तन सहेजें",
            btn_cancel: "रद्द करें",
            btn_delete: "हटाएं",
            btn_submit: "जमा करें",
            btn_search: "खोजें",
            search_ph: "खोजें...",

            // Common labels
            change_language: "Change Language / भाषा बदलें",
            lang_toggle_text: "English"
        }
    };

    /**
     * Get current active language code ('en' or 'hi')
     */
    function getLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === "hi" || saved === "en") {
                return saved;
            }
            // Check legacy key if exists
            if (saved === "हिन्दी") return "hi";
            if (saved === "English") return "en";
        } catch (e) {}
        return "en";
    }

    /**
     * Translate a key with optional fallback
     */
    function t(key, fallback) {
        const lang = getLanguage();
        const dict = DICTIONARY[lang] || DICTIONARY.en;
        if (dict && typeof dict[key] !== "undefined") {
            return dict[key];
        }
        if (DICTIONARY.en && typeof DICTIONARY.en[key] !== "undefined") {
            return DICTIONARY.en[key];
        }
        return (typeof fallback !== "undefined") ? fallback : key;
    }

    /**
     * Apply active language to all DOM elements with data-i18n attributes
     */
    function applyLanguage(lang) {
        if (lang !== "en" && lang !== "hi") {
            lang = "en";
        }
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {}

        const dict = DICTIONARY[lang] || DICTIONARY.en;

        // 1. Text translations
        document.querySelectorAll("[data-i18n]").forEach(function(el) {
            const key = el.getAttribute("data-i18n");
            if (key && typeof dict[key] !== "undefined") {
                // If element has nested HTML icons (e.g. <i class="fa..."></i> Label)
                const textSpan = el.querySelector(".i18n-text");
                if (textSpan) {
                    textSpan.textContent = dict[key];
                } else if (el.children.length === 0) {
                    el.textContent = dict[key];
                } else {
                    // Preserves icons if any
                    const icon = el.querySelector("i");
                    if (icon) {
                        el.childNodes.forEach(function(node) {
                            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
                                node.nodeValue = " " + dict[key];
                            }
                        });
                    } else {
                        el.textContent = dict[key];
                    }
                }
            }
        });

        // 2. Placeholder translations
        document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
            const key = el.getAttribute("data-i18n-placeholder");
            if (key && typeof dict[key] !== "undefined") {
                el.setAttribute("placeholder", dict[key]);
            }
        });

        // 3. Title/Tooltip translations
        document.querySelectorAll("[data-i18n-title]").forEach(function(el) {
            const key = el.getAttribute("data-i18n-title");
            if (key && typeof dict[key] !== "undefined") {
                el.setAttribute("title", dict[key]);
            }
        });

        // 4. Update Language Toggle button badges
        document.querySelectorAll(".lang-toggle-btn, .lang-switch-btn").forEach(function(btn) {
            const label = btn.querySelector(".lang-toggle-label");
            if (label) {
                // Shows the other language that clicking will switch to, or current language indicator
                label.textContent = (lang === "en") ? "हिन्दी" : "English";
            }
            btn.setAttribute("title", (lang === "en") ? "हिंदी में बदलें (Switch to Hindi)" : "Switch to English");
            btn.setAttribute("data-current-lang", lang);
        });

        // 5. Update index.html legacy language button if present
        if (typeof document.getElementById === "function") {
            const selectedLangLabel = document.getElementById("selectedLanguage");
            if (selectedLangLabel) {
                selectedLangLabel.textContent = (lang === "hi") ? "हिन्दी" : "English";
            }
        }
        document.querySelectorAll(".language-option").forEach(function(opt) {
            const optLang = opt.getAttribute("data-language");
            const isMatch = (lang === "hi" && (optLang === "हिन्दी" || optLang === "hi")) ||
                            (lang === "en" && (optLang === "English" || optLang === "en"));
            opt.classList.toggle("selected", isMatch);
        });

        // Update html lang attribute
        document.documentElement.lang = lang;

        // Dispatch custom event for dynamic JS components
        try {
            window.dispatchEvent(new CustomEvent("kisanSetuLangChanged", {
                detail: { lang: lang, dict: dict }
            }));
        } catch (e) {}
    }

    /**
     * Set language explicitly and update DOM
     */
    function setLanguage(lang) {
        applyLanguage(lang);
    }

    /**
     * Toggle between English and Hindi
     */
    function toggleLanguage() {
        const current = getLanguage();
        const next = (current === "en") ? "hi" : "en";
        setLanguage(next);
        return next;
    }

    /**
     * Initialize i18n on page load and attach listeners
     */
    function initI18n() {
        const current = getLanguage();
        applyLanguage(current);

        // Auto-attach to language toggle buttons
        document.querySelectorAll(".lang-toggle-btn, .lang-switch-btn").forEach(function(btn) {
            if (!btn.hasAttribute("data-i18n-initialized")) {
                btn.setAttribute("data-i18n-initialized", "true");
                btn.addEventListener("click", function(e) {
                    e.preventDefault();
                    toggleLanguage();
                });
            }
        });
    }

    // Export to window
    window.kisanI18n = {
        getLanguage: getLanguage,
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage,
        applyLanguage: applyLanguage,
        init: initI18n,
        t: t,
        dictionary: DICTIONARY
    };

    // Shorthand helper
    window.t = t;

    // Run automatically on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initI18n);
    } else {
        initI18n();
    }

})(typeof window !== "undefined" ? window : this);
