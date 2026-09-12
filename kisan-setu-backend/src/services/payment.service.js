import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { MockPaymentProvider } from '../providers/payment/mockPaymentProvider.js';
import { recordAudit } from './audit.service.js';
import { notifyUser } from './notification.service.js';

const provider = new MockPaymentProvider();

export async function initiate(userId, { orderId, idempotencyKey, amount }, m) {
  const o = await prisma.order.findFirst({ where: { id: orderId, buyerId: userId } });
  if (!o) throw errors.notFound('Order not found');
  if (!['ACCEPTED', 'PAYMENT_PENDING'].includes(o.status)) throw errors.conflict('Order is not payable');

  const old = await prisma.payment.findUnique({ where: { idempotencyKey }, include: { order: true } });
  if (old) {
    const totalOrderAmount = Number(old.order?.totalAmount ?? old.amount);
    return { ...old, amount: totalOrderAmount, totalAmount: totalOrderAmount };
  }

  const totalOrderAmount = Number(o.totalAmount);
  // Real gateway charge amount (₹1 in demo mode)
  const payAmount = (amount !== undefined && Number(amount) > 0) ? Number(amount) : totalOrderAmount;
  const p = await provider.createPayment({ amount: payAmount, currency: o.currency, idempotencyKey });

  return prisma.$transaction(async tx => {
    const x = await tx.payment.create({
      data: {
        orderId,
        provider: 'upi_phonepe',
        providerPaymentId: p.providerPaymentId,
        amount: totalOrderAmount, // Display and ledger stores the total order amount
        currency: o.currency,
        status: 'PENDING',
        idempotencyKey,
        attempts: { create: { providerReference: p.providerPaymentId, status: 'PENDING' } }
      },
      include: { order: true }
    });

    await tx.order.update({ where: { id: orderId }, data: { status: 'PAYMENT_PENDING' } });
    await tx.auditLog.create({
      data: {
        userId,
        role: 'BUYER',
        action: 'PAYMENT_INITIATED',
        entity: 'Payment',
        entityId: x.id,
        requestId: m.requestId,
        ipAddress: m.ip,
        metadata: { amount: totalOrderAmount, gatewayCharged: payAmount, currency: o.currency }
      }
    });

    return {
      ...x,
      amount: totalOrderAmount,
      totalAmount: totalOrderAmount,
      gatewayCharge: payAmount
    };
  });
}

export async function verify(userId, id, { providerPaymentId, success, utr }, m) {
  const p = await prisma.payment.findUnique({ where: { id }, include: { order: true } });
  if (!p) throw errors.notFound('Payment not found');
  if (p.order.buyerId !== userId && !['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(m.role)) throw errors.forbidden();
  if (p.status === 'SUCCESS') return p;
  if (p.providerPaymentId !== providerPaymentId) throw errors.badRequest('Provider reference mismatch');

  const r = await provider.verifyPayment({ providerPaymentId, success });
  const totalOrderAmount = Number(p.order?.totalAmount ?? p.amount);

  const res = await prisma.$transaction(async tx => {
    const status = r.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
    const x = await tx.payment.update({
      where: { id },
      data: {
        status,
        amount: totalOrderAmount,
        verifiedAt: status === 'SUCCESS' ? new Date() : undefined,
        attempts: { create: { providerReference: providerPaymentId, status } }
      },
      include: { order: true }
    });

    if (status === 'SUCCESS') {
      const items = await tx.orderItem.findMany({ where: { orderId: p.orderId } });
      for (const i of items) {
        const q = Number(i.quantity);
        const u = await tx.produceListing.updateMany({
          where: { id: i.produceId, reservedQuantity: { gte: q } },
          data: { reservedQuantity: { decrement: q }, soldQuantity: { increment: q } }
        });
        if (u.count !== 1) throw errors.conflict('Inventory state inconsistent');
      }
      await tx.order.update({ where: { id: p.orderId }, data: { status: 'PAID' } });
    }

    await tx.auditLog.create({
      data: {
        userId,
        role: m.role,
        action: `PAYMENT_${status}`,
        entity: 'Payment',
        entityId: id,
        requestId: m.requestId,
        ipAddress: m.ip
      }
    });

    return x;
  });

  if (res.status === 'SUCCESS') {
    try {
      const formattedTotal = totalOrderAmount.toLocaleString('en-IN');
      await notifyUser({
        userId: p.order.farmerId,
        title: 'Payment Confirmed!',
        message: `Buyer has completed payment of ₹${formattedTotal} (Escrow Secured) for Order #${p.order.orderNumber}. Order is now CONFIRMED.`,
        metadata: { orderId: p.orderId, paymentId: id }
      });
      await notifyUser({
        userId: p.order.buyerId,
        title: 'Payment Successful!',
        message: `Payment of ₹${formattedTotal} verified for Order #${p.order.orderNumber}. You can now request block logistics.`,
        metadata: { orderId: p.orderId, paymentId: id }
      });
    } catch (e) {
      console.warn('Payment notification warning:', e.message);
    }
  }

  return {
    ...res,
    amount: totalOrderAmount,
    totalAmount: totalOrderAmount
  };
}

export async function get(userId, role, id) {
  const where = ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role)
    ? { id }
    : role === 'BUYER'
    ? { id, order: { buyerId: userId } }
    : { id, order: { farmerId: userId } };

  const p = await prisma.payment.findFirst({
    where,
    include: {
      order: {
        include: {
          buyer: { select: { id: true, name: true, phone: true, email: true } },
          farmer: { select: { id: true, name: true, phone: true, email: true } },
          items: { include: { produce: true } }
        }
      }
    }
  });

  if (!p) throw errors.notFound('Payment not found');
  const total = Number(p.order?.totalAmount ?? p.amount);
  return { ...p, amount: total, totalAmount: total, totalOrderAmount: total };
}

export const list = async (userId, role) => {
  const items = await prisma.payment.findMany({
    where: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role)
      ? {}
      : role === 'BUYER'
      ? { order: { buyerId: userId } }
      : { order: { farmerId: userId } },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          subtotal: true,
          status: true,
          farmer: { select: { name: true, phone: true } },
          buyer: { select: { name: true, phone: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return items.map(p => {
    const total = Number(p.order?.totalAmount ?? p.amount);
    return { ...p, amount: total, totalAmount: total, totalOrderAmount: total };
  });
};
