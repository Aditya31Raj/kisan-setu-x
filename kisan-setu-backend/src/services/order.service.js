import {prisma} from '../config/database.js'; import {errors} from '../utils/errors.js'; import {recordAudit} from './audit.service.js'; import {notifyUser} from './notification.service.js'; import {parsePagination,paginationMeta} from '../utils/pagination.js';
const transitions={PENDING_FARMER:['ACCEPTED','REJECTED'],ACCEPTED:['PAYMENT_PENDING','CANCELLED'],PAYMENT_PENDING:['PAID','CANCELLED'],PAID:['LOGISTICS_PENDING','CANCELLED','DISPUTED'],LOGISTICS_PENDING:['IN_TRANSIT','CANCELLED'],IN_TRANSIT:['DELIVERED','DISPUTED'],DELIVERED:['COMPLETED','DISPUTED'],DISPUTED:['COMPLETED']};
export async function create(buyerId,{produceId,quantity},m = {}){const q=Number(quantity);const order=await prisma.$transaction(async tx=>{const l=await tx.produceListing.findFirst({where:{id:produceId,status:{in:['LISTED','RESERVED']},deletedAt:null}});if(!l)throw errors.notFound('Produce listing not available');const r=await tx.produceListing.updateMany({where:{id:produceId,availableQuantity:{gte:q},deletedAt:null},data:{availableQuantity:{decrement:q},reservedQuantity:{increment:q},status:'RESERVED'}});if(r.count!==1)throw errors.conflict('Quantity changed; retry');const total=q*Number(l.pricePerUnit);const o=await tx.order.create({data:{orderNumber:`KS-${Date.now()}-${Math.floor(Math.random()*10000)}`,buyerId,farmerId:l.farmerId,status:['PRAKHAND_ADMIN','SUPER_ADMIN'].includes(m?.role)?'ACCEPTED':'PENDING_FARMER',acceptedAt:['PRAKHAND_ADMIN','SUPER_ADMIN'].includes(m?.role)?new Date():undefined,subtotal:total,totalAmount:total,items:{create:{produceId,quantity:q,unitPrice:l.pricePerUnit,lineTotal:total}}},include:{items:true}});await tx.auditLog.create({data:{userId:buyerId,role:m?.role||'BUYER',action:'ORDER_CREATED',entity:'Order',entityId:o.id,requestId:m?.requestId,ipAddress:m?.ip||m?.ipAddress,metadata:{quantity:q}}});return o});await notifyUser({userId:order.farmerId,title:['PRAKHAND_ADMIN','SUPER_ADMIN'].includes(m?.role)?'Government Block Procurement Order':'New purchase request',message:['PRAKHAND_ADMIN','SUPER_ADMIN'].includes(m?.role)?`The Prakhand Agriculture Office has issued a Block Procurement order for ${order.items[0].quantity} units at guaranteed MSP.`: `A buyer requested ${order.items[0].quantity} units.`,metadata:{orderId:order.id}});return order}
export async function list(userId,role,q){
  const{page,limit,skip}=parsePagination(q);
  const where=['PRAKHAND_ADMIN','SUPER_ADMIN'].includes(role)?{}:role==='BUYER'?{buyerId:userId}:{farmerId:userId};
  const[a,total]=await prisma.$transaction([
    prisma.order.findMany({
      where,
      include:{
        items:{include:{produce:{include:{crop:true}}}},
        buyer:{select:{id:true,name:true,phone:true,email:true,buyerProfile:true}},
        farmer:{select:{id:true,name:true,phone:true,email:true,farmerProfile:true}},
        payments:true,
        logistics:true
      },
      orderBy:{createdAt:'desc'},
      skip,
      take:limit
    }),
    prisma.order.count({where})
  ]);
  return{items:a,pagination:paginationMeta(page,limit,total)}
}

export async function get(userId,role,id){
  const where=['PRAKHAND_ADMIN','SUPER_ADMIN'].includes(role)?{id}:role==='BUYER'?{id,buyerId:userId}:{id,farmerId:userId};
  const o=await prisma.order.findFirst({
    where,
    include:{
      items:{include:{produce:{include:{crop:true}}}},
      buyer:{select:{id:true,name:true,phone:true,email:true,buyerProfile:true}},
      farmer:{select:{id:true,name:true,phone:true,email:true,farmerProfile:true}},
      payments:true,
      logistics:true
    }
  });
  if(!o)throw errors.notFound('Order not found');
  return o
}

export async function status(userId,role,id,next,m){const o=await prisma.order.findUnique({where:{id},include:{items:true}});if(!o)throw errors.notFound('Order not found');if(role==='FARMER'&&o.farmerId!==userId)throw errors.forbidden();if(role==='BUYER'&&o.buyerId!==userId)throw errors.forbidden();if(role==='FARMER'&&!['ACCEPTED','REJECTED'].includes(next))throw errors.forbidden();if(role==='BUYER'&&next!=='CANCELLED')throw errors.forbidden();if(!transitions[o.status]?.includes(next))throw errors.conflict(`Invalid order transition ${o.status} -> ${next}`);return prisma.$transaction(async tx=>{if(next==='REJECTED'||next==='CANCELLED')for(const i of o.items){const q=Number(i.quantity);const r=await tx.produceListing.updateMany({where:{id:i.produceId,reservedQuantity:{gte:q}},data:{availableQuantity:{increment:q},reservedQuantity:{decrement:q},status:'LISTED'}});if(r.count!==1)throw errors.conflict('Inventory reservation could not be released')}const x=await tx.order.update({where:{id},data:{status:next,acceptedAt:next==='ACCEPTED'?new Date():undefined,cancelledAt:['CANCELLED','REJECTED'].includes(next)?new Date():undefined}});await tx.auditLog.create({data:{userId,role,action:`ORDER_${next}`,entity:'Order',entityId:id,requestId:m.requestId,ipAddress:m.ip}});return x})}
