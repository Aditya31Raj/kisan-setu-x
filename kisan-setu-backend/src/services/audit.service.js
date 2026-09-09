import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

export const recordAudit = async ({
  userId,
  role,
  action,
  entity,
  entityId,
  requestId,
  ipAddress,
  metadata
} = {}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        role: role || undefined,
        action: action || 'UNKNOWN',
        entity: entity || 'General',
        entityId: entityId || undefined,
        requestId: requestId || undefined,
        ipAddress: ipAddress || undefined,
        metadata: metadata || undefined
      }
    });
  } catch (err) {
    logger.warn({ err: err?.message, action, entity }, 'Audit log recording failed (non-fatal)');
    return null;
  }
};

