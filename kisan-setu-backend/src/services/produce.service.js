import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { enforceListingCompliance } from './msp.service.js';
import { recordAudit } from './audit.service.js';

export async function create(userId, d, m) {
  let p = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!p) {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (u && u.role === 'FARMER') {
      p = await prisma.farmerProfile.create({ data: { userId } });
    } else {
      throw errors.forbidden('Farmer profile required');
    }
  }

  let c = await prisma.crop.findFirst({ where: { id: d.cropId, farmerId: p.id, deletedAt: null } });
  if (!c) {
    const existingCrop = await prisma.crop.findUnique({ where: { id: d.cropId } });
    if (existingCrop) {
      c = await prisma.crop.create({
        data: {
          farmerId: p.id,
          name: existingCrop.name,
          variety: existingCrop.variety,
          season: existingCrop.season || 'Rabi'
        }
      });
      d.cropId = c.id;
    } else {
      throw errors.notFound('Crop not found or not owned');
    }
  }

  const x = await enforceListingCompliance({
    cropId: d.cropId,
    cropName: c.name,
    location: d.location,
    price: d.pricePerUnit,
    pricePerKg: d.pricePerUnit,
    unit: d.unit,
    farmerId: userId,
    requestId: m.requestId,
    ipAddress: m.ip
  });
  if (x.violation) throw errors.unprocessable(`Price is below applicable MSP (${x.mspPrice}/${x.mspUnit || d.unit})`);

  const l = await prisma.produceListing.create({ data: { farmerId: userId, ...d, status: 'LISTED' } });
  await recordAudit({
    userId,
    role: 'FARMER',
    action: 'PRODUCE_CREATED',
    entity: 'ProduceListing',
    entityId: l.id,
    requestId: m.requestId,
    ipAddress: m.ip
  });
  return l;
}

export async function list(q) {
  const { page, limit, skip } = parsePagination(q);
  const searchPattern = q.search || q.q;
  const isFarmerOwner = Boolean(q.farmerId);
  const includeSold = q.includeSold === 'true' || isFarmerOwner;

  const where = {
    deletedAt: null,
    status: { in: ['LISTED', 'RESERVED', ...(includeSold ? ['SOLD_OUT'] : [])] },
    ...(includeSold ? {} : { availableQuantity: { gt: 0 } }),
    ...(q.farmerId ? { farmerId: q.farmerId } : {}),
    ...(q.cropId ? { cropId: q.cropId } : {}),
    ...(q.location ? { location: { contains: q.location, mode: 'insensitive' } } : {}),
    ...(searchPattern
      ? {
          OR: [
            { title: { contains: searchPattern, mode: 'insensitive' } },
            { description: { contains: searchPattern, mode: 'insensitive' } },
            { crop: { name: { contains: searchPattern, mode: 'insensitive' } } }
          ]
        }
      : {}),
    ...(q.minPrice !== undefined || q.maxPrice !== undefined
      ? {
          pricePerUnit: {
            ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
            ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {})
          }
        }
      : {})
  };

  const [a, total] = await prisma.$transaction([
    prisma.produceListing.findMany({
      where,
      include: {
        crop: { select: { id: true, name: true, variety: true } },
        farmer: { select: { id: true, name: true, phone: true, farmerProfile: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.produceListing.count({ where })
  ]);
  return { items: a, pagination: paginationMeta(page, limit, total) };
}

export async function get(id) {
  const x = await prisma.produceListing.findFirst({
    where: { id, deletedAt: null },
    include: { crop: true, farmer: { select: { id: true, name: true, phone: true, farmerProfile: true } } }
  });
  if (!x) throw errors.notFound('Produce listing not found');
  return x;
}

export async function update(userId, id, d, m) {
  const old = await prisma.produceListing.findFirst({ where: { id, farmerId: userId, deletedAt: null } });
  if (!old) throw errors.notFound('Produce listing not found');
  const cropId = d.cropId || old.cropId,
    loc = d.location || old.location,
    price = d.pricePerUnit ?? Number(old.pricePerUnit);
  const x = await enforceListingCompliance({
    cropId,
    location: loc,
    price,
    pricePerKg: price,
    unit: d.unit || old.unit,
    farmerId: userId,
    requestId: m.requestId,
    ipAddress: m.ip
  });
  if (x.violation) throw errors.unprocessable(`Price is below applicable MSP (${x.mspPrice}/${x.mspUnit || d.unit || old.unit})`);
  return prisma.produceListing.update({ where: { id }, data: d });
}

export async function remove(userId, id) {
  const x = await prisma.produceListing.findFirst({ where: { id, farmerId: userId, deletedAt: null } });
  if (!x) throw errors.notFound('Produce listing not found');
  if (Number(x.reservedQuantity) > 0) throw errors.conflict('Reserved quantity exists');
  await prisma.produceListing.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
}
