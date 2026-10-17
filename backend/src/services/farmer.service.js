import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

export const profile = async (id) => {
  let p = await prisma.farmerProfile.findUnique({
    where: { userId: id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isVerified: true, role: true } },
      crops: { where: { deletedAt: null } }
    }
  });

  if (!p) {
    const u = await prisma.user.findUnique({ where: { id } });
    if (u && u.role === 'FARMER') {
      p = await prisma.farmerProfile.create({
        data: { userId: id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isVerified: true, role: true } },
          crops: true
        }
      });
    } else {
      throw errors.notFound('Farmer profile not found');
    }
  }

  return {
    ...p,
    name: p.user?.name,
    email: p.user?.email,
    phone: p.user?.phone,
    isVerified: p.user?.isVerified
  };
};

export const update = async (id, d) => {
  if (d.name) {
    await prisma.user.update({
      where: { id },
      data: { name: d.name.trim() }
    }).catch(() => {});
  }
  const { name, ...profileData } = d;
  return prisma.farmerProfile.update({
    where: { userId: id },
    data: profileData
  });
};

export async function dashboard(id) {
  const [a, b, c, d, e, f] = await Promise.all([
    prisma.produceListing.aggregate({
      where: { farmerId: id, deletedAt: null },
      _count: true,
      _sum: { availableQuantity: true, soldQuantity: true }
    }),
    prisma.order.count({ where: { farmerId: id, status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] } } }),
    prisma.payment.aggregate({ where: { order: { farmerId: id }, status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { order: { farmerId: id }, status: 'PENDING' } }),
    prisma.inputRequest.count({ where: { farmerId: id, status: 'PENDING' } }),
    prisma.grievance.count({ where: { createdById: id, status: { in: ['OPEN', 'IN_REVIEW'] } } })
  ]);
  return {
    totalProduceListings: a._count,
    availableQuantity: a._sum.availableQuantity || 0,
    soldQuantity: a._sum.soldQuantity || 0,
    activeOrders: b,
    totalEarnings: c._sum.amount || 0,
    pendingPayments: d,
    pendingInputRequests: e,
    openComplaints: f
  };
}
