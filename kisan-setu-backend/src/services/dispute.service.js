import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';

export async function create(id, d, m) {
  const o = await prisma.order.findFirst({
    where: {
      id: d.orderId,
      OR: [{ buyerId: id }, { farmerId: id }]
    }
  });
  if (!o) throw errors.notFound('Order not found');

  const [x] = await prisma.$transaction([
    prisma.dispute.create({
      data: {
        createdById: id,
        orderId: d.orderId,
        reason: d.reason,
        evidence: d.evidence ?? null
      }
    }),
    prisma.order.update({
      where: { id: d.orderId },
      data: { status: 'DISPUTED' }
    })
  ]);

  await recordAudit({
    userId: id,
    role: m.role,
    action: 'DISPUTE_CREATED',
    entity: 'Dispute',
    entityId: x.id,
    requestId: m.requestId,
    ipAddress: m.ip
  });

  return x;
}

export const list = (id, role) =>
  prisma.dispute.findMany({
    where: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role) ? {} : { createdById: id },
    include: {
      order: {
        include: {
          farmer: { select: { id: true, name: true, phone: true } },
          buyer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              produce: { select: { cropName: true, unit: true, pricePerUnit: true } }
            }
          }
        }
      },
      creator: { select: { id: true, name: true, role: true, phone: true } },
      assignee: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

export async function get(id, role, did) {
  const x = await prisma.dispute.findFirst({
    where: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role) ? { id: did } : { id: did, createdById: id },
    include: {
      order: {
        include: {
          farmer: { select: { id: true, name: true, phone: true } },
          buyer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              produce: { select: { cropName: true, unit: true, pricePerUnit: true } }
            }
          }
        }
      },
      creator: { select: { id: true, name: true, role: true, phone: true } },
      assignee: { select: { id: true, name: true } }
    }
  });
  if (!x) throw errors.notFound('Dispute not found');
  return x;
}

export async function resolve(admin, id, d, m) {
  const existing = await prisma.dispute.findUnique({ where: { id } });
  if (!existing) throw errors.notFound('Dispute not found');

  const x = await prisma.dispute.update({
    where: { id },
    data: {
      status: d.status,
      resolution: d.resolution,
      assignedTo: admin,
      resolvedAt: new Date()
    }
  });

  await recordAudit({
    userId: admin,
    role: m.role,
    action: 'DISPUTE_RESOLVED',
    entity: 'Dispute',
    entityId: id,
    requestId: m.requestId,
    ipAddress: m.ip
  });

  return x;
}
