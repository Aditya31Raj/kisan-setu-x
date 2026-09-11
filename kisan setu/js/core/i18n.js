/**
 * Kisan Setu - Centralized Internationalization (i18n) Engine
 * Full bilingual support (English 'en' & Hindi 'hi') with seamless DOM translation,
 * icon preservation, auto-phrase fallback, and persistent state across all pages.
 */
(function(window) {
    "use strict";

    const STORAGE_KEY = "kisan_setu_lang";

    // 1. Explicit Key Dictionary
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
            mainMenu: "Main Menu",

            // Sidebar Navigation
            nav_dashboard: "Dashboard",
            nav_produce: "Produce",
            nav_find_produce: "Find Produce",
            nav_orders: "Orders",
            nav_my_orders: "My Orders",
            nav_payments: "Payments",
            nav_logistics: "Logistics",
            nav_history: "History",
            nav_payment_history: "Payment History",
            nav_disputes: "Disputes",
            nav_notifications: "Notifications",
            nav_profile: "Profile",
            nav_requests: "Requests",
            nav_users: "Users",
            nav_inputs: "Input Management",
            nav_reports: "Reports",
            nav_alerts: "Alerts",
            nav_grievances: "Disputes & Grievances",
            nav_farmers: "Farmers",
            nav_buyers: "Buyers",
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
            admin_login_title: "Admin Portal Login",
            admin_login_subtitle: "Sign in to access regional admin controls.",
            farmer_register_title: "Farmer Registration",
            farmer_register_sub: "Join Kisan Setu and start selling directly to buyers.",
            buyer_register_title: "Buyer / Vendor Registration",
            buyer_register_sub: "Register to discover agricultural produce and connect with farmers.",
            auth_grow_smarter: "Grow smarter. Sell directly. Earn more.",
            auth_grow_smarter_sub: "Connect with buyers, manage harvest orders, track payments, and keep your farm business moving with transparent digital tools.",
            auth_buyer_hero: "Buy directly from local verified farmers.",
            auth_buyer_hero_sub: "Get fair farm prices, transparent logistics, quality guarantee, and real-time status updates.",
            email_or_phone: "Email Address or Phone",
            email_or_phone_ph: "farmer@example.com or phone",
            email_address: "Email Address",
            email_ph: "you@example.com",
            phone_number: "Mobile Number",
            phone_ph: "Enter 10-digit mobile number",
            password: "Password",
            password_ph: "Enter your password",
            confirm_password: "Confirm Password",
            confirm_password_ph: "Re-enter password",
            full_name: "Full Name",
            full_name_ph: "Enter your full name",
            profile_picture: "Profile Picture",
            district: "District",
            district_ph: "Your district",
            farm_address: "Farm Address",
            farm_address_ph: "Village / block / street address",
            farm_area: "Farm Area (acres)",
            farm_area_ph: "e.g. 4.5",
            primary_crop: "Primary Crop Type",
            primary_crop_ph: "Rice, Wheat, Cotton...",
            business_details: "Business Details",
            business_name: "Business / Shop Name",
            business_name_ph: "Enter business name",
            business_type: "Business Type",
            gst_pan: "GSTIN or PAN Number",
            gst_pan_ph: "Optional GSTIN / PAN",
            remember_me: "Remember me",
            forgot_password: "Forgot password?",
            login_btn: "Login to Dashboard",
            logging_in: "Logging in...",
            register_btn_farmer: "Register as Farmer",
            register_btn_buyer: "Register as Buyer",
            registering: "Registering...",
            new_to_kisan: "New to Kisan Setu?",
            register_now: "Register Now",
            already_account: "Already have an account?",
            login_here: "Login here",
            back_to_home: "Back to Home",
            personal_details: "Personal Details",

            // Dashboards Common
            farmer_dashboard_title: "Farmer Dashboard",
            farmer_dashboard_sub: "Manage your produce, orders, and earnings",
            buyer_dashboard_title: "Buyer / Vendor Dashboard",
            buyer_dashboard_sub: "Manage your produce orders, payments, and trade logistics",
            admin_dashboard_title: "Prakhand & Super Admin Portal",
            admin_dashboard_sub: "Monitor regional MSP compliance, resolve disputes, and verify farmers",
            welcome_back: "Welcome back",
            welcome_user: "Welcome",
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
            stat_pending_payments: "Pending Payments",
            stat_deliveries: "Deliveries",
            stat_wallet_balance: "Wallet Balance",
            stat_total_farmers: "Total Farmers",
            stat_total_buyers: "Total Buyers",
            stat_pending_verifications: "Pending Verifications",
            quick_actions: "Quick Actions",
            add_new_produce: "Add New Produce",
            view_all_orders: "View All Orders",
            recent_orders: "Recent Orders",
            buyer_requests: "Buyer Requests",
            payment_summary: "Payment Summary",
            shipment_alerts: "Shipment Alerts",
            active_listings: "Active Listings",
            available_produce: "Available Produce",
            find_produce_sub: "Browse crops",
            my_orders_sub: "Track orders",
            payments_sub: "Escrow & history",
            view_all: "View all",
            btn_manage: "Manage",
            no_orders_yet: "No orders yet",
            my_produce: "My Produce",
            my_produce_sub: "Manage your listed crops and incoming buyer interest.",
            add_produce: "Add Produce",
            add_produce_sub: "List a crop for buyers to discover.",
            farmer_orders_title: "Farmer Orders",
            farmer_orders_sub: "Review and manage orders received from buyers.",
            order_status_label: "Order Status",
            refresh_btn: "Refresh",
            seeds_fertilizers: "Seeds & Fertilizers",
            subsidized_inputs: "Subsidized Seeds & Fertilizers",
            subsidized_inputs_sub: "Request certified seeds, urea, and fertilizers from your Prakhand Agriculture Office",
            channel_market: "Open Market",
            channel_block: "Block Procurement Center (MSP)",
            selling_channel: "Selling Channel",
            available_block_stock: "Available Stock at Block Warehouse",
            my_input_requests: "My Input Requests",
            cropping_season: "Cropping Season",
            season_rabi: "Rabi Season",
            season_kharif: "Kharif Season",
            season_zaid: "Zaid Season",
            requirement_reason: "Requirement Reason / Farm Size",
            kyc_verification_details: "KYC & Verification Details",
            kyc_doc_type: "KYC Document Type",
            select_kyc_doc: "Select KYC Document",
            doc_aadhaar: "Aadhaar Card",
            doc_kcc: "Kisan Credit Card (KCC)",
            doc_voter_id: "Voter ID",
            doc_land_record: "Land Revenue Record",
            doc_number_id: "Document Number / ID",
            security_password: "Security & Password",
            order_disputes: "Order Disputes",
            general_grievances: "General Grievances",
            kyc_verified_farmer: "KYC Verified Farmer Account",
            kyc_verified_farmer_desc: "Authorized for Open Market Trading, Block Procurement, and Subsidized Seeds/Fertilizer Quotas.",
            kyc_verified_buyer: "Verified Commercial Buyer",
            kyc_verified_buyer_desc: "KYC Verified & Authorized for direct agricultural purchasing with escrow payment protection.",

            // Produce Form & Details
            produce_name: "Produce Name",
            produce_name_ph: "e.g. Rice, Wheat, Tomato",
            category: "Category",
            category_ph: "e.g. Grains, Vegetables, Fruits",
            available_quantity: "Available Quantity",
            quantity_ph: "Enter quantity",
            unit: "Unit",
            unit_kg: "Kilogram (kg)",
            unit_quintal: "Quintal (q)",
            unit_tonne: "Tonne (t)",
            unit_piece: "Piece",
            price_per_unit: "Price per Unit (₹)",
            price_ph: "Enter price",
            location: "Location / Mandi",
            location_ph: "District or village",
            description: "Description",
            description_ph: "Add quality, harvest date or grade details",
            save_produce: "Save Produce",
            saving: "Saving...",

            // Disputes
            disputes_title: "Disputes & Grievances",
            disputes_sub: "Raise and track disputes related to your orders.",
            raise_dispute: "Raise a Dispute",
            my_disputes: "My Disputes",
            order_id: "Order ID",
            order_id_ph: "Enter order ID or reference",
            reason: "Reason",
            reason_ph: "Describe the issue with order or payment...",
            submit_dispute: "Submit Dispute",
            submitting: "Submitting...",

            // Logistics
            logistics_title: "Logistics & Transport",
            logistics_sub: "Track produce pickup, transport fleet, and delivery status.",
            request_logistics: "Request Block Logistics",
            pickup_location: "Pickup Location",
            pickup_location_ph: "e.g. Village Rampur, Block Barh",
            drop_destination: "Buyer Destination / Mandi",
            drop_destination_ph: "e.g. Krishi Mandi Shed #4, Patna",
            pickup_date: "Preferred Pickup Date",
            submit_request: "Submit Request",

            // Admin & Management
            admin_farmers_title: "Farmer Management",
            admin_farmers_sub: "Manage and verify registered farmers in the block.",
            admin_buyers_title: "Buyer Management",
            admin_buyers_sub: "Oversee registered wholesale buyers and retail vendors.",
            admin_inputs_title: "Input Management",
            admin_inputs_sub: "Coordinate government seeds, fertilizers and machinery subsidies.",
            admin_payments_title: "Payments & Escrow",
            admin_payments_sub: "Audit escrow transactions and MSP price protection guarantees.",
            admin_reports_title: "Analytical Reports",
            admin_reports_sub: "Block crop yields, price indices, and procurement metrics.",
            admin_alerts_title: "System Alerts",
            admin_alerts_sub: "Critical notifications, weather alerts, and MSP compliance warnings.",
            filter_search: "Search...",
            filter_status: "All Statuses",
            filter_apply: "Filter",
            filter_reset: "Reset",

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
            th_prakhand: "Prakhand / Block",
            th_name: "Name",
            th_phone: "Phone",
            th_email: "Email",
            th_district: "District",
            th_role: "Role",
            th_amount: "Amount",
            th_type: "Type",

            // Statuses
            STATUS_PENDING: "Pending",
            STATUS_PENDING_FARMER: "Pending Farmer",
            STATUS_ACCEPTED: "Accepted",
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
            STATUS_PAYMENT_PENDING: "Payment Pending",
            STATUS_DISPUTED: "Disputed",
            STATUS_ACTIVE: "Active",
            STATUS_VERIFIED: "Verified",

            // Actions & Common Buttons
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
            btn_edit: "Edit",
            btn_previous: "Previous",
            btn_next: "Next",
            search_ph: "Search...",

            // Common labels
            change_language: "Change Language / भाषा बदलें",
            lang_toggle_text: "हिन्दी",
            showing_records: "Showing records",
            no_records: "No records found",

            // Subpages - Farmer & Buyer & Admin
            order_history_title: "Order History",
            order_history_sub: "Review completed and past sales transactions.",
            filter_by_status: "Filter by status:",
            filter_all: "All",
            btn_refresh: "Refresh",
            order_details: "Order Details",
            farmer_payments_title: "Payments & Earnings",
            farmer_payments_sub: "Track escrow releases, transaction statuses, and total earnings.",
            farmer_notifications_title: "Notifications",
            farmer_notifications_sub: "Stay updated on order updates, price changes, and buyer requests.",
            farmer_profile_title: "Farmer Profile",
            farmer_profile_sub: "Manage your personal details, land records, and payment information.",
            buyer_produce_title: "Available Produce",
            buyer_produce_sub: "Browse fresh agricultural produce available directly from verified farmers.",
            search_produce: "Search Produce",
            search_produce_ph: "Search by crop or produce name",
            location_label: "Location",
            location_filter_ph: "District or state",
            buyer_orders_title: "My Orders",
            buyer_orders_sub: "Track your current and pending produce purchases.",
            buyer_payments_title: "Payments & Escrow",
            buyer_payments_sub: "Manage payment transactions, escrow security, and invoices.",
            buyer_history_title: "Order History",
            buyer_history_sub: "Past completed deliveries and purchase records.",
            buyer_profile_title: "Buyer Profile",
            buyer_profile_sub: "Manage your business credentials, GST, and contact details.",
            admin_requests_title: "Procurement Requests",
            admin_requests_sub: "Review and verify incoming bulk procurement requests.",
            admin_grievances_title: "Disputes & Grievances",
            admin_grievances_sub: "Mediate trade disputes between farmers and buyers, and resolve public complaints.",
            admin_logistics_title: "Logistics Management",
            admin_logistics_sub: "Manage transport requests, dispatch vehicles, and track shipments.",
            btn_accept_order: "Accept Order",
            btn_reject_order: "Reject",
            btn_request_logistics: "Request Block Logistics",
            btn_view_details: "View Details",
            label_buyer: "Buyer",
            label_farmer: "Farmer",
            label_order_total: "Order Total",
            placed_on: "Placed on",
            empty_orders: "No Orders Found",
            empty_orders_sub: "You have no incoming buyer orders under this status.",
            empty_produce: "No Produce Listed",
            empty_notifications: "No Notifications",
            total_farmers: "Total Farmers",
            total_buyers: "Total Buyers",
            total_orders: "Total Orders",
            total_revenue: "Total Revenue",
            pending_farmers: "Pending Verification",
            verified_farmers: "Verified Farmers"
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
            mainMenu: "मुख्य मेनू",

            // Sidebar Navigation
            nav_dashboard: "डैशबोर्ड",
            nav_produce: "मेरी फसलें",
            nav_find_produce: "फसलें खोजें",
            nav_orders: "ऑर्डर्स",
            nav_my_orders: "मेरे ऑर्डर्स",
            nav_payments: "भुगतान",
            nav_logistics: "परिवहन / लॉजिस्टिक्स",
            nav_history: "इतिहास",
            nav_payment_history: "भुगतान इतिहास",
            nav_disputes: "विवाद निवारण",
            nav_notifications: "सूचनाएँ",
            nav_profile: "मेरी प्रोफ़ाइल",
            nav_requests: "अनुरोध",
            nav_users: "उपयोगकर्ता",
            nav_inputs: "कृषि इनपुट प्रबंधन",
            nav_reports: "रिपोर्ट्स",
            nav_alerts: "सूचनाएँ / अलर्ट्स",
            nav_grievances: "विवाद एवं शिकायतें",
            nav_farmers: "किसान सूची",
            nav_buyers: "खरीदार सूची",
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
            admin_login_title: "प्रशासन पोर्टल लॉगिन",
            admin_login_subtitle: "प्रखंड एवं जिला नियंत्रण हेतु साइन इन करें।",
            farmer_register_title: "किसान पंजीकरण",
            farmer_register_sub: "किसान सेतु से जुड़ें और खरीदारों को सीधे अपनी फसल बेचें।",
            buyer_register_title: "खरीदार / व्यापारी पंजीकरण",
            buyer_register_sub: "ताज़ी फसलें खोजने और किसानों से सीधे जुड़ने के लिए रजिस्टर करें।",
            auth_grow_smarter: "स्मार्ट खेती। सीधी बिक्री। अधिक कमाई।",
            auth_grow_smarter_sub: "खरीदारों से जुड़ें, ऑर्डर्स प्रबंधित करें, भुगतान ट्रैक करें और पारदर्शी डिजिटल माध्यम से अपनी आय बढ़ाएं।",
            auth_buyer_hero: "स्थानीय सत्यापित किसानों से सीधे खरीदें।",
            auth_buyer_hero_sub: "उचित मूल्य, पारदर्शी लॉजिस्टिक्स, गुणवत्ता का भरोसा और रीयल-टाइम अपडेट प्राप्त करें।",
            email_or_phone: "ईमेल पता या मोबाइल नंबर",
            email_or_phone_ph: "ईमेल या 10 अंकों का मोबाइल नंबर",
            email_address: "ईमेल पता",
            email_ph: "you@example.com",
            phone_number: "मोबाइल नंबर",
            phone_ph: "10 अंकों का मोबाइल नंबर दर्ज करें",
            password: "पासवर्ड",
            password_ph: "अपना पासवर्ड दर्ज करें",
            confirm_password: "पासवर्ड की पुष्टि करें",
            confirm_password_ph: "पुनः पासवर्ड दर्ज करें",
            full_name: "पूरा नाम",
            full_name_ph: "अपना पूरा नाम दर्ज करें",
            profile_picture: "प्रोफ़ाइल चित्र",
            district: "जिला",
            district_ph: "अपना जिला",
            farm_address: "खेत / निवास का पता",
            farm_address_ph: "गाँव / प्रखंड / सड़क का पता",
            farm_area: "खेत का क्षेत्रफल (एकड़)",
            farm_area_ph: "उदा. 4.5",
            primary_crop: "प्रमुख फसल का प्रकार",
            primary_crop_ph: "धान, गेहूँ, मक्का, सब्ज़ी...",
            business_details: "व्यवसाय विवरण",
            business_name: "व्यवसाय / दुकान का नाम",
            business_name_ph: "व्यवसाय या फर्म का नाम दर्ज करें",
            business_type: "व्यवसाय प्रकार",
            gst_pan: "जीएसटी या पैन नंबर",
            gst_pan_ph: "वैकल्पिक GSTIN / PAN",
            remember_me: "मुझे याद रखें",
            forgot_password: "पासवर्ड भूल गए?",
            login_btn: "डैशबोर्ड में लॉगिन करें",
            logging_in: "लॉगिन हो रहा है...",
            register_btn_farmer: "किसान के रूप में रजिस्टर करें",
            register_btn_buyer: "खरीदार के रूप में रजिस्टर करें",
            registering: "पंजीकरण हो रहा है...",
            new_to_kisan: "किसान सेतु पर नए हैं?",
            register_now: "अभी रजिस्टर करें",
            already_account: "क्या आपका पहले से खाता है?",
            login_here: "यहाँ लॉगिन करें",
            back_to_home: "होमपेज पर वापस जाएं",
            personal_details: "व्यक्तिगत विवरण",

            // Dashboards Common
            farmer_dashboard_title: "किसान डैशबोर्ड",
            farmer_dashboard_sub: "अपनी फसलें, ऑर्डर्स और आय का प्रबंधन करें",
            buyer_dashboard_title: "खरीदार / व्यापारी डैशबोर्ड",
            buyer_dashboard_sub: "अपने फसल ऑर्डर्स, भुगतान और लॉजिस्टिक्स को प्रबंधित करें",
            admin_dashboard_title: "प्रखंड एवं सुपर एडमिन पोर्टल",
            admin_dashboard_sub: "क्षेत्रीय एमएसपी निगरानी, विवाद निवारण और किसान सत्यापन",
            welcome_back: "वापसी पर स्वागत है",
            welcome_user: "स्वागत है",
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
            stat_pending_payments: "लंबित भुगतान",
            stat_deliveries: "डिलिवरी",
            stat_wallet_balance: "वॉलेट शेष",
            stat_total_farmers: "कुल पंजीकृत किसान",
            stat_total_buyers: "कुल पंजीकृत खरीदार",
            stat_pending_verifications: "लंबित सत्यापन",
            quick_actions: "त्वरित कार्य",
            add_new_produce: "नई फसल जोड़ें",
            view_all_orders: "सभी ऑर्डर्स देखें",
            recent_orders: "हालिया ऑर्डर्स",
            buyer_requests: "खरीदार अनुरोध",
            payment_summary: "भुगतान सारांश",
            shipment_alerts: "परिवहन सूचनाएँ",
            active_listings: "सक्रिय फसल लिस्टिंग",
            available_produce: "उपलब्ध फसलें",
            find_produce_sub: "फसलें ब्राउज़ करें",
            my_orders_sub: "ऑर्डर्स ट्रैक करें",
            payments_sub: "एस्क्रो एवं इतिहास",
            view_all: "सभी देखें",
            btn_manage: "प्रबंधन करें",
            no_orders_yet: "अभी कोई ऑर्डर नहीं है",
            my_produce: "मेरी फसलें",
            my_produce_sub: "अपनी सूचीबद्ध फसलों और खरीदार मांग का प्रबंधन करें।",
            add_produce: "नई फसल जोड़ें",
            add_produce_sub: "खरीदारों के लिए नई फसल लिस्ट करें।",
            farmer_orders_title: "किसान ऑर्डर्स",
            farmer_orders_sub: "खरीदारों से प्राप्त ऑर्डर्स की समीक्षा और प्रबंधन करें।",
            order_status_label: "ऑर्डर स्थिति",
            refresh_btn: "रिफ्रेश करें",
            seeds_fertilizers: "बीज एवं उर्वरक",
            subsidized_inputs: "सब्सिडी बीज एवं उर्वरक",
            subsidized_inputs_sub: "प्रखंड कृषि कार्यालय से प्रमाणित बीज, यूरिया और उर्वरक का अनुरोध करें",
            channel_market: "खुला बाजार",
            channel_block: "प्रखंड सरकारी खरीद केंद्र",
            selling_channel: "बिक्री माध्यम",
            available_block_stock: "प्रखंड गोदाम में उपलब्ध स्टॉक",
            my_input_requests: "मेरी मांग सूची",
            cropping_season: "फसल मौसम",
            season_rabi: "रबी मौसम",
            season_kharif: "खरीफ मौसम",
            season_zaid: "जायद मौसम",
            requirement_reason: "मांग का कारण / खेत का क्षेत्रफल",
            kyc_verification_details: "पहचान एवं सत्यापन विवरण",
            kyc_doc_type: "पहचान दस्तावेज का प्रकार",
            select_kyc_doc: "पहचान दस्तावेज चुनें",
            doc_aadhaar: "आधार कार्ड",
            doc_kcc: "किसान क्रेडिट कार्ड (KCC)",
            doc_voter_id: "मतदाता पहचान पत्र",
            doc_land_record: "जमीन खतियान",
            doc_number_id: "दस्तावेज संख्या / आईडी",
            security_password: "सुरक्षा एवं पासवर्ड",
            order_disputes: "व्यापार विवाद",
            general_grievances: "जन शिकायतें",
            kyc_verified_farmer: "प्रमाणित किसान खाता",
            kyc_verified_farmer_desc: "खुला बाजार व्यापार, प्रखंड खरीद और सब्सिडी बीज/खाद कोटे के लिए अधिकृत।",
            kyc_verified_buyer: "प्रमाणित व्यापारिक खरीदार",
            kyc_verified_buyer_desc: "एस्क्रो भुगतान सुरक्षा के साथ सीधी कृषि खरीद के लिए अधिकृत।",

            // Produce Form & Details
            produce_name: "फसल का नाम",
            produce_name_ph: "उदा. धान, गेहूँ, टमाटर",
            category: "श्रेणी",
            category_ph: "उदा. अनाज, दलहन, सब्ज़ियाँ",
            available_quantity: "उपलब्ध मात्रा",
            quantity_ph: "मात्रा दर्ज करें",
            unit: "इकाई",
            unit_kg: "किलोग्राम",
            unit_quintal: "क्विंटल",
            unit_tonne: "टन",
            unit_piece: "नग",
            price_per_unit: "प्रति इकाई मूल्य (₹)",
            price_ph: "दर / मूल्य दर्ज करें",
            location: "स्थान",
            location_ph: "जिला या गाँव का नाम",
            description: "विवरण",
            description_ph: "गुणवत्ता, कटाई तिथि या ग्रेड विवरण जोड़ें",
            save_produce: "फसल सहेजें",
            saving: "सहेजा जा रहा है...",

            // Disputes
            disputes_title: "विवाद निवारण एवं शिकायतें",
            disputes_sub: "अपने ऑर्डर्स से संबंधित विवाद दर्ज और ट्रैक करें।",
            raise_dispute: "नया विवाद दर्ज करें",
            my_disputes: "मेरे विवाद",
            order_id: "ऑर्डर आईडी",
            order_id_ph: "ऑर्डर नंबर या संदर्भ दर्ज करें",
            reason: "समस्या का विवरण",
            reason_ph: "ऑर्डर या भुगतान से संबंधित समस्या का विवरण दें...",
            submit_dispute: "विवाद सबमिट करें",
            submitting: "सबमिट हो रहा है...",

            // Logistics
            logistics_title: "लॉजिस्टिक्स एवं परिवहन",
            logistics_sub: "फसल उठाव, वाहन बेड़ा और डिलीवरी स्थिति ट्रैक करें।",
            request_logistics: "प्रखंड लॉजिस्टिक्स का अनुरोध करें",
            pickup_location: "पिकअप स्थान",
            pickup_location_ph: "उदा. ग्राम रामपुर, प्रखंड बाढ़",
            drop_destination: "खरीदार का गंतव्य",
            drop_destination_ph: "उदा. कृषि मंडी शेड #4, पटना",
            pickup_date: "पसंदीदा पिकअप तिथि",
            submit_request: "अनुरोध जमा करें",

            // Admin & Management
            admin_farmers_title: "किसान प्रबंधन",
            admin_farmers_sub: "प्रखंड में पंजीकृत किसानों की निगरानी एवं सत्यापन करें।",
            admin_buyers_title: "खरीदार प्रबंधन",
            admin_buyers_sub: "थोक खरीदारों और व्यापारियों का प्रबंधन करें।",
            admin_inputs_title: "कृषि इनपुट प्रबंधन",
            admin_inputs_sub: "सरकारी बीज, उर्वरक और कृषि यंत्र सब्सिडी का समन्वय करें।",
            admin_payments_title: "भुगतान एवं एस्क्रो",
            admin_payments_sub: "एस्क्रो लेनदेन और एमएसपी सुरक्षा गारंटी का ऑडिट करें।",
            admin_reports_title: "विश्लेषणात्मक रिपोर्ट्स",
            admin_reports_sub: "प्रखंडवार फसल पैदावार, मूल्य सूचकांक और खरीद डेटा।",
            admin_alerts_title: "सिस्टम अलर्ट्स",
            admin_alerts_sub: "महत्वपूर्ण सूचनाएँ, मौसम अलर्ट और एमएसपी निगरानी चेतावनी।",
            filter_search: "खोजें...",
            filter_status: "सभी स्थितियाँ",
            filter_apply: "लागू करें",
            filter_reset: "रीसेट करें",

            // Table Headers & Fields
            th_order_id: "ऑर्डर आईडी",
            th_crop: "फसल",
            th_buyer: "खरीदार",
            th_farmer: "किसान",
            th_quantity: "मात्रा",
            th_total_price: "कुल मूल्य",
            th_status: "स्थिति",
            th_action: "कार्रवाई",
            th_date: "दिनांक",
            th_prakhand: "प्रखंड",
            th_name: "नाम",
            th_phone: "मोबाइल",
            th_email: "ईमेल",
            th_district: "जिला",
            th_role: "रोल",
            th_amount: "राशि",
            th_type: "प्रकार",

            // Statuses
            STATUS_PENDING: "लंबित",
            STATUS_PENDING_FARMER: "किसान की स्वीकृति लंबित",
            STATUS_ACCEPTED: "स्वीकृत",
            STATUS_APPROVED: "स्वीकृत",
            STATUS_CONFIRMED: "पुष्टीकृत",
            STATUS_REJECTED: "अस्वीकृत",
            STATUS_DISPATCHED: "भेज दिया गया",
            STATUS_IN_TRANSIT: "रास्ते में है",
            STATUS_DELIVERED: "पहुँच गया",
            STATUS_COMPLETED: "सफलतापूर्वक पूर्ण",
            STATUS_CANCELLED: "रद्द किया गया",
            STATUS_PAID: "भुगतान पूर्ण",
            STATUS_ESCROW_LOCKED: "एस्क्रो में सुरक्षित",
            STATUS_PAYMENT_PENDING: "भुगतान लंबित",
            STATUS_DISPUTED: "विवादित",
            STATUS_ACTIVE: "सक्रिय",
            STATUS_VERIFIED: "सत्यापित",

            // Actions & Common Buttons
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
            btn_edit: "संपादित करें",
            btn_previous: "पिछला",
            btn_next: "अगला",
            search_ph: "खोजें...",

            // Common labels
            change_language: "Change Language / भाषा बदलें",
            lang_toggle_text: "English",
            showing_records: "रिकॉर्ड दिखाए जा रहे हैं",
            no_records: "कोई रिकॉर्ड नहीं मिला",

            // Subpages - Farmer & Buyer & Admin
            order_history_title: "ऑर्डर इतिहास",
            order_history_sub: "पूर्ण और पिछले बिक्री लेनदेन की समीक्षा करें।",
            filter_by_status: "स्थिति के अनुसार फ़िल्टर करें:",
            filter_all: "सभी",
            btn_refresh: "रीफ्रेश करें",
            order_details: "ऑर्डर विवरण",
            farmer_payments_title: "भुगतान और आय",
            farmer_payments_sub: "एस्क्रो रिलीज, लेनदेन की स्थिति और कुल आय ट्रैक करें।",
            farmer_notifications_title: "सूचनाएँ",
            farmer_notifications_sub: "ऑर्डर अपडेट, मूल्य परिवर्तन और खरीदार अनुरोधों से अवगत रहें।",
            farmer_profile_title: "किसान प्रोफाइल",
            farmer_profile_sub: "अपने व्यक्तिगत विवरण, भूमि रिकॉर्ड और भुगतान जानकारी का प्रबंधन करें।",
            buyer_produce_title: "उपलब्ध उपज",
            buyer_produce_sub: "सत्यापित किसानों से सीधे उपलब्ध ताज़ा कृषि उपज देखें।",
            search_produce: "उपज खोजें",
            search_produce_ph: "फसल या उपज के नाम से खोजें",
            location_label: "स्थान",
            location_filter_ph: "जिला या राज्य दर्ज करें",
            buyer_orders_title: "मेरे ऑर्डर्स",
            buyer_orders_sub: "अपनी वर्तमान और लंबित उपज खरीद को ट्रैक करें।",
            buyer_payments_title: "भुगतान और एस्क्रो",
            buyer_payments_sub: "भुगतान लेनदेन, एस्क्रो सुरक्षा और चालान प्रबंधित करें।",
            buyer_history_title: "ऑर्डर इतिहास",
            buyer_history_sub: "पिछले पूर्ण वितरण और खरीद रिकॉर्ड।",
            buyer_profile_title: "खरीदार प्रोफाइल",
            buyer_profile_sub: "अपने व्यावसायिक क्रेडेंशियल्स, जीएसटी और संपर्क विवरण प्रबंधित करें।",
            admin_requests_title: "खरीद अनुरोध",
            admin_requests_sub: "आने वाले थोक खरीद अनुरोधों की समीक्षा और सत्यापन करें।",
            admin_grievances_title: "विवाद और शिकायतें",
            admin_grievances_sub: "किसानों और खरीदारों के बीच व्यापार विवादों की मध्यस्थता करें और शिकायतों का समाधान करें।",
            admin_logistics_title: "परिवहन प्रबंधन",
            admin_logistics_sub: "परिवहन अनुरोधों का प्रबंधन करें, वाहन रवाना करें और शिपमेंट ट्रैक करें।",
            btn_accept_order: "ऑर्डर स्वीकार करें",
            btn_reject_order: "अस्वीकार करें",
            btn_request_logistics: "ब्लॉक परिवहन का अनुरोध करें",
            btn_view_details: "विवरण देखें",
            label_buyer: "खरीदार",
            label_farmer: "किसान",
            label_order_total: "कुल ऑर्डर मूल्य",
            placed_on: "दिनांक",
            empty_orders: "कोई ऑर्डर नहीं मिला",
            empty_orders_sub: "इस स्थिति के अंतर्गत कोई खरीदार ऑर्डर नहीं है।",
            empty_produce: "कोई उपज उपलब्ध नहीं है",
            empty_notifications: "कोई सूचना नहीं है",
            total_farmers: "कुल पंजीकृत किसान",
            total_buyers: "कुल पंजीकृत खरीदार",
            total_orders: "कुल ऑर्डर्स",
            total_revenue: "कुल राजस्व",
            pending_farmers: "सत्यापन लंबित",
            verified_farmers: "सत्यापित किसान"
        }
    };

    // 2. High-Frequency UI Phrases for Automatic Fallback Translation
    const PHRASE_MAP_EN_TO_HI = {
        "Dashboard": "डैशबोर्ड",
        "Produce": "मेरी फसलें",
        "Find Produce": "फसलें खोजें",
        "Orders": "ऑर्डर्स",
        "My Orders": "मेरे ऑर्डर्स",
        "Payments": "भुगतान",
        "Payment History": "भुगतान इतिहास",
        "Logistics": "लॉजिस्टिक्स",
        "Seeds & Fertilizers": "बीज एवं उर्वरक",
        "Subsidized Seeds & Fertilizers": "सब्सिडी बीज एवं उर्वरक मांग",
        "Government Block Procurement": "प्रखंड सरकारी खरीद",
        "Block Procurement Center": "प्रखंड सरकारी खरीद केंद्र",
        "MSP Guarantee": "एमएसपी गारंटी",
        "History": "इतिहास",
        "Disputes": "विवाद निवारण",
        "Disputes & Grievances": "विवाद एवं शिकायतें",
        "Notifications": "सूचनाएँ",
        "Profile": "मेरी प्रोफ़ाइल",
        "Logout": "लॉगआउट",
        "Overview": "अवलोकन",
        "Main Menu": "मुख्य मेनू",
        "Quick Actions": "त्वरित कार्य",
        "Available Produce": "उपलब्ध फसलें",
        "Browse crops": "फसलें ब्राउज़ करें",
        "Track orders": "ऑर्डर्स ट्रैक करें",
        "Recent Orders": "हालिया ऑर्डर्स",
        "Buyer Requests": "खरीदार अनुरोध",
        "Payment Summary": "भुगतान सारांश",
        "Shipment Alerts": "परिवहन सूचनाएँ",
        "Active Listings": "सक्रिय फसल लिस्टिंग",
        "View all": "सभी देखें",
        "View All": "सभी देखें",
        "View All →": "सभी देखें →",
        "Manage": "प्रबंधन करें",
        "Refresh": "रिफ्रेश करें",
        "Search": "खोजें",
        "Filter": "फ़िल्टर करें",
        "Reset": "रीसेट करें",
        "Total Farmers": "कुल पंजीकृत किसान",
        "Registered farmers": "पंजीकृत किसान",
        "Total Buyers": "कुल खरीदार",
        "Registered buyers": "पंजीकृत व्यापारी",
        "Total Produce": "कुल फसलें",
        "Active Orders": "सक्रिय ऑर्डर्स",
        "Total Purchases": "कुल खरीद",
        "Pending Payments": "लंबित भुगतान",
        "Deliveries": "डिलिवरी",
        "Input Management": "कृषि इनपुट प्रबंधन",
        "Seed & Fertilizer Demands": "बीज एवं उर्वरक मांग",
        "Raise a Dispute": "नया विवाद दर्ज करें",
        "My Disputes": "मेरे विवाद",
        "Submit Dispute": "विवाद सबमिट करें",
        "Submit": "सबमिट करें",
        "Cancel": "रद्द करें",
        "Save Changes": "परिवर्तन सहेजें",
        "Save Produce": "फसल सहेजें",
        "Add Produce": "नई फसल जोड़ें",
        "Active in marketplace": "मार्केटप्लेस में सक्रिय",
        "Orders awaiting fulfillment": "पूर्ति की प्रतीक्षा में ऑर्डर्स",
        "All-time cleared earnings": "कुल स्वीकृत कमाई",
        "Monitored healthy": "स्वास्थ्य निगरानी सामान्य",
        "Orders in fulfillment pipeline": "पूर्ति प्रक्रिया में ऑर्डर्स",
        "Total cleared procurement value": "कुल स्वीकृत खरीद मूल्य",
        "Awaiting clearance / Escrow": "एस्क्रो / निकासी की प्रतीक्षा में",
        "No deliveries currently tracked": "वर्तमान में कोई डिलीवरी सक्रिय नहीं है",
        "Loading...": "लोड हो रहा है...",
        "Optimal": "उत्कृष्ट",
        "Farmer ID": "किसान आईडी",
        "Order Reference": "ऑर्डर संदर्भ",
        "Order ID": "ऑर्डर आईडी",
        "Crop / Item": "फसल / उपज",
        "Crop Name": "फसल का नाम",
        "Quantity": "मात्रा",
        "Total Price": "कुल मूल्य",
        "Status": "स्थिति",
        "Action": "कार्रवाई",
        "Actions": "कार्रवाइयाँ",
        "Date": "दिनांक",
        "Farmer": "किसान",
        "Buyer": "खरीदार",
        "Location": "स्थान",
        "Price": "मूल्य",
        "Price per Unit": "प्रति इकाई मूल्य",
        "Available Quantity": "उपलब्ध मात्रा",
        "Category": "श्रेणी",
        "Unit": "इकाई",
        "Description": "विवरण",
        "Previous": "पिछला",
        "Next": "अगला",
        "Back to Home": "होमपेज पर वापस जाएं",
        "Personal Details": "व्यक्तिगत विवरण",
        "Business Details": "व्यवसाय विवरण",
        "Full Name": "पूरा नाम",
        "Mobile Number": "मोबाइल नंबर",
        "Email Address": "ईमेल पता",
        "Farm Address": "खेत का पता",
        "Farm Area (acres)": "खेत का क्षेत्रफल (एकड़)",
        "Primary Crop Type": "प्रमुख फसल का प्रकार",
        "Password": "पासवर्ड",
        "Confirm Password": "पासवर्ड की पुष्टि करें",
        "Remember me": "मुझे याद रखें",
        "Forgot password?": "पासवर्ड भूल गए?",
        "New to Kisan Setu?": "किसान सेतु पर नए हैं?",
        "Register Now": "अभी रजिस्टर करें",
        "Already have an account?": "क्या आपका पहले से खाता है?",
        "Login here": "यहाँ लॉगिन करें",
        "Home": "होम",
        "About Us": "हमारे बारे में",
        "How It Works": "यह कैसे काम करता है",
        "Features": "विशेषताएँ",
        "MSP Info": "एमएसपी जानकारी",
        "Contact Us": "संपर्क करें",
        "Fair Price": "न्यायपूर्ण मूल्य",
        "MSP Protection": "एमएसपी संरक्षण",
        "Direct Market": "सीधा बाजार",
        "No Middlemen": "बिना बिचौलियों",
        "Secure & Transparent": "सुरक्षित और पारदर्शी",
        "End-to-End Safety": "अंत तक सुरक्षा",
        "Stronger Together": "साथ मिलकर मजबूत",
        "Better Future": "बेहतर भविष्य",
        "CHOOSE YOUR ROLE": "अपना रोल चुनें",
        "Continue as Farmer": "किसान के रूप में जारी रखें",
        "Continue as Buyer": "खरीदार के रूप में जारी रखें",
        "New Farmer? Register Now": "नया किसान? अभी रजिस्टर करें",
        "New Buyer? Register Now": "नया खरीदार? अभी रजिस्टर करें",
        "Farmer Login": "किसान लॉगिन",
        "Buyer Login": "खरीदार लॉगिन",
        "Total Requests": "कुल अनुरोध",
        "Pending Requests": "लंबित अनुरोध",
        "Approved": "स्वीकृत",
        "Delivered": "डिलिवर किया गया",
        "Distributed": "वितरित",
        "Completed": "पूर्ण",
        "Dispatched": "भेज दिया गया",
        "Rejected": "अस्वीकृत",
        "Manage agricultural input requests and distribution.": "कृषि इनपुट अनुरोधों और वितरण का प्रबंधन करें।",
        "Manage and monitor registered farmers": "पंजीकृत किसानों की निगरानी और प्रबंधन करें।",
        "Manage and monitor registered buyers": "पंजीकृत खरीदारों की निगरानी और प्रबंधन करें।",
        "Monitor important alerts and activities": "महत्वपूर्ण अलर्ट और गतिविधियों की निगरानी करें।",
        "Mediate trade disputes between farmers and buyers, and resolve public complaints.": "किसानों और खरीदारों के बीच व्यापार विवादों की मध्यस्थता करें और शिकायतों का समाधान करें।",
        "View marketplace performance and generate administrative reports.": "मार्केटप्लेस प्रदर्शन देखें और प्रशासनिक रिपोर्ट तैयार करें।",
        "Monitor and manage marketplace payments": "मार्केटप्लेस भुगतान की निगरानी और प्रबंधन करें।",
        "Price / Unit": "मूल्य / इकाई",
        "Price": "मूल्य",
        "Quantity": "मात्रा",
        "Direct Market Access for Farmers & Buyers": "किसानों और खरीदारों के लिए सीधा बाजार संपर्क",
        "Bridging the gap between farmers and buyers with fair pricing, verified produce, and secure Escrow payments.": "उचित मूल्य निर्धारण, सत्यापित उपज और सुरक्षित एस्क्रो भुगतान के साथ किसानों और खरीदारों के बीच की दूरी कम करना।",
        "Connect Directly": "सीधे जुड़ें",
        "Zero Middlemen": "शून्य बिचौलिए",
        "Direct trade between farmers and buyers. No intermediaries taking unfair cuts.": "किसानों और खरीदारों के बीच सीधा व्यापार। कोई बिचौलिया अनुचित कमीशन नहीं लेगा।",
        "Escrow Security": "एस्क्रो सुरक्षा",
        "Safe Payments": "सुरक्षित भुगतान",
        "Funds held securely until produce delivery is verified by both parties.": "दोनों पक्षों द्वारा उपज वितरण सत्यापित होने तक धनराशि सुरक्षित रखी जाती है।",
        "Fair & Transparent": "उचित और पारदर्शी",
        "MSP Guidelines": "एमएसपी दिशानिर्देश",
        "Fair prices backed by Minimum Support Price benchmarks and market trends.": "न्यूनतम समर्थन मूल्य (MSP) और बाजार के रुझानों पर आधारित उचित मूल्य।",
        "Order History": "ऑर्डर इतिहास",
        "Review completed and past sales transactions.": "पूर्ण और पिछले बिक्री लेनदेन की समीक्षा करें।",
        "Filter by status:": "स्थिति के अनुसार फ़िल्टर करें:",
        "All": "सभी",
        "Order Details": "ऑर्डर विवरण",
        "Order Total": "कुल ऑर्डर मूल्य",
        "Order Total:": "कुल ऑर्डर मूल्य:",
        "Placed on:": "दिनांक:",
        "Placed on": "दिनांक",
        "Buyer:": "खरीदार:",
        "Farmer:": "किसान:",
        "Accept Order": "ऑर्डर स्वीकार करें",
        "Reject": "अस्वीकार करें",
        "Request Block Logistics": "ब्लॉक परिवहन का अनुरोध करें",
        "Live Tracking →": "लाइव ट्रैकिंग →",
        "Track →": "ट्रैक करें →",
        "Page": "पेज",
        "No Orders Found": "कोई ऑर्डर नहीं मिला",
        "You have no incoming buyer orders under this status.": "इस स्थिति के अंतर्गत कोई खरीदार ऑर्डर नहीं है।",
        "Loading order history...": "ऑर्डर इतिहास लोड हो रहा है...",
        "Loading incoming orders...": "आने वाले ऑर्डर लोड हो रहे हैं...",
        "Loading produce...": "फसलें लोड हो रही हैं...",
        "Available Produce": "उपलब्ध फसलें",
        "Browse fresh agricultural produce available from farmers.": "किसानों से उपलब्ध ताज़ा कृषि उपज देखें।",
        "Search Produce": "उपज खोजें",
        "Search by crop or produce name": "फसल या उपज के नाम से खोजें",
        "Location": "स्थान",
        "Pickup Location": "पिकअप स्थान",
        "Buyer Destination": "खरीदार गंतव्य",
        "Preferred Pickup Date": "पिकअप दिनांक",
        "Order Reference": "ऑर्डर संदर्भ",
        "Submit Request to Admin": "प्रशासक को अनुरोध सबमिट करें",
        "Total Farmers": "कुल पंजीकृत किसान",
        "Total Buyers": "कुल पंजीकृत खरीदार",
        "Total Orders": "कुल ऑर्डर्स",
        "Total Revenue": "कुल राजस्व",
        "Pending Verification": "सत्यापन लंबित",
        "Verified Farmers": "सत्यापित किसान",
        "ADMIN PORTAL": "प्रशासन पोर्टल",
        "FARMER PORTAL": "किसान पोर्टल",
        "BUYER / VENDOR PORTAL": "खरीदार / व्यापारी पोर्टल"
    };

    /**
     * Get active language code ('en' or 'hi')
     */
    function getLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === "hi" || saved === "en") return saved;
            if (saved === "हिन्दी") return "hi";
            if (saved === "English") return "en";
        } catch (e) {}
        return "en";
    }

    /**
     * Translate key with optional fallback
     */
    function t(keyOrText, fallback) {
        const lang = getLanguage();
        const dict = DICTIONARY[lang] || DICTIONARY.en;

        // 1. Direct dictionary match
        if (dict && typeof dict[keyOrText] !== "undefined") {
            return dict[keyOrText];
        }
        // 2. English dictionary fallback
        if (DICTIONARY.en && typeof DICTIONARY.en[keyOrText] !== "undefined") {
            return (lang === "hi" && DICTIONARY.hi[keyOrText]) ? DICTIONARY.hi[keyOrText] : DICTIONARY.en[keyOrText];
        }
        // 3. Phrase map match (if translating English text directly to Hindi)
        if (lang === "hi" && PHRASE_MAP_EN_TO_HI[keyOrText]) {
            return PHRASE_MAP_EN_TO_HI[keyOrText];
        }

        return (typeof fallback !== "undefined") ? fallback : keyOrText;
    }

    /**
     * Safely updates text content inside an element without destroying icons, badges, or svgs
     */
    function setElementTextSafely(el, newText) {
        if (!el || typeof newText !== "string") return;

        // 1. Dedicated text container takes precedence
        const textSpan = el.querySelector(".i18n-text");
        if (textSpan) {
            textSpan.textContent = newText;
            return;
        }

        // 2. If element is a pure text container
        if (el.children.length === 0) {
            el.textContent = newText;
            return;
        }

        // 3. If element has mixed content (e.g. <i class="fa..."></i> Label text)
        let replaced = false;
        for (let i = 0; i < el.childNodes.length; i++) {
            const node = el.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim().length > 0) {
                // Preserve leading / trailing whitespace
                const leadingSpace = node.nodeValue.match(/^\s*/)[0] || " ";
                const trailingSpace = node.nodeValue.match(/\s*$/)[0] || "";
                node.nodeValue = leadingSpace + newText.trim() + trailingSpace;
                replaced = true;
                break;
            }
        }

        // 4. If no text node found, check if there is an inner child span (like <span>Label</span> alongside <i>)
        if (!replaced) {
            const innerSpan = el.querySelector("span:not(.badge):not(.tag):not(.profile-circle):not(.arrow)");
            if (innerSpan && innerSpan.children.length === 0) {
                innerSpan.textContent = newText;
            }
        }
    }

    /**
     * Translate untagged standard UI headings, buttons, and labels (auto-translate fallback)
     */
    function translateUntaggedUI(lang) {
        if (lang === "hi") {
            const selector = "h1, h2, h3, h4, th, label, option, .nav-title, .admin-label, .nav-item, .nav-item > span, .menu > li > a, .card-title, .stat-info > span, .quick-action strong, .quick-action span, .section-title, button:not(.lang-toggle-btn):not(.language-button), .stat-card small, .role-button > span, p.empty-state";
            document.querySelectorAll(selector).forEach(function(el) {
                if (el.hasAttribute("data-i18n")) return; // already handled
                if (el.closest(".lang-toggle-btn, #languageDropdown, .profile, .user-info")) return;

                const raw = el.textContent.trim();
                if (!raw) return;

                if (PHRASE_MAP_EN_TO_HI[raw]) {
                    if (!el.hasAttribute("data-i18n-orig")) {
                        el.setAttribute("data-i18n-orig", raw);
                    }
                    setElementTextSafely(el, PHRASE_MAP_EN_TO_HI[raw]);
                }
            });
        } else {
            // Restore original English text
            document.querySelectorAll("[data-i18n-orig]").forEach(function(el) {
                const orig = el.getAttribute("data-i18n-orig");
                if (orig) {
                    setElementTextSafely(el, orig);
                }
            });
        }
    }

    /**
     * Apply active language to all DOM elements
     */
    function applyLanguage(lang, triggerEvent) {
        if (lang !== "en" && lang !== "hi") {
            lang = "en";
        }

        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {}

        const dict = DICTIONARY[lang] || DICTIONARY.en;

        // 1. Text translations via data-i18n
        document.querySelectorAll("[data-i18n]").forEach(function(el) {
            const key = el.getAttribute("data-i18n");
            // Skip the language selector label itself from simple key override
            if (el.id === "selectedLanguage") return;

            if (key && typeof dict[key] !== "undefined") {
                setElementTextSafely(el, dict[key]);
            }
        });

        // 2. Placeholder translations
        document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
            const key = el.getAttribute("data-i18n-placeholder");
            if (key && typeof dict[key] !== "undefined") {
                el.setAttribute("placeholder", dict[key]);
            } else if (lang === "hi" && el.hasAttribute("placeholder")) {
                const ph = el.getAttribute("placeholder");
                if (PHRASE_MAP_EN_TO_HI[ph]) {
                    if (!el.hasAttribute("data-i18n-ph-orig")) el.setAttribute("data-i18n-ph-orig", ph);
                    el.setAttribute("placeholder", PHRASE_MAP_EN_TO_HI[ph]);
                }
            } else if (lang === "en" && el.hasAttribute("data-i18n-ph-orig")) {
                el.setAttribute("placeholder", el.getAttribute("data-i18n-ph-orig"));
            }
        });

        // 3. Title / Tooltip translations
        document.querySelectorAll("[data-i18n-title]").forEach(function(el) {
            const key = el.getAttribute("data-i18n-title");
            if (key && typeof dict[key] !== "undefined") {
                el.setAttribute("title", dict[key]);
            }
        });

        // 4. Value translations (for submit/button inputs)
        document.querySelectorAll("[data-i18n-value]").forEach(function(el) {
            const key = el.getAttribute("data-i18n-value");
            if (key && typeof dict[key] !== "undefined") {
                el.setAttribute("value", dict[key]);
            }
        });

        // 5. Automatic fallback for untagged UI text
        translateUntaggedUI(lang);

        // 6. Update Language Toggle button badges
        document.querySelectorAll(".lang-toggle-btn, .lang-switch-btn").forEach(function(btn) {
            const label = btn.querySelector(".lang-toggle-label");
            if (label) {
                // When in English, show "हिन्दी" so clicking switches to Hindi.
                // When in Hindi, show "English" so clicking switches to English.
                label.textContent = (lang === "en") ? "हिन्दी" : "English";
            }
            btn.setAttribute("title", (lang === "en") ? "हिंदी में बदलें (Switch to Hindi)" : "Switch to English");
            btn.setAttribute("data-current-lang", lang);
        });

        // 7. Update index.html navbar language dropdown
        const selectedLangLabel = document.getElementById("selectedLanguage");
        if (selectedLangLabel) {
            selectedLangLabel.textContent = (lang === "hi") ? "हिन्दी" : "English";
        }
        document.querySelectorAll(".language-option").forEach(function(opt) {
            const optLang = opt.getAttribute("data-language");
            const isMatch = (lang === "hi" && (optLang === "हिन्दी" || optLang === "hi")) ||
                            (lang === "en" && (optLang === "English" || optLang === "en"));
            opt.classList.toggle("selected", isMatch);
        });

        // Update html lang attribute
        document.documentElement.lang = lang;

        // Dispatch custom event for dynamic JS components if requested
        if (triggerEvent !== false) {
            try {
                window.dispatchEvent(new CustomEvent("kisanSetuLangChanged", {
                    detail: { lang: lang, dict: dict, t: t }
                }));
            } catch (e) {}
        }
    }

    /**
     * Set language explicitly and update DOM
     */
    function setLanguage(lang) {
        applyLanguage(lang, true);
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
        applyLanguage(current, false);

        // Auto-attach to language toggle buttons
        document.querySelectorAll(".lang-toggle-btn, .lang-switch-btn").forEach(function(btn) {
            if (!btn.hasAttribute("data-i18n-initialized")) {
                btn.setAttribute("data-i18n-initialized", "true");
                btn.addEventListener("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleLanguage();
                });
            }
        });

        // Auto-attach to index.html language dropdown options
        document.querySelectorAll(".language-option").forEach(function(opt) {
            if (!opt.hasAttribute("data-i18n-initialized")) {
                opt.setAttribute("data-i18n-initialized", "true");
                opt.addEventListener("click", function(e) {
                    const chosen = opt.getAttribute("data-language");
                    const targetLang = (chosen === "हिन्दी" || chosen === "hi") ? "hi" : "en";
                    setLanguage(targetLang);
                    const dropdown = document.getElementById("languageDropdown");
                    if (dropdown) dropdown.classList.remove("open");
                });
            }
        });
    }

    // Export to window
    window.kisanI18n = {
        getLanguage: getLanguage,
        getCurrentLanguage: getLanguage,
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage,
        applyLanguage: applyLanguage,
        init: initI18n,
        t: t,
        dictionary: DICTIONARY,
        phrases: PHRASE_MAP_EN_TO_HI
    };

    window.t = t;

    // Run automatically on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initI18n);
    } else {
        initI18n();
    }

    // Auto-translate dynamically inserted content
    try {
        let timer = null;
        const observer = new MutationObserver(function(mutations) {
            let hasAddedNodes = false;
            for (let i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
                    hasAddedNodes = true;
                    break;
                }
            }
            if (hasAddedNodes) {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    applyLanguage(getLanguage(), false);
                }, 120);
            }
        });
        const target = document.body || document.documentElement;
        if (target) {
            observer.observe(target, { childList: true, subtree: true });
        }
    } catch (e) {}

})(typeof window !== "undefined" ? window : this);
