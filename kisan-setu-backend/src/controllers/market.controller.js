import * as s from '../services/market.service.js';
import { success } from '../utils/response.js';

export async function getMarketIntelligence(req, res, next) {
  try {
    const { crop = 'potato', location = 'all' } = req.query;
    const data = await s.getMarketIntelligence({ cropName: crop, location });
    return success(res, data);
  } catch (err) {
    next(err);
  }
}
