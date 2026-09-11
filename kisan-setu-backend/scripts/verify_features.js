import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import * as authService from '../src/services/auth.service.js';
import * as adminService from '../src/services/admin.service.js';
import * as inputService from '../src/services/input.service.js';
import * as orderService from '../src/services/order.service.js';

async function runVerification() {
    console.log("=== STARTING FULL END-TO-END VERIFICATION ===");

    const timestamp = Date.now();
    const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `farmer_${timestamp}@testkisan.in`;

    // 1. Register Farmer with KYC
    console.log("\n1. Testing Farmer Registration with KYC...");
    const regResult = await authService.register({
        name: `Ramesh Kumar ${timestamp.toString().slice(-4)}`,
        phone: testPhone,
        email: testEmail,
        password: "Password@123",
        role: "FARMER",
        district: "Patna",
        state: "Bihar",
        kycType: "AADHAAR",
        kycNumber: "987654321012"
    });

    console.log("Farmer registered:", regResult.user.id, "Verified:", regResult.user.isVerified);
    if (regResult.user.isVerified !== false) {
        throw new Error("Expected new registrant isVerified to be false!");
    }

    // Verify IdentityVerification row
    const kycRecord = await prisma.identityVerification.findUnique({
        where: { userId: regResult.user.id }
    });
    console.log("KYC Record created:", kycRecord ? `${kycRecord.docType} - ${kycRecord.status}` : "NOT FOUND");
    if (!kycRecord || kycRecord.status !== "PENDING") {
        throw new Error("Expected IdentityVerification record with status PENDING!");
    }

    // 2. Admin KYC Authorization
    console.log("\n2. Testing Admin User Authorization...");
    const superAdmin = await prisma.user.findFirst({
        where: { role: { in: ["SUPER_ADMIN", "PRAKHAND_ADMIN"] } }
    });
    console.log("Admin for test:", superAdmin.name, `(${superAdmin.role})`);

    const updatedUser = await adminService.updateUser(
        regResult.user.id,
        {
            isVerified: true,
            kycStatus: "VERIFIED",
            kycNotes: "Aadhaar Card and land ownership records verified by Krishi Bhavan."
        },
        superAdmin
    );
    console.log("User updated by Admin. isVerified:", updatedUser.isVerified);
    const updatedKyc = await prisma.identityVerification.findUnique({
        where: { userId: regResult.user.id }
    });
    console.log("Updated KYC Status:", updatedKyc.status, "VerifiedAt:", updatedKyc.verifiedAt);
    if (!updatedUser.isVerified || updatedKyc.status !== "VERIFIED") {
        throw new Error("User KYC authorization failed!");
    }

    // 3. Test Seeds & Fertilizers (Input Service)
    console.log("\n3. Testing Seed & Fertilizer Catalog and Quota Requests...");
    const products = await inputService.listProducts();
    console.log(`Found ${products.length} input products in catalog:`, products.slice(0, 3).map(p => `${p.name} (${p.category}) - InStock: ${p.stockKg}`));
    if (!products.length) {
        throw new Error("Expected input products catalog to have items!");
    }

    const selectedProduct = products[0];
    const inputReq = await inputService.create(
        regResult.user.id,
        {
            inputProductId: selectedProduct.id,
            quantity: 50,
            reason: "Season: RABI_2026. Subsidized quota for 2.5 acres wheat cultivation in Patna block."
        }
    );
    console.log("Farmer submitted input request:", inputReq.id, "Status:", inputReq.status);
    if (inputReq.status !== "PENDING") {
        throw new Error("Expected input request to be PENDING!");
    }

    // Admin reviews and approves input request
    const approvedInput = await inputService.review(
        superAdmin.id,
        inputReq.id,
        "APPROVED",
        "Allotted 50 KG quota. Collect from Patna PACS Warehouse."
    );
    console.log("Admin approved input request. Status:", approvedInput.status, "Notes:", approvedInput.adminNote);
    if (approvedInput.status !== "APPROVED") {
        throw new Error("Expected input request status to be APPROVED!");
    }

    // 4. Test Block Produce Procurement (MSP)
    console.log("\n4. Testing Block Produce Procurement (MSP Guarantee)...");
    const farmerProf = await prisma.farmerProfile.findUnique({
        where: { userId: regResult.user.id }
    });

    const crop = await prisma.crop.create({
        data: {
            farmerId: farmerProf.id,
            name: "Wheat",
            variety: "HD-2967",
            areaAcres: 2.5,
            season: "Rabi"
        }
    });

    const produce = await prisma.produceListing.create({
        data: {
            farmerId: regResult.user.id,
            cropId: crop.id,
            title: `[Block Procurement Center / PACS - MSP Guarantee] Sharbati Wheat Grade-A`,
            availableQuantity: 500,
            reservedQuantity: 0,
            soldQuantity: 0,
            unit: "KG",
            pricePerUnit: 24.25, // Official MSP rate
            status: "LISTED",
            location: "Patna Block, Bihar",
            description: "Direct sale to Block Krishi Bhavan at guaranteed MSP."
        }
    });
    console.log("Farmer listed produce for Block Procurement:", produce.id, produce.title);

    // Admin issues Government Procurement Order
    const procOrder = await orderService.create(
        superAdmin.id,
        {
            produceId: produce.id,
            quantity: 500
        },
        { role: superAdmin.role }
    );
    console.log("Admin issued Government Procurement Order:", procOrder.id, "Status:", procOrder.status, "Total:", procOrder.totalAmount);
    if (procOrder.status !== "ACCEPTED") {
        throw new Error("Expected government procurement order to be ACCEPTED!");
    }

    // Verify produce inventory reserved/reduced
    const refreshedProduce = await prisma.produceListing.findUnique({ where: { id: produce.id } });
    console.log("Produce available qty after procurement:", refreshedProduce.availableQuantity, "Reserved:", refreshedProduce.reservedQuantity, "Status:", refreshedProduce.status);
    if (Number(refreshedProduce.availableQuantity) !== 0 || refreshedProduce.status !== "RESERVED") {
        throw new Error("Expected available quantity to be 0 and status RESERVED!");
    }

    // 5. Verify Notifications
    console.log("\n5. Checking Notifications generated...");
    const notifications = await prisma.notification.findMany({
        where: { userId: regResult.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(`Found ${notifications.length} notifications for farmer:`);
    notifications.forEach(n => console.log(`  - [${n.type}] ${n.title}: ${n.message}`));

    console.log("\n=======================================================");
    console.log("🎉 ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY! 🎉");
    console.log("=======================================================");
    await prisma.$disconnect();
}

runVerification().catch(async (e) => {
    console.error("\n❌ VERIFICATION FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
});
