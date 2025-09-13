import { Request, Response } from 'express';
import { Readable } from 'stream';
import { getUpdate, saveUpdate } from '../services/updates.service';

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
        if (!meta?.assetApiUrl) return res.status(404).send('not found');
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (!token) return res.status(500).send('server not configured');
        const upstream = await fetch(meta.assetApiUrl, {
            headers: {
                'User-Agent': 'ChurchKite/Admin',
                'Accept': 'application/octet-stream',
                'Authorization': `Bearer ${token}`,
            },
            redirect: 'follow',
        } as any);
        if (!(upstream as any)?.ok) {
            const status = (upstream as any).status;
            const text = typeof (upstream as any).text === 'function' ? await (upstream as any).text() : '';
            return res.status(502).send(`asset fetch failed (${status}): ${text || 'no details'}`);
        }
        const ct = (upstream as any).headers?.get?.('content-type') || 'application/zip';
        res.setHeader('Content-Type', ct);
        res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);
        const body: any = (upstream as any).body;
        if (body) {
            try {
                if (typeof (Readable as any).fromWeb === 'function' && typeof body.getReader === 'function') {
                    const nodeStream = (Readable as any).fromWeb(body as any);
                    nodeStream.on('error', () => {
                        if (!res.headersSent) res.status(502);
                        res.end();
                    });
                    nodeStream.pipe(res);
                    return;
                }
                if (typeof body.pipe === 'function') {
                    body.on('error', () => {
                        if (!res.headersSent) res.status(502);
                        res.end();
                    });
                    body.pipe(res);
                    return;
                }
            } catch (_e) {
                // fall through to arrayBuffer
            }
        }
        const buf = Buffer.from(await (upstream as any).arrayBuffer());
        res.end(buf);
    } catch (e: any) {
        res.status(500).send('download failed');
    }
}
