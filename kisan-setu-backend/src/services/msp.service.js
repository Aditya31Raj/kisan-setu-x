import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';

export async function checkCompliance({
  cropId,
  cropName: inputCropName,
  location = '',
  price,
  pricePerKg,
  unit = 'KG',
  transactionDate = new Date()
}) {
  let crop = null;
  if (cropId) {
    crop = await prisma.crop.findUnique({ where: { id: cropId } });
  }

  const cleanName = (inputCropName || crop?.name || '').trim();
  if (!crop && !cleanName) {
    return { applies: false, mspPrice: null, offeredPrice: Number(pricePerKg ?? price ?? 0), compliant: true };
  }

  // Convert offered price to per-kg baseline
  const rawPrice = Number(price ?? pricePerKg ?? 0);
  const normalizedUnit = String(unit || 'KG').toUpperCase();
  let effectivePricePerKg = rawPrice;

  if (normalizedUnit === 'QUINTAL') {
    effectivePricePerKg = rawPrice / 100;
  } else if (normalizedUnit === 'TONNE') {
    effectivePricePerKg = rawPrice / 1000;
  } else if (normalizedUnit === 'KG') {
    // If raw price looks like quintal rate (> 150 for grains/potatoes), keep safe check
    effectivePricePerKg = rawPrice;
  }

  // Find applicable MSP records by cropId or cropName substring
  const searchConditions = [];
  if (crop?.id) searchConditions.push({ cropId: crop.id });
  if (cleanName) {
    searchConditions.push({ cropName: { contains: cleanName, mode: 'insensitive' } });
    const firstWord = cleanName.split(/\s+/)[0];
    if (firstWord && firstWord.length >= 3) {
      searchConditions.push({ cropName: { contains: firstWord, mode: 'insensitive' } });
    }
  }

  const rows = await prisma.mSPRecord.findMany({
    where: {
      applies: true,
      effectiveFrom: { lte: transactionDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: transactionDate } }
      ],
      ...(searchConditions.length ? { OR: searchConditions } : {})
    },
    orderBy: { effectiveFrom: 'desc' }
  });

  const loc = (location || '').toLowerCase();
  const r = rows.find(x => (!x.state || loc.includes(x.state.toLowerCase())) && (!x.district || loc.includes(x.district.toLowerCase()))) || rows[0];

  if (!r) {
    return { applies: false, mspPrice: null, offeredPrice: rawPrice, compliant: true };
  }

  const mspRaw = Number(r.mspPrice);
  const mspUnit = String(r.unit || 'KG').toUpperCase();
  let mspPerKg = mspRaw;
  if (mspUnit === 'QUINTAL') mspPerKg = mspRaw / 100;
  else if (mspUnit === 'TONNE') mspPerKg = mspRaw / 1000;

  const isCompliant = effectivePricePerKg >= (mspPerKg - 0.05);

  return {
    applies: true,
    mspPrice: mspRaw,
    mspUnit: r.unit || 'KG',
    mspPerKg,
    effectivePricePerKg,
    offeredPrice: rawPrice,
    compliant: isCompliant,
    recordId: r.id
  };
}

export async function enforceListingCompliance(d) {
  const r = await checkCompliance(d);
  if (!r.applies || r.compliant) return r;
  const a = await prisma.governmentAlert.create({
    data: {
      type: 'MSP_VIOLATION',
      severity: 'HIGH',
      title: 'MSP compliance violation',
      message: 'Produce offered below applicable MSP',
      entity: 'ProduceListing',
      createdById: d.farmerId
    }
  });
  await recordAudit({
    userId: d.farmerId,
    role: 'FARMER',
    action: 'MSP_VIOLATION',
    entity: 'GovernmentAlert',
    entityId: a.id,
    requestId: d.requestId,
    ipAddress: d.ipAddress,
    metadata: {
      cropId: d.cropId,
      offeredPrice: r.offeredPrice,
      effectivePricePerKg: r.effectivePricePerKg,
      applicableMsp: r.mspPrice,
      mspUnit: r.mspUnit
    }
  });
  return { ...r, violation: true, alertId: a.id };
}
