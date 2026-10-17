import {prisma} from '../config/database.js';
import {errors} from '../utils/errors.js';
import {recordAudit} from './audit.service.js';

export async function create(userId, d, m = {}) {
  const p = await prisma.inputProduct.findFirst({where: {id: d.inputProductId, isActive: true}});
  if (!p) throw errors.notFound('Input product not found');

  const r = await prisma.inputRequest.create({
    data: {farmerId: userId, ...d},
    include: {inputProduct: true, farmer: {select: {id: true, name: true, phone: true}}}
  });

  await recordAudit({
    userId,
    role: 'FARMER',
    action: 'INPUT_REQUEST_CREATED',
    entity: 'InputRequest',
    entityId: r.id,
    requestId: m?.requestId,
    ipAddress: m?.ip || m?.ipAddress
  });

  try {
    const {notifyAdmins} = await import('./notification.service.js');
    await notifyAdmins({
      title: 'New Seed / Fertilizer Request',
      message: `${r.farmer.name} requested ${r.quantity} ${p.unit} of ${p.name}.`,
      metadata: {requestId: r.id, inputProductId: p.id, quantity: r.quantity}
    });
  } catch (err) {
    console.warn('Could not notify admins of input request:', err?.message || err);
  }

  return r;
}

export async function list(userId, role) {
  return prisma.inputRequest.findMany({
    where: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role) ? {} : {farmerId: userId},
    include: {
      inputProduct: true,
      farmer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          farmerProfile: {select: {village: true, district: true, state: true, landAreaAcres: true}}
        }
      }
    },
    orderBy: {createdAt: 'desc'}
  });
}

export async function get(userId, role, id) {
  const r = await prisma.inputRequest.findFirst({
    where: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'].includes(role) ? {id} : {id, farmerId: userId},
    include: {
      inputProduct: true,
      farmer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          farmerProfile: true
        }
      }
    }
  });
  if (!r) throw errors.notFound('Input request not found');
  return r;
}

export async function review(adminId, id, status, note, m = {}) {
  const result = await prisma.$transaction(async (tx) => {
    const r = await tx.inputRequest.findUnique({where: {id}, include: {inputProduct: true}});
    if (!r) throw errors.notFound('Input request not found');
    if (r.status !== 'PENDING') throw errors.conflict('Request already reviewed');

    if (status === 'APPROVED') {
      const s = await tx.inputProduct.updateMany({
        where: {id: r.inputProductId, stock: {gte: Number(r.quantity)}},
        data: {stock: {decrement: Number(r.quantity)}}
      });
      if (s.count !== 1) throw errors.conflict('Insufficient input stock available in warehouse');
    }

    const x = await tx.inputRequest.update({
      where: {id},
      data: {status, adminNote: note, reviewedBy: adminId, reviewedAt: new Date()},
      include: {inputProduct: true}
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        role: m?.role || 'PRAKHAND_ADMIN',
        action: `INPUT_REQUEST_${status}`,
        entity: 'InputRequest',
        entityId: id,
        requestId: m?.requestId,
        ipAddress: m?.ip || m?.ipAddress
      }
    });

    return x;
  });

  try {
    const {notifyUser} = await import('./notification.service.js');
    await notifyUser({
      userId: result.farmerId,
      title: status === 'APPROVED' ? 'Seeds/Fertilizers Request Approved' : 'Input Request Update',
      message: status === 'APPROVED'
        ? `Your request for ${result.quantity} ${result.inputProduct.unit} of ${result.inputProduct.name} has been approved! Please collect it from your Block Agriculture Godown.`
        : `Your request for ${result.inputProduct.name} could not be approved at this time. Note: ${note || 'Quota limit reached.'}`,
      metadata: {requestId: result.id, status}
    });
  } catch (err) {
    console.warn('Could not notify farmer of input review:', err?.message || err);
  }

  return result;
}

export const createProduct = (d) => prisma.inputProduct.create({data: d});

export async function listProducts() {
  let products = await prisma.inputProduct.findMany({
    where: {isActive: true},
    orderBy: {name: 'asc'}
  });

  if (products.length === 0) {
    const defaults = [
      {name: 'Urea Fertilizer (Neem Coated) - यूरिया', category: 'Fertilizer', unit: 'BAG (45 KG)', stock: 500},
      {name: 'DAP Fertilizer (18:46:0) - डीएपी खाद', category: 'Fertilizer', unit: 'BAG (50 KG)', stock: 400},
      {name: 'NPK Complex (10:26:26) - एनपीके', category: 'Fertilizer', unit: 'BAG (50 KG)', stock: 350},
      {name: 'Certified Wheat Seed (HD-2967) - गेहूं बीज', category: 'Seed', unit: 'KG', stock: 1200},
      {name: 'Hybrid Paddy Seed (Basmati) - धान बीज', category: 'Seed', unit: 'KG', stock: 1000},
      {name: 'Bio-Pesticide Neem Oil 1500 PPM - कीटनाशक', category: 'Pesticide', unit: 'LITRE', stock: 250}
    ];
    for (const item of defaults) {
      await prisma.inputProduct.create({data: item}).catch(() => {});
    }
    products = await prisma.inputProduct.findMany({
      where: {isActive: true},
      orderBy: {name: 'asc'}
    });
  }

  return products;
}
