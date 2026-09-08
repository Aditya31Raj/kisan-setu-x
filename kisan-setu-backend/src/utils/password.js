import bcrypt from 'bcrypt'; import {env} from '../config/env.js'; export const hashPassword=p=>bcrypt.hash(p,env.BCRYPT_ROUNDS); export const comparePassword=(p,h)=>bcrypt.compare(p,h);
