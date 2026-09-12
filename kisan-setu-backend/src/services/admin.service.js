import {prisma} from '../config/database.js';
import {parsePagination,paginationMeta} from '../utils/pagination.js';

export async function dashboard(){
  const[a,b,c,d,e,f,g,h,i]=await Promise.all([
    prisma.user.count({where:{role:'FARMER',isActive:true}}),
    prisma.user.count({where:{role:'BUYER',isActive:true}}),
    prisma.order.count(),
    prisma.produceListing.count({where:{deletedAt:null}}),
    prisma.payment.aggregate({where:{status:'SUCCESS'},_sum:{amount:true}}),
    prisma.governmentAlert.count({where:{type:'MSP_VIOLATION'}}),
    prisma.payment.count({where:{status:'PENDING'}}),
    prisma.grievance.count({where:{status:{in:['OPEN','IN_REVIEW']}}}),
    prisma.governmentAlert.count({where:{resolvedAt:null}})
  ]);
  return{
    totalFarmers:a,
    totalBuyers:b,
    totalTransactions:c,
    totalProduce:d,
    tradeValue:e._sum.amount||0,
    belowMspTransactions:f,
    mspCompliancePercentage:Number((100-(f/Math.max(c,1))*100).toFixed(2)),
    pendingPayments:g,
    openGrievances:h,
    alerts:i
  };
}

export async function users(role,q={}){
  const{page,limit,skip}=parsePagination(q);
  const where=role?{role}:{};
  const[a,total]=await prisma.$transaction([
    prisma.user.findMany({
      where,
      select:{
        id:true,name:true,email:true,phone:true,role:true,isActive:true,isVerified:true,createdAt:true,lastLoginAt:true,
        farmerProfile:{select:{id:true,farmName:true,village:true,district:true,state:true,landAreaAcres:true,bankAccountLast4:true,crops:{select:{id:true,name:true,variety:true,season:true,areaAcres:true}}}},
        buyerProfile:{select:{id:true,businessName:true,businessType:true,district:true,state:true}},
        addresses:{select:{id:true,label:true,line1:true,line2:true,village:true,district:true,state:true,postalCode:true}},
        identity:{select:{id:true,status:true,maskedIdentifier:true,providerReference:true,verifiedAt:true}}
      },
      orderBy:{createdAt:'desc'},
      skip,
      take:limit
    }),
    prisma.user.count({where})
  ]);
  return{items:a,pagination:paginationMeta(page,limit,total)};
}

export const alerts=()=>prisma.governmentAlert.findMany({where:{resolvedAt:null},orderBy:{createdAt:'desc'},take:200});

export async function audits(q={}){
  const{page,limit,skip}=parsePagination(q);
  const[a,total]=await prisma.$transaction([
    prisma.auditLog.findMany({orderBy:{createdAt:'desc'},skip,take:limit}),
    prisma.auditLog.count()
  ]);
  return{items:a,pagination:paginationMeta(page,limit,total)};
}

export async function updateUser(id, d) {
  const updatedUser = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id },
      data: {
        ...(typeof d.isActive === 'boolean' ? { isActive: d.isActive } : {}),
        ...(typeof d.isVerified === 'boolean' ? { isVerified: d.isVerified } : {})
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, isVerified: true }
    });
    if (typeof d.isVerified === 'boolean') {
      await tx.identityVerification.upsert({
        where: { userId: id },
        update: {
          status: d.isVerified ? 'VERIFIED' : 'FAILED',
          verifiedAt: d.isVerified ? new Date() : null
        },
        create: {
          userId: id,
          provider: 'MOCK',
          status: d.isVerified ? 'VERIFIED' : 'FAILED',
          verifiedAt: d.isVerified ? new Date() : null
        }
      });
    }
    return u;
  });

  if (typeof d.isVerified === 'boolean') {
    try {
      const { notifyUser } = await import('./notification.service.js');
      await notifyUser({
        userId: id,
        title: d.isVerified ? 'KYC Verification Approved' : 'KYC Verification Status Updated',
        message: d.isVerified
          ? 'Your KYC documents have been reviewed and approved by the Block Admin. Your account is now fully authorized for trading and government services.'
          : 'Your KYC verification request could not be approved at this time. Please contact your Block Agriculture Office or re-submit valid documentation.',
        metadata: { isVerified: d.isVerified }
      });
    } catch (e) {
      console.warn('Could not dispatch user KYC status notification:', e?.message || e);
    }
  }

  return updatedUser;
}

