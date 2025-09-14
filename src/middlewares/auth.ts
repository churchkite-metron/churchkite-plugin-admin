import { Request, Response, NextFunction } from 'express';

function parseBasicAuth(header?: string) {
    if (!header) return null;
    const [scheme, encoded] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'basic' || !encoded) return null;
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
}

export function basicAuthForSSR(req: Request, res: Response, next: NextFunction) {
    const hostHeader = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const host = String(hostHeader).toLowerCase();
    const prodHost = (process.env.PROD_HOST || '').toLowerCase();
    const envSaysProd = (process.env.CONTEXT === 'production') || (process.env.NODE_ENV === 'production');
    const isLocalHost = /localhost|127\.0\.0\.1/.test(host);
    const isNetlifyPreview = host.includes('--');
    const computedProd = prodHost ? host === prodHost : (!isLocalHost && !isNetlifyPreview);
    const isProd = envSaysProd || computedProd;
    if (!isProd) {
        return next();
    }
    const expectedUser = process.env.ADMIN_USER || '';
    const expectedPass = process.env.ADMIN_PASS || '';
    if (!expectedUser || !expectedPass) {
        return res.status(500).send('Admin credentials not configured');
    }
    const creds = parseBasicAuth(req.headers['authorization']);
    if (creds && creds.user === expectedUser && creds.pass === expectedPass) {
        return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="ChurchKite Admin"');
    return res.status(401).send('Authentication required');
}

// Keep placeholder token-based auth for API if needed later
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (token === `Bearer ${process.env.API_TOKEN}`) return next();
    return res.status(401).json({ message: 'Unauthorized' });
};