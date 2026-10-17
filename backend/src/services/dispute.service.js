import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';

export async function create(id, d, m) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.orderId);

  const o = await prisma.order.findFirst({
    where: {
      ...(isUuid ? { id: d.orderId } : { orderNumber: d.orderId }),
      OR: [{ buyerId: id }, { farmerId: id }]
    }
  });
  if (!o) throw errors.notFound('Order not found or you do not have permission for this order');

  const [x] = await prisma.$transaction([
    prisma.dispute.create({
      data: {
        createdById: id,
        orderId: o.id,
        reason: d.reason,
        evidence: d.evidence ?? null
      }
    }),
    prisma.order.update({
      where: { id: o.id },
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
              produce: {
                select: {
                  title: true,
                  unit: true,
                  pricePerUnit: true,
                  crop: { select: { name: true } }
                }
              }
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
              produce: {
                select: {
                  title: true,
                  unit: true,
                  pricePerUnit: true,
                  crop: { select: { name: true } }
                }
              }
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
