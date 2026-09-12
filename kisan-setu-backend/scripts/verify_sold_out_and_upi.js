import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/config/database.js';
import * as produceService from '../src/services/produce.service.js';
import * as orderService from '../src/services/order.service.js';
import * as paymentService from '../src/services/payment.service.js';

async function verifySoldOutAndUpi() {
    console.log("=== RUNNING VERIFICATION: SOLD-OUT STOCK & UPI ESCROW PAYMENT ===");

    // Find or pick a test farmer and buyer
    const farmer = await prisma.user.findFirst({
        where: { role: 'FARMER', farmerProfile: { isNot: null } },
        include: { farmerProfile: { include: { crops: true } } }
    });
    if (!farmer) throw new Error("No farmer found with profile!");

    const buyer = await prisma.user.findFirst({
        where: { role: 'BUYER' }
    });
    if (!buyer) throw new Error("No buyer found!");

    let crop = farmer.farmerProfile.crops[0];
    if (!crop) {
        crop = await prisma.crop.create({
            data: {
                farmerId: farmer.farmerProfile.id,
                name: "Test Organic Wheat",
                variety: "Sharbati",
                areaAcres: 5,
                season: "Rabi"
            }
        });
    }

    console.log(`Using Farmer: ${farmer.name} (${farmer.id}), Buyer: ${buyer.name} (${buyer.id}), Crop: ${crop.name}`);

    // TEST 1: Create produce listing with 50 kg
    console.log("\n--- TEST 1: Creating produce listing (50 KG) ---");
    const listing = await prisma.produceListing.create({
        data: {
            farmerId: farmer.id,
            cropId: crop.id,
            title: `Golden Wheat Batch ${Date.now().toString().slice(-4)}`,
            description: "High quality wheat harvest",
            location: "Patna Central Mandi",
            unit: "KG",
            availableQuantity: 50,
            pricePerUnit: 30,
            status: "LISTED"
        }
    });
    console.log(`Created listing ${listing.id}: available=${listing.availableQuantity}, status=${listing.status}`);

    // Check it appears in marketplace
    let marketList = await produceService.list({});
    let found = marketList.items.some(i => i.id === listing.id);
    console.log("Appears in buyer marketplace before order:", found);
    if (!found) throw new Error("Expected listing to appear in marketplace!");

    // TEST 2: Place order for all 50 KG
    console.log("\n--- TEST 2: Buyer placing order for all 50 KG ---");
    const order = await orderService.create(buyer.id, {
        produceId: listing.id,
        quantity: 50
    }, { role: 'BUYER', requestId: 'req-test-1', ip: '127.0.0.1' });

    console.log(`Order placed: #${order.orderNumber} (${order.id}), Status: ${order.status}, Total: ₹${order.totalAmount}`);

    // Check produce listing stock & status
    const refreshedListing = await prisma.produceListing.findUnique({ where: { id: listing.id } });
    console.log(`Produce after full order: available=${refreshedListing.availableQuantity}, reserved=${refreshedListing.reservedQuantity}, status=${refreshedListing.status}`);
    if (Number(refreshedListing.availableQuantity) !== 0) {
        throw new Error(`Expected availableQuantity to be 0, got ${refreshedListing.availableQuantity}`);
    }
    if (refreshedListing.status !== 'SOLD_OUT') {
        throw new Error(`Expected status to be SOLD_OUT, got ${refreshedListing.status}`);
    }

    // TEST 3: Verify it is HIDDEN from buyer marketplace
    console.log("\n--- TEST 3: Verifying sold-out produce is hidden from marketplace ---");
    marketList = await produceService.list({});
    found = marketList.items.some(i => i.id === listing.id);
    console.log("Appears in buyer marketplace after full order:", found);
    if (found) throw new Error("Sold-out listing should NOT appear in buyer marketplace!");
    console.log("✓ Success: Sold-out listing is cleanly hidden from other buyers!");

    // TEST 4: Farmer Accepts Order
    console.log("\n--- TEST 4: Farmer accepting the order ---");
    const acceptedOrder = await orderService.status(farmer.id, 'FARMER', order.id, 'ACCEPTED', { requestId: 'req-test-accept', ip: '127.0.0.1' });
    console.log(`Order status after farmer acceptance: ${acceptedOrder.status}`);
    if (acceptedOrder.status !== 'ACCEPTED') throw new Error("Expected order status to be ACCEPTED!");

    // Check buyer received notification for payment
    const paymentNotif = await prisma.notification.findFirst({
        where: { userId: buyer.id },
        orderBy: { createdAt: 'desc' }
    });
    console.log("Buyer received notification:", paymentNotif?.title, "-", paymentNotif?.message);
    if (!paymentNotif || !paymentNotif.title.includes('Payment Required')) {
        throw new Error("Expected buyer notification for payment required!");
    }

    // TEST 5: Buyer Initiates ₹1 Demo Payment via PhonePe QR
    console.log("\n--- TEST 5: Buyer initiating ₹1 Demo Payment ---");
    const payment = await paymentService.initiate(buyer.id, {
        orderId: order.id,
        idempotencyKey: `test-pay-${order.id}-${Date.now()}`,
        amount: 1
    }, { role: 'BUYER', requestId: 'req-pay-init', ip: '127.0.0.1' });

    console.log(`Payment initiated: ID=${payment.id}, Amount=₹${payment.amount}, Status=${payment.status}, Provider=${payment.provider}`);
    if (Number(payment.amount) !== 1) throw new Error(`Expected payment amount to be 1, got ${payment.amount}`);

    // TEST 6: Verify ₹1 Payment -> Order becomes PAID
    console.log("\n--- TEST 6: Verifying payment ---");
    const verifiedPayment = await paymentService.verify(buyer.id, payment.id, {
        providerPaymentId: payment.providerPaymentId,
        success: true,
        utr: "DEMO-PHONEPE-UTR-12345"
    }, { role: 'BUYER', requestId: 'req-pay-verify', ip: '127.0.0.1' });

    console.log(`Payment verification status: ${verifiedPayment.status}`);
    if (verifiedPayment.status !== 'SUCCESS') throw new Error("Expected payment verification to be SUCCESS!");

    const paidOrder = await prisma.order.findUnique({ where: { id: order.id } });
    console.log(`Final Order Status: ${paidOrder.status}`);
    if (paidOrder.status !== 'PAID') throw new Error(`Expected order status to be PAID, got ${paidOrder.status}`);

    const finalProduce = await prisma.produceListing.findUnique({ where: { id: listing.id } });
    console.log(`Produce finalized inventory: available=${finalProduce.availableQuantity}, reserved=${finalProduce.reservedQuantity}, sold=${finalProduce.soldQuantity}`);
    if (Number(finalProduce.soldQuantity) !== 50) throw new Error("Expected 50 soldQuantity!");

    // TEST 7: Test Stock Rollback on Order Rejection
    console.log("\n--- TEST 7: Testing Stock Restoration on Order Rejection ---");
    const listing2 = await prisma.produceListing.create({
        data: {
            farmerId: farmer.id,
            cropId: crop.id,
            title: `Restoration Test Rice ${Date.now().toString().slice(-4)}`,
            description: "Test produce for rejection rollback",
            location: "Gaya Mandi",
            unit: "KG",
            availableQuantity: 25,
            pricePerUnit: 40,
            status: "LISTED"
        }
    });

    const order2 = await orderService.create(buyer.id, {
        produceId: listing2.id,
        quantity: 25
    }, { role: 'BUYER' });

    let check2 = await prisma.produceListing.findUnique({ where: { id: listing2.id } });
    console.log(`Produce 2 reserved: available=${check2.availableQuantity}, status=${check2.status}`);

    // Farmer Rejects order2
    await orderService.status(farmer.id, 'FARMER', order2.id, 'REJECTED', { requestId: 'req-rej', ip: '127.0.0.1' });
    check2 = await prisma.produceListing.findUnique({ where: { id: listing2.id } });
    console.log(`Produce 2 after rejection: available=${check2.availableQuantity}, reserved=${check2.reservedQuantity}, status=${check2.status}`);
    if (Number(check2.availableQuantity) !== 25) throw new Error("Expected availableQuantity to be restored to 25!");
    if (check2.status !== 'LISTED') throw new Error("Expected status to be restored to LISTED!");

    // Verify it reappears in marketplace
    marketList = await produceService.list({});
    found = marketList.items.some(i => i.id === listing2.id);
    console.log("Reappears in buyer marketplace after rejection:", found);
    if (!found) throw new Error("Expected listing 2 to reappear in marketplace after rejection!");

    // Cleanup test records
    await prisma.orderItem.deleteMany({ where: { orderId: { in: [order.id, order2.id] } } });
    await prisma.paymentAttempt.deleteMany({ where: { paymentId: payment.id } });
    await prisma.payment.deleteMany({ where: { id: payment.id } });
    await prisma.order.deleteMany({ where: { id: { in: [order.id, order2.id] } } });
    await prisma.produceListing.deleteMany({ where: { id: { in: [listing.id, listing2.id] } } });

    console.log("\n========================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! EVERYTHING WORKS FLAWLESSLY!");
    console.log("========================================================");
}

verifySoldOutAndUpi()
    .catch(err => {
        console.error("Verification FAILED:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
