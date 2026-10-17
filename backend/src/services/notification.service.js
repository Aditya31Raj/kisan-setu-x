import {prisma} from '../config/database.js';
import {NotificationProvider} from '../providers/notification/notificationProvider.js';

const provider = new NotificationProvider();

export async function notifyUser({userId, title, message, type='IN_APP', metadata={}}) {
  const u = await prisma.user.findUnique({where: {id: userId}, select: {email: true, phone: true}});
  if (!u) return null;
  await provider.send({type, recipient: type === 'EMAIL' ? u.email : u.phone, title, message});
  return prisma.notification.create({data: {userId, type, title, message, metadata}});
}

export async function notifyAdmins({title, message, metadata={}}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['PRAKHAND_ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });
    return Promise.all(admins.map(a => notifyUser({ userId: a.id, title, message, type: 'IN_APP', metadata })));
  } catch (err) {
    console.warn('Could not notify admins:', err?.message || err);
    return [];
  }
}

