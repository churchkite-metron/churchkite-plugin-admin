import { Request } from 'express';

export function isProductionRequest(req: Request): boolean {
    const hostHeader = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const host = String(hostHeader).toLowerCase();
    const prodHost = (process.env.PROD_HOST || '').toLowerCase();
    const envSaysProd = (process.env.CONTEXT === 'production') || (process.env.NODE_ENV === 'production');
    const isLocalHost = /localhost|127\.0\.0\.1/.test(host);
    if (prodHost) return host === prodHost;
    if (isLocalHost) return false;
    // Treat any non-local host as production (includes branch/deploy-preview)
    return envSaysProd || true;
}