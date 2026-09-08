import {errors} from '../utils/errors.js'; export const notFound=(req,_res,next)=>next(errors.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
