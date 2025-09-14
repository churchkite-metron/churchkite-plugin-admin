import { Request, Response } from 'express';
import { Readable } from 'stream';
import { getUpdate, saveUpdate } from '../services/updates.service';
import { hasAsset, getAssetBuffer, saveAssetVersion } from '../services/assets.service';
import crypto from 'crypto';

function pubKeyOk(req: Request) {
    const expected = process.env.PUBLISH_API_KEY || '';
    const provided = req.header('x-publish-key') || '';
    return Boolean(expected) && provided === expected;
}

export async function postPublish(req: Request, res: Response) {
    try {
        if (!pubKeyOk(req)) return res.status(401).json({ error: 'unauthorized' });
        const { slug, version, url, changelog, assetApiUrl } = req.body || {};
        if (!slug || !version || !assetApiUrl) return res.status(400).json({ error: 'slug, version, assetApiUrl required' });
        const meta = await saveUpdate({ slug, version, url: url || '', changelog, assetApiUrl, createdAt: new Date().toISOString() });
        res.json({ ok: true, meta });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to publish', detail: e?.message });
    }
}

export async function getCheck(req: Request, res: Response) {
    try {
        const slug = String(req.query.slug || '');
        if (!slug) return res.status(400).json({ error: 'slug required' });
        const meta = await getUpdate(slug);
        if (!meta) return res.status(404).json({ error: 'not found' });
        const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
        const proto = (req.headers['x-forwarded-proto'] as string) || (req.protocol || 'https');
        const base = process.env.SITE_BASE_URL || (host ? `${proto}://${host}` : '');
        const download = `${base}/api/updates/download?slug=${encodeURIComponent(slug)}`;
        res.json({ slug, version: meta.version, url: meta.url, changelog: meta.changelog, download });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to check', detail: e?.message });
    }
}

export async function getDownload(req: Request, res: Response) {
    try {
        const slug = String(req.query.slug || '');
        if (!slug) return res.status(400).send('slug required');
        const meta = await getUpdate(slug);
        if (!meta?.version) return res.status(404).send('not found');
        // Buffer path with explicit Content-Length; serverless-http will return in binary mode
        const buf = await getAssetBuffer(slug);
        if (!buf) return res.status(404).send('asset not found');
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);
        if (meta.sha256) res.setHeader('X-Expected-SHA256', meta.sha256);
        res.end(buf);
    } catch (e: any) {
        res.status(500).send('download failed');
    }
}

export async function postUpload(req: Request, res: Response) {
    try {
        if (!pubKeyOk(req)) return res.status(401).json({ error: 'unauthorized' });
        const contentType = req.headers['content-type'] || '';
        let slug = String(req.query.slug || '');
        let version = String(req.query.version || '');
        let buf: Buffer | null = null;
        if (typeof contentType === 'string' && contentType.includes('application/json')) {
            const b: any = (req as any).body;
            const dataB64: string | undefined = b?.dataB64 || b?.data || undefined;
            slug = slug || String(b?.slug || '');
            version = version || String(b?.version || '');
            if (!slug || !version || !dataB64) return res.status(400).json({ error: 'slug, version, dataB64 required' });
            try {
                // Ensure clean base64 string and proper binary decode
                const cleanB64 = dataB64.replace(/\s/g, '');
                buf = Buffer.from(cleanB64, 'base64');
                if (buf.length === 0) throw new Error('empty buffer');
            } catch (e) {
                return res.status(400).json({ error: 'invalid base64: ' + (e as Error).message });
            }
        } else {
            // raw body expected (application/zip or octet-stream)
            const isZip = typeof contentType === 'string' && (contentType.includes('application/zip') || contentType.includes('application/octet-stream'));
            const body: any = (req as any).body;
            if (!body || !isZip) return res.status(400).json({ error: 'zip body required' });
            buf = Buffer.isBuffer(body) ? body : Buffer.from(body as any);
        }
        if (!slug) return res.status(400).json({ error: 'slug required' });
        if (!buf) return res.status(400).json({ error: 'no valid data received' });
        await saveAssetVersion(slug, version || 'latest', buf, 'application/zip');
        // Verify round-trip integrity by reading back the versioned asset
        try {
            const { getVersionedAssetBuffer } = await import('../services/assets.service');
            const back = await getVersionedAssetBuffer(slug, version || 'latest');
            const s1 = crypto.createHash('sha256').update(buf).digest('hex');
            const s2 = back ? crypto.createHash('sha256').update(back).digest('hex') : '';
            if (!back || s1 !== s2) {
                return res.status(500).json({ error: 'stored asset verification failed', got: back ? back.length : 0 });
            }
        } catch (_) { }
        const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
        if (version) {
            const existing = await getUpdate(slug);
            if (existing) await saveUpdate({ ...existing, version, sha256 });
        }
        res.json({ ok: true });
    } catch (e: any) {
        res.status(500).json({ error: 'upload failed', detail: e?.message });
    }
}
