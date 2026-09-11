import crypto from 'node:crypto'; import {prisma} from '../config/database.js'; import {hashPassword,comparePassword} from '../utils/password.js'; import {errors} from '../utils/errors.js'; import {createSession,refreshSession,revokeRefreshToken} from './token.service.js'; import {verifyIdentity} from './identity.service.js'; import {recordAudit} from './audit.service.js';
const pub=u=>({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,isActive:u.isActive,isVerified:u.isVerified,lastLoginAt:u.lastLoginAt});
export async function register(d, m = {}){
  const email=d.email?.trim()||undefined;
  const phone=d.phone?.trim()||undefined;
  const where={OR:[...(email?[{email}]:[]),...(phone?[{phone}]:[])]};
  if(where.OR.length>0&&await prisma.user.findFirst({where}))throw errors.conflict('Email or phone already registered');
  const u=await prisma.user.create({
    data:{
      name:d.name.trim(),
      email,
      phone,
      passwordHash:await hashPassword(d.password),
      role:d.role,
      isVerified:false,
      farmerProfile:d.role==='FARMER'?{create:{}}:undefined,
      buyerProfile:d.role==='BUYER'?{create:{}}:undefined
    }
  });
  const kycRef = d.kycNumber || d.identityReference;
  const docType = d.kycType || (d.role === 'BUYER' ? 'GSTIN' : 'AADHAAR');
  if (kycRef) {
    const masked = kycRef.length > 4 
      ? `${docType}: ${'*'.repeat(Math.max(0, kycRef.length - 4))}${kycRef.slice(-4)}`
      : `${docType}: ${kycRef}`;
    await prisma.identityVerification.upsert({
      where: { userId: u.id },
      update: {
        status: 'PENDING',
        maskedIdentifier: masked,
        providerReference: `${docType}:${kycRef}`
      },
      create: {
        userId: u.id,
        provider: 'MOCK',
        status: 'PENDING',
        maskedIdentifier: masked,
        providerReference: `${docType}:${kycRef}`
      }
    });
  }
  await recordAudit({userId:u.id,role:u.role,action:'USER_REGISTERED',entity:'User',entityId:u.id,requestId:m?.requestId,ipAddress:m?.ipAddress});
  try {
    const { notifyAdmins } = await import('./notification.service.js');
    await notifyAdmins({
      title: `New ${u.role === 'FARMER' ? 'Farmer' : 'Buyer'} Registration - KYC Pending`,
      message: `${u.name} registered and requires KYC authorization (${docType}: ${kycRef || 'Submitted'}).`,
      metadata: { userId: u.id, role: u.role, kycType: docType, kycNumber: kycRef }
    });
  } catch (notifyErr) {
    console.warn('Could not dispatch admin KYC notification:', notifyErr?.message || notifyErr);
  }
  return {user:pub(u),...(await createSession(u,m))};
}
export async function login(d,m){const u=await prisma.user.findFirst({where:{OR:[{email:d.identifier},{phone:d.identifier}]}});if(!u||!u.isActive||!(await comparePassword(d.password,u.passwordHash))){await recordAudit({action:'LOGIN_FAILED',entity:'User',requestId:m.requestId,ipAddress:m.ipAddress});throw errors.unauthorized('Invalid credentials')}const x=await prisma.user.update({where:{id:u.id},data:{lastLoginAt:new Date()}});await recordAudit({userId:u.id,role:u.role,action:'LOGIN_SUCCESS',entity:'User',entityId:u.id,requestId:m.requestId,ipAddress:m.ipAddress});return{user:pub(x),...(await createSession(x,m))}}
export const refresh=(raw,m)=>refreshSession(raw,m); export const logout=raw=>revokeRefreshToken(raw);
export async function me(id){const u=await prisma.user.findUnique({where:{id},include:{farmerProfile:true,buyerProfile:true,adminProfile:true,identity:true}});if(!u)throw errors.notFound('User not found');return{...pub(u),profile:u.farmerProfile||u.buyerProfile||u.adminProfile||null,identity:u.identity?{status:u.identity.status,maskedIdentifier:u.identity.maskedIdentifier,verifiedAt:u.identity.verifiedAt}:null}}
export async function changePassword(id,current,next,m){const u=await prisma.user.findUnique({where:{id}});if(!u||!(await comparePassword(current,u.passwordHash)))throw errors.unauthorized('Current password is incorrect');await prisma.$transaction([prisma.user.update({where:{id},data:{passwordHash:await hashPassword(next)}}),prisma.refreshToken.updateMany({where:{userId:id,revokedAt:null},data:{revokedAt:new Date()}})]);await recordAudit({userId:id,role:u.role,action:'PASSWORD_CHANGED',entity:'User',entityId:id,requestId:m.requestId,ipAddress:m.ipAddress})}
export async function forgotPassword(identifier,m){const u=await prisma.user.findFirst({where:{OR:[{email:identifier},{phone:identifier}]}});if(!u)return{accepted:true};const raw=crypto.randomBytes(32).toString('hex');await prisma.passwordResetToken.create({data:{userId:u.id,tokenHash:crypto.createHash('sha256').update(raw).digest('hex'),expiresAt:new Date(Date.now()+15*60*1000)}});await recordAudit({userId:u.id,role:u.role,action:'PASSWORD_RESET_REQUESTED',entity:'User',entityId:u.id,requestId:m.requestId,ipAddress:m.ipAddress});return{accepted:true,demoResetToken:process.env.NODE_ENV==='production'?undefined:raw}}
export async function resetPassword(raw,next){const h=crypto.createHash('sha256').update(raw).digest('hex');const row=await prisma.passwordResetToken.findUnique({where:{tokenHash:h}});if(!row||row.usedAt||row.expiresAt<=new Date())throw errors.badRequest('Invalid or expired reset token');await prisma.$transaction([prisma.user.update({where:{id:row.userId},data:{passwordHash:await hashPassword(next)}}),prisma.passwordResetToken.update({where:{id:row.id},data:{usedAt:new Date()}}),prisma.refreshToken.updateMany({where:{userId:row.userId,revokedAt:null},data:{revokedAt:new Date()}})])}
