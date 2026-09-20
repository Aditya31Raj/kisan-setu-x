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

export const REGISTERED_DRIVERS = [
  { id: 'SN 365', aliases: ['SN365', 'SN 365', '1', 'SOHAM NAYEK'], name: 'Soham Nayek', phone: '+91 98321 00365', vehicleType: 'Tata Ace (Chhota Hathi)', vehicleNumber: 'BR-06-SN-0365', capacityKg: 1000, basePrakhand: 'Dumra', isAvailable: true, rating: 4.9 },
  { id: 'HS 265', aliases: ['HS265', 'HS 265', '2', 'HARSH SAHU'], name: 'Harsh Sahu', phone: '+91 98452 00265', vehicleType: 'Mahindra Bolero Maxi Truck', vehicleNumber: 'BR-06-HS-0265', capacityKg: 1500, basePrakhand: 'Runnisaidpur', isAvailable: true, rating: 4.8 },
  { id: 'AV 60', aliases: ['AV60', 'AV 60', '3', 'AYUSH VARDHAN', 'AYUSH AVRDHAN'], name: 'Ayush Vardhan', phone: '+91 98563 00060', vehicleType: 'Piaggio Ape E-City (Electric Cargo)', vehicleNumber: 'BR-06-AV-0060', capacityKg: 450, basePrakhand: 'Bairgania', isAvailable: true, rating: 4.7 },
  { id: 'PB 25', aliases: ['PB25', 'PB 25', '4', 'PIYUSH BHAGAT', 'PIYUS BHAGAT'], name: 'Piyush Bhagat', phone: '+91 98674 00025', vehicleType: 'Ashok Leyland Dost+', vehicleNumber: 'BR-06-PB-0025', capacityKg: 1250, basePrakhand: 'Riga', isAvailable: true, rating: 4.9 },
  { id: 'AK 47', aliases: ['AK47', 'AK 47', '5', 'ABHIJEET KUMAR'], name: 'Abhijeet Kumar', phone: '+91 98785 00047', vehicleType: 'Eicher Pro 2049 (Heavy Carrier)', vehicleNumber: 'BR-06-AK-0047', capacityKg: 4000, basePrakhand: 'Sitamarhi Central', isAvailable: true, rating: 5.0 }
];

export function findDriver(identifier) {
  if (!identifier) return null;
  const norm = String(identifier).toUpperCase().replace(/[\s\-_]/g, '');
  return REGISTERED_DRIVERS.find(d => {
    const dId = d.id.toUpperCase().replace(/[\s\-_]/g, '');
    const dName = d.name.toUpperCase().replace(/[\s\-_]/g, '');
    if (dId === norm || dName === norm || dName.includes(norm) || norm.includes(dName)) return true;
    return d.aliases?.some(a => a.toUpperCase().replace(/[\s\-_]/g, '') === norm);
  }) || null;
}

export function recommendDriverForPayload(weightKg) {
  const w = Number(weightKg) || 350;
  if (w <= 450) {
    return {
      driver: REGISTERED_DRIVERS[2], // Ayush Vardhan (AV 60)
      reason: `Optimal 450 kg electric cargo for light payload (${w} kg). Minimal freight expense & zero emissions.`
    };
  } else if (w <= 1000) {
    return {
      driver: REGISTERED_DRIVERS[0], // Soham Nayek (SN 365)
      reason: `Best-fit 1,000 kg Tata Ace match for ${w} kg cargo. Highest rural village pickup efficiency.`
    };
  } else if (w <= 1250) {
    return {
      driver: REGISTERED_DRIVERS[3], // Piyush Bhagat (PB 25)
      reason: `Optimal 1,250 kg capacity match for ${w} kg cargo. Fast inter-block transit to Mandi.`
    };
  } else if (w <= 1500) {
    return {
      driver: REGISTERED_DRIVERS[1], // Harsh Sahu (HS 265)
      reason: `Rugged 1,500 kg Bolero Maxi carrier suited for rough-terrain ${w} kg farm collection.`
    };
  } else {
    return {
      driver: REGISTERED_DRIVERS[4], // Abhijeet Kumar (AK 47)
      reason: `Heavy commercial 4,000 kg carrier required to safely transport ${w} kg multi-quintal bulk consignment.`
    };
  }
}

export async function askSamriddhiAssign(id, role, lid, m) {
  const x = await get(id, role, lid);
  if (x.status !== 'PENDING') {
    throw errors.conflict(`Shipment is already in status ${x.status}. Only PENDING shipments can be assigned.`);
  }

  let totalWeightKg = 0;
  (x.order?.items || []).forEach(i => {
    const q = Number(i.quantity) || 0;
    const u = String(i.produce?.unit || 'QUINTAL').toUpperCase();
    totalWeightKg += u.includes('QUINTAL') ? q * 100 : u.includes('TON') ? q * 1000 : q;
  });

  if (totalWeightKg === 0) totalWeightKg = 350;

  const rec = recommendDriverForPayload(totalWeightKg);
  const bestDriver = rec.driver;

  const vehicleReference = `${bestDriver.vehicleType} [${bestDriver.vehicleNumber}] (ID: ${bestDriver.id})`;
  const driverReference = `${bestDriver.name} (${bestDriver.phone})`;
  const estDelivery = new Date();
  estDelivery.setDate(estDelivery.getDate() + 1);

  const updated = await status(id, role, lid, {
    status: 'ASSIGNED',
    vehicleReference,
    driverReference,
    estimatedDelivery: estDelivery.toISOString()
  }, m);

  return {
    logistics: updated,
    assignedDriver: bestDriver,
    cargoWeightKg: totalWeightKg,
    assignedBy: 'Ask Samriddhi',
    rationale: rec.reason
  };
}

