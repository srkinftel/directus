import { RequestHandler } from 'express';
import cache from '../cache';
import env from '../env';
import asyncHandler from '../utils/async-handler';
import { getCacheControlHeader } from '../utils/get-cache-headers';
import { getCacheKey } from '../utils/get-cache-key';

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	if (req.method.toLowerCase() !== 'get') return next();
	if (env.CACHE_ENABLED !== true) return next();
	if (!cache) return next();

	if (req.headers['cache-control']?.includes('no-store') || req.headers['Cache-Control']?.includes('no-store')) {
		return next();
	}

	const key = getCacheKey(req);
	const cachedData = await cache.get(key);

	if (cachedData) {
		const cacheExpiryDate = (await cache.get(`${key}__expires_at`)) as number | null;
		const cacheTTL = cacheExpiryDate ? cacheExpiryDate - Date.now() : null;

		res.setHeader('Cache-Control', getCacheControlHeader(req, cacheTTL));
		res.setHeader('Vary', 'Origin, Cache-Control');

		return res.json(cachedData);
	} else {
		return next();
	}
});

export default checkCacheMiddleware;
