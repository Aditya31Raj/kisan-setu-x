import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';

// Statutory Minimum Support Price (MSP) fixed across Kisan Setu
export const STATUTORY_MSP_PER_KG = 12; // ₹12.00 per kg
export const STATUTORY_MSP_PER_QUINTAL = 1200; // ₹1,200.00 per Quintal (100 kg * ₹12)
export const STATUTORY_MSP_PER_TONNE = 12000; // ₹12,000.00 per Tonne

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
    try {
      crop = await prisma.crop.findUnique({ where: { id: cropId } });
    } catch (e) {
      console.warn('Crop lookup fallback in checkCompliance:', e?.message || e);
    }
  }

  const cleanName = (inputCropName || crop?.name || '').trim();

  // Convert offered price to per-kg baseline
  const rawPrice = Number(price ?? pricePerKg ?? 0);
  const normalizedUnit = String(unit || 'KG').toUpperCase();
  let effectivePricePerKg = rawPrice;

  if (normalizedUnit === 'QUINTAL') {
    effectivePricePerKg = rawPrice / 100;
  } else if (normalizedUnit === 'TONNE' || normalizedUnit === 'TON') {
    effectivePricePerKg = rawPrice / 1000;
  } else if (normalizedUnit === 'KG') {
    effectivePricePerKg = rawPrice;
  }

  // Statutory MSP is fixed for each produce at ₹12/kg (₹1,200/Quintal)
  const mspPerKg = STATUTORY_MSP_PER_KG;
  const mspPrice = normalizedUnit === 'QUINTAL'
    ? STATUTORY_MSP_PER_QUINTAL
    : (normalizedUnit === 'TONNE' || normalizedUnit === 'TON')
    ? STATUTORY_MSP_PER_TONNE
    : STATUTORY_MSP_PER_KG;
  const mspUnit = normalizedUnit === 'QUINTAL' ? 'QUINTAL' : (normalizedUnit === 'TONNE' || normalizedUnit === 'TON') ? 'TONNE' : 'KG';

  // Compliance check: effective price per kg must be >= 12 rs/kg
  const isCompliant = effectivePricePerKg >= (mspPerKg - 0.05);
  const deficitPerKg = isCompliant ? 0 : Number((mspPerKg - effectivePricePerKg).toFixed(2));
  const deficitPercent = isCompliant ? 0 : Number(((deficitPerKg / mspPerKg) * 100).toFixed(1));

  return {
    applies: true,
    mspPrice,
    mspUnit,
    mspPerKg,
    effectivePricePerKg,
    offeredPrice: rawPrice,
    compliant: isCompliant,
    deficitPerKg,
    deficitPercent,
    cropName: cleanName || crop?.name || 'Produce'
  };
}

export async function enforceListingCompliance(d) {
  const r = await checkCompliance(d);
  if (!r.applies || r.compliant) return r;

  // Retrieve farmer details if available
  let farmer = null;
  if (d.farmerId) {
    try {
      farmer = await prisma.user.findUnique({
        where: { id: d.farmerId },
        include: { farmerProfile: true }
      });
    } catch (e) {
      console.warn('Could not fetch farmer for alert:', e?.message || e);
    }
  }

  const farmerName = farmer?.name || d.farmerName || 'Registered Farmer';
  const farmerPhone = farmer?.phone || d.farmerPhone || 'N/A';
  const village = farmer?.farmerProfile?.village || d.location || 'Sitamarhi Block';
  const cropTitle = d.cropName || d.title || r.cropName || 'Agricultural Produce';
  const deficit = r.deficitPerKg || Number((r.mspPerKg - r.effectivePricePerKg).toFixed(2));
  const deficitQuintal = Number((deficit * 100).toFixed(2));

  const alertTitle = `🚨 Critical Below-MSP Alert: ${cropTitle} Listed Below ₹12/kg`;
  const alertMessage = `Produce "${cropTitle}" was listed at ₹${r.effectivePricePerKg.toFixed(2)}/kg (₹${(r.effectivePricePerKg * 100).toFixed(2)}/Quintal), which is ₹${deficit.toFixed(2)}/kg (₹${deficitQuintal}/Q) below the fixed statutory MSP floor of ₹12.00/kg (Deficit: ${r.deficitPercent}%). Farmer: ${farmerName} (Phone: ${farmerPhone}, Village/Location: ${village}). Immediate Block Admin intervention required to prevent distress sale and ensure fair farmer price protection.`;

  let alertRecord = null;
  try {
    alertRecord = await prisma.governmentAlert.create({
      data: {
        type: 'MSP_VIOLATION',
        severity: 'CRITICAL',
        title: alertTitle,
        message: alertMessage,
        entity: 'ProduceListing',
        entityId: d.cropId || d.produceId,
        createdById: d.farmerId
      }
    });

    // Notify all Prakhand Admins and Super Admins in app
    const admins = await prisma.user.findMany({
      where: { role: { in: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    for (const adm of admins) {
      await prisma.notification.create({
        data: {
          userId: adm.id,
          type: 'IN_APP',
          title: alertTitle,
          message: alertMessage,
          metadata: {
            alertType: 'MSP_VIOLATION',
            cropName: cropTitle,
            offeredPricePerKg: r.effectivePricePerKg,
            statutoryMspPerKg: r.mspPerKg,
            deficitPerKg: deficit,
            farmerId: d.farmerId,
            farmerName,
            farmerPhone,
            location: village
          }
        }
      });
    }
  } catch (err) {
    console.warn('Alert creation database fallback:', err?.message || err);
  }

  try {
    await recordAudit({
      userId: d.farmerId,
      role: 'FARMER',
      action: 'MSP_VIOLATION',
      entity: 'GovernmentAlert',
      entityId: alertRecord?.id,
      requestId: d.requestId,
      ipAddress: d.ipAddress,
      metadata: {
        cropId: d.cropId,
        cropName: cropTitle,
        offeredPrice: r.offeredPrice,
        effectivePricePerKg: r.effectivePricePerKg,
        statutoryMspPerKg: r.mspPerKg,
        deficitPerKg: deficit,
        farmerName,
        farmerPhone,
        location: village
      }
    });
  } catch (auditErr) {
    console.warn('Audit record warning:', auditErr?.message || auditErr);
  }

  return {
    ...r,
    violation: true,
    alertId: alertRecord?.id,
    alertTitle,
    alertMessage,
    farmerDetails: {
      name: farmerName,
      phone: farmerPhone,
      location: village
    }
  };
}