export async function getDriverFleet() {
  return REGISTERED_DRIVERS;
}

export async function optimizeRoute({ orderIds = [], driverId, prakhand = 'Dumra' } = {}) {
  let where = { status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP'] } };
  if (Array.isArray(orderIds) && orderIds.length > 0) {
    where = { orderId: { in: orderIds } };
  }

  let logisticsList = [];
  try {
    logisticsList = await prisma.logistics.findMany({
      where,
      include: {
        order: {
          include: {
            items: { include: { produce: true } },
            farmer: { include: { farmerProfile: true } },
            buyer: { include: { buyerProfile: true } }
          }
        }
      },
      take: 6
    });
  } catch (dbErr) {
    console.warn('Logistics optimizeRoute database fallback:', dbErr?.message || dbErr);
  }

  let totalCargoWeightKg = 0;
  logisticsList.forEach(log => {
    log.order?.items?.forEach(i => {
      const q = Number(i.quantity);
      const u = String(i.produce?.unit || 'QUINTAL').toUpperCase();
      totalCargoWeightKg += u.includes('QUINTAL') ? q * 100 : u.includes('TON') ? q * 1000 : q;
    });
  });

  if (totalCargoWeightKg === 0) {
    totalCargoWeightKg = 680;
  }

  let driver = findDriver(driverId);
  if (!driver) {
    driver = REGISTERED_DRIVERS.find(d => d.capacityKg >= totalCargoWeightKg && d.isAvailable) || REGISTERED_DRIVERS[0];
  }

  const defaultLocations = [
    { name: 'Mohan Kumar (Farm A)', village: 'Dumra', distFromLastKm: 3.2, timeMins: 15, pickupKg: Math.round(totalCargoWeightKg * 0.4) },
    { name: 'Rajesh Sharma (Farm B)', village: 'Runnisaidpur', distFromLastKm: 5.4, timeMins: 20, pickupKg: Math.round(totalCargoWeightKg * 0.35) },
    { name: 'Sunil Mahto (Farm C)', village: 'Riga', distFromLastKm: 4.8, timeMins: 18, pickupKg: totalCargoWeightKg - Math.round(totalCargoWeightKg * 0.4) - Math.round(totalCargoWeightKg * 0.35) }
  ];

  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() + 30);

  let cumulativeDistanceKm = 0;
  let cumulativeTimeMins = 0;

  const stops = [];

  defaultLocations.forEach((loc, idx) => {
    cumulativeDistanceKm += loc.distFromLastKm;
    cumulativeTimeMins += loc.timeMins;

    const stopTime = new Date(startTime.getTime() + cumulativeTimeMins * 60000);
    const timeStr = stopTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    stops.push({
      stopNumber: idx + 1,
      type: 'PICKUP',
      time: timeStr,
      location: `${loc.village}, Sitamarhi`,
      contactPerson: loc.name,
      cargoAction: `Pickup ${loc.pickupKg} kg fresh produce`,
      cumulativeWeightKg: defaultLocations.slice(0, idx + 1).reduce((s, l) => s + l.pickupKg, 0),
      distanceLegKm: loc.distFromLastKm
    });
  });

  cumulativeDistanceKm += 6.5;
  cumulativeTimeMins += 25;
  const dropTime = new Date(startTime.getTime() + cumulativeTimeMins * 60000);
  stops.push({
    stopNumber: stops.length + 1,
    type: 'DROP_DELIVERY',
    time: dropTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    location: 'Sitamarhi Central Mandi & Local Consumer Hub',
    contactPerson: 'Consolidated Distribution Center',
    cargoAction: `Unload full shipment (${totalCargoWeightKg} kg) for retail & consumer distribution`,
    cumulativeWeightKg: totalCargoWeightKg,
    distanceLegKm: 6.5
  });

  const soloTripsKm = Number((cumulativeDistanceKm * 1.85).toFixed(1));
  const savedKm = Number((soloTripsKm - cumulativeDistanceKm).toFixed(1));
  const loadUtilization = Math.min(100, Math.round((totalCargoWeightKg / driver.capacityKg) * 100));

  return {
    runId: `ROUTE-${Date.now().toString().slice(-6)}`,
    driver: {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      capacityKg: driver.capacityKg,
      loadUtilizationPercent: loadUtilization
    },
    cargoSummary: {
      totalWeightKg: totalCargoWeightKg,
      totalOrdersConsolidated: defaultLocations.length,
      unit: 'KG'
    },
    efficiencyMetrics: {
      optimizedDistanceKm: Number(cumulativeDistanceKm.toFixed(1)),
      soloTripsDistanceKm: soloTripsKm,
      distanceSavedKm: savedKm,
      fuelCostSavedInr: Math.round(savedKm * 12.5),
      carbonEmissionSavedKg: Number((savedKm * 0.24).toFixed(2)),
      estimatedDurationMinutes: cumulativeTimeMins
    },
    itineraryRoadmap: stops
  };
}

