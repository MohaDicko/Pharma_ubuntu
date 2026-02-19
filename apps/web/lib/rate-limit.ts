import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Stockage mémoire pour Dev local (inefficace sur serverless)
const memoryCache = new Map<string, number[]>();

// Configuration Upstash : Doit être définie dans Vercel
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Créer le limiteur si Redis est dispo
// 10 requêtes par fenêtre de 60s
let limiter: Ratelimit | null = null;

if (redis) {
    limiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        analytics: true,
        prefix: "@upstash/ratelimit",
    });
}

export async function rateLimit(identifier: string): Promise<boolean> {
    // 1. Priorité aux performances Serverless (Redis)
    if (limiter) {
        try {
            const { success } = await limiter.limit(identifier);
            return success;
        } catch (error) {
            console.error("RateLimit Error (Redis):", error);
            return true; // Fail open en cas de panne Redis
        }
    }

    // 2. Fallback Mémoire (Dev uniquement)
    // En production sur Vercel, sans Redis, chaque fonction lambda a sa propre mémoire -> Inefficace.
    if (process.env.NODE_ENV === 'production' && !process.env.UPSTASH_REDIS_REST_URL) {
        console.warn("⚠️ RateLimiter: Utilisation de la mémoire en Production ! Configurez UPSTASH_REDIS_REST_URL.");
    }

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute

    const timestamps = memoryCache.get(identifier) || [];
    const requestsInWindow = timestamps.filter(ts => ts > windowStart);

    if (requestsInWindow.length >= 10) {
        return false;
    }

    requestsInWindow.push(now);
    memoryCache.set(identifier, requestsInWindow);

    // Nettoyage périodique simple (pour éviter fuite mémoire en local long-running)
    if (memoryCache.size > 1000) {
        for (const [key, val] of memoryCache.entries()) {
            if (val.every(ts => ts < windowStart)) {
                memoryCache.delete(key);
            }
        }
    }

    return true;
}
