import {z} from 'zod';
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v.toLowerCase() : undefined)),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))
      .refine((v) => !v || /^[6-9]\d{9}$/.test(v), {
        message: 'Mobile number must be a valid 10-digit Indian number (e.g. 9876543210)'
      })
      .optional()
      .or(z.literal(''))
      .transform((v) => v || undefined),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    role: z.enum(['FARMER', 'BUYER']),
    identityReference: z.string().max(100).optional(),
    kycType: z.string().max(50).optional(),
    kycNumber: z.string().max(100).optional()
  })
  .refine((v) => Boolean(v.email || v.phone), {
    message: 'Either email or mobile number is required'
  });
export const loginSchema=z.object({identifier:z.string().min(3).max(150),password:z.string().min(8).max(128)});
export const changePasswordSchema=z.object({currentPassword:z.string().min(8),newPassword:z.string().min(8).max(128)});
export const forgotSchema=z.object({identifier:z.string().min(3).max(150)}); export const resetSchema=z.object({resetToken:z.string().min(20),newPassword:z.string().min(8).max(128)});
export const cropSchema=z.object({name:z.string().min(2).max(100),variety:z.string().max(100).optional(),areaAcres:z.coerce.number().positive().optional(),season:z.string().max(50).optional()}); export const cropUpdateSchema=cropSchema.partial();
export const produceSchema=z.object({cropId:z.string().uuid(),title:z.string().min(2).max(150),description:z.string().max(1000).optional(),location:z.string().min(2).max(150),unit:z.string().max(10).default('KG'),availableQuantity:z.coerce.number().positive(),pricePerUnit:z.coerce.number().positive()}); export const produceUpdateSchema=produceSchema.partial(); export const produceQuerySchema=z.object({q:z.string().max(100).optional(),cropId:z.string().uuid().optional(),location:z.string().max(100).optional(),minPrice:z.coerce.number().nonnegative().optional(),maxPrice:z.coerce.number().nonnegative().optional(),availableOnly:z.enum(['true','false']).optional(),page:z.coerce.number().int().positive().optional(),limit:z.coerce.number().int().positive().max(100).optional()});
export const orderSchema=z.object({produceId:z.string().uuid(),quantity:z.coerce.number().positive()}); export const orderStatusSchema=z.object({status:z.enum(['ACCEPTED','REJECTED','CANCELLED'])});
export const paymentSchema=z.object({orderId:z.string().uuid(),idempotencyKey:z.string().min(8).max(200)}); export const paymentVerifySchema=z.object({providerPaymentId:z.string().min(3),success:z.boolean()});
export const inputSchema=z.object({inputProductId:z.string().uuid(),quantity:z.coerce.number().positive(),reason:z.string().max(1000).optional()}); export const inputReviewSchema=z.object({note:z.string().max(1000).optional()}); export const inputProductSchema=z.object({name:z.string().min(2),category:z.string().min(2),unit:z.string().min(1),stock:z.coerce.number().nonnegative()});
export const grievanceSchema=z.object({category:z.string().min(2).max(80),subject:z.string().min(2).max(200),description:z.string().min(10).max(5000),orderId:z.string().uuid().optional(),priority:z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM')}); export const grievanceResolveSchema=z.object({resolution:z.string().min(3).max(5000),status:z.enum(['RESOLVED','REJECTED']).default('RESOLVED')});
export const disputeSchema=z.object({orderId:z.string().min(3).max(100),reason:z.string().min(5).max(5000),evidence:z.record(z.string(),z.any()).optional()}); export const disputeResolveSchema=z.object({resolution:z.string().min(3),status:z.enum(['RESOLVED','REJECTED'])});
export const mspSchema=z.object({cropId:z.string().uuid(),cropName:z.string().min(2),season:z.string().optional(),state:z.string().optional(),district:z.string().optional(),mspPrice:z.coerce.number().positive(),unit:z.string().default('KG'),effectiveFrom:z.coerce.date(),effectiveTo:z.coerce.date().optional(),applies:z.boolean().default(true),source:z.string().optional()}); export const mspCheckSchema=z.object({cropId:z.string().uuid(),location:z.string().min(2),pricePerKg:z.coerce.number().positive(),transactionDate:z.coerce.date().optional()});
