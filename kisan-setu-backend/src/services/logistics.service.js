import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { notifyUser } from './notification.service.js';

const next = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'FAILED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: []
};

export async function list(id, role, q = {}) {
  const where = ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role)
    ? {}
    : role === 'BUYER'
    ? { order: { buyerId: id } }
    : { order: { farmerId: id } };

  if (q.status) {
    where.status = q.status;
  }

  return prisma.logistics.findMany({
    where,
    include: {
      order: {
        include: {
          items: { include: { produce: { include: { crop: true } } } },
          buyer: { select: { id: true, name: true, phone: true, email: true, buyerProfile: true } },
          farmer: { select: { id: true, name: true, phone: true, email: true, farmerProfile: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function create(id, d, m) {
  const o = await prisma.order.findFirst({
    where: { id: d.orderId, OR: [{ buyerId: id }, { farmerId: id }] },
    include: { buyer: true, farmer: true }
  });
  if (!o) throw errors.notFound('Order not found');

  const old = await prisma.logistics.findUnique({ where: { orderId: d.orderId } });
  if (old) return old;

  const x = await prisma.logistics.create({
    data: {
      ...d,
      estimatedDelivery: d.estimatedDelivery ? new Date(d.estimatedDelivery) : undefined,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', at: new Date().toISOString() }]
    }
  });

  await prisma.order.update({ where: { id: o.id }, data: { status: 'LOGISTICS_PENDING' } });
  await recordAudit({
    userId: id,
    role: m.role,
    action: 'LOGISTICS_CREATED',
    entity: 'Logistics',
    entityId: x.id,
    requestId: m.requestId,
    ipAddress: m.ip
  });

  const notifyTarget = id === o.buyerId ? o.farmerId : o.buyerId;
  await notifyUser({
    userId: notifyTarget,
    title: 'Logistics Requested',
    message: `Transport request has been submitted to Block Admin for Order #${o.orderNumber || o.id.slice(0, 8)}.`,
    metadata: { orderId: o.id, logisticsId: x.id }
  }).catch(() => {});

  return x;
}

export async function get(id, role, lid) {
  const where = {
    id: lid,
    ...(['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role)
      ? {}
      : role === 'BUYER'
      ? { order: { buyerId: id } }
      : { order: { farmerId: id } })
  };

  const x = await prisma.logistics.findFirst({
    where,
    include: {
      order: {
        include: {
          items: { include: { produce: { include: { crop: true } } } },
          buyer: { select: { id: true, name: true, phone: true, email: true, buyerProfile: true } },
          farmer: { select: { id: true, name: true, phone: true, email: true, farmerProfile: true } }
        }
      }
    }
  });
  if (!x) throw errors.notFound('Logistics not found');
  return x;
}

export async function status(id, role, lid, payload, m) {
  const x = await get(id, role, lid);
  const s = typeof payload === 'string' ? payload : payload.status;
  const vehicleReference = typeof payload === 'object' ? payload.vehicleReference : undefined;
  const driverReference = typeof payload === 'object' ? payload.driverReference : undefined;
  const estimatedDelivery = typeof payload === 'object' && payload.estimatedDelivery ? new Date(payload.estimatedDelivery) : undefined;

  if (!next[x.status]?.includes(s)) {
    throw errors.conflict(`Invalid logistics transition ${x.status} -> ${s}`);
  }

  const h = Array.isArray(x.statusHistory) ? x.statusHistory : [];
  h.push({ status: s, at: new Date().toISOString() });

  return prisma.$transaction(async (tx) => {
    const updateData = {
      status: s,
      actualDelivery: s === 'DELIVERED' ? new Date() : undefined,
      statusHistory: h
    };

    if (vehicleReference !== undefined) updateData.vehicleReference = vehicleReference;
    if (driverReference !== undefined) updateData.driverReference = driverReference;
    if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery;

    const u = await tx.logistics.update({
      where: { id: lid },
      data: updateData
    });

    if (s === 'IN_TRANSIT') {
      await tx.order.update({ where: { id: x.orderId }, data: { status: 'IN_TRANSIT' } });
    }
    if (s === 'DELIVERED') {
      await tx.order.update({ where: { id: x.orderId }, data: { status: 'DELIVERED' } });
    }

    await tx.auditLog.create({
      data: {
        userId: id,
        role,
        action: `LOGISTICS_${s}`,
        entity: 'Logistics',
        entityId: lid,
        requestId: m.requestId,
        ipAddress: m.ip
      }
    });

    // Notify farmer and buyer
    if (x.order) {
      if (s === 'ASSIGNED') {
        const vehicleInfo = vehicleReference || u.vehicleReference || 'Assigned';
        const driverInfo = driverReference || u.driverReference || 'Assigned';
        await notifyUser({
          userId: x.order.farmerId,
          title: 'Transport Assigned',
          message: `Block Admin assigned transport (${vehicleInfo}). Driver: ${driverInfo}.`,
          metadata: { logisticsId: lid, orderId: x.orderId }
        }).catch(() => {});

        await notifyUser({
          userId: x.order.buyerId,
          title: 'Transport Assigned',
          message: `Block Admin assigned transport (${vehicleInfo}). Driver: ${driverInfo}.`,
          metadata: { logisticsId: lid, orderId: x.orderId }
        }).catch(() => {});
      } else if (s === 'DELIVERED') {
        await notifyUser({
          userId: x.order.buyerId,
          title: 'Produce Delivered',
          message: `Your order shipment has been marked as DELIVERED.`,
          metadata: { logisticsId: lid, orderId: x.orderId }
        }).catch(() => {});
        await notifyUser({
          userId: x.order.farmerId,
          title: 'Produce Delivered',
          message: `Shipment for Order #${x.order.orderNumber || x.orderId.slice(0, 8)} has been delivered.`,
          metadata: { logisticsId: lid, orderId: x.orderId }
        }).catch(() => {});
      }
    }

    return u;
  });
}

