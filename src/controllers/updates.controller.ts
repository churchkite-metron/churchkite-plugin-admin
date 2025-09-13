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
        const tryStream = async (resp: any) => {
            if (!resp?.ok) return false;
            const ct = resp.headers?.get?.('content-type') || 'application/zip';
            res.setHeader('Content-Type', ct);
            res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);
            const body: any = resp.body;
            if (body) {
                try {
                    if (typeof (Readable as any).fromWeb === 'function' && typeof body.getReader === 'function') {
                        const nodeStream = (Readable as any).fromWeb(body as any);
                        nodeStream.on('error', () => { if (!res.headersSent) res.status(502); res.end(); });
                        nodeStream.pipe(res);
                        return true;
                    }
                    if (typeof body.pipe === 'function') {
                        body.on('error', () => { if (!res.headersSent) res.status(502); res.end(); });
                        body.pipe(res);
                        return true;
                    }
                } catch (_e) { /* fallthrough */ }
            }
            const buf = Buffer.from(await resp.arrayBuffer());
            res.end(buf);
            return true;
        };

        // Helper: derive public browser download URL from release URL
        const deriveBrowserUrl = (): string | null => {
            const m = (meta.url || '').match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^\s]+)$/);
            if (!m) return null;
            const owner = m[1];
            const repo = m[2];
            const tag = m[3];
            return `https://github.com/${owner}/${repo}/releases/download/${tag}/${slug}.zip`;
        };

        // 1) If token present, try GitHub API asset first
        if (token) {
            const apiResp = await fetch(meta.assetApiUrl, {
                headers: { 'User-Agent': 'ChurchKite/Admin', 'Accept': 'application/octet-stream', 'Authorization': `token ${token}` },
                redirect: 'follow',
            } as any);
            if (await tryStream(apiResp)) return;
            // If API fetch fails, fall back to public browser URL if derivable
            const pubUrl = deriveBrowserUrl();
            if (pubUrl) {
                const pubResp = await fetch(pubUrl, { headers: { 'User-Agent': 'ChurchKite/Admin' }, redirect: 'follow' } as any);
                if (await tryStream(pubResp)) return;
                return res.status(502).send('asset fetch failed (both API and public URL)');
            }
            const status = apiResp.status;
            const text = typeof (apiResp as any).text === 'function' ? await (apiResp as any).text() : '';
            return res.status(502).send(`asset fetch failed (${status}): ${text || 'no details'}`);
        }

        // 2) No token: try public browser URL
        const pubUrl = deriveBrowserUrl();
        if (pubUrl) {
            const pubResp = await fetch(pubUrl, { headers: { 'User-Agent': 'ChurchKite/Admin' }, redirect: 'follow' } as any);
            if (await tryStream(pubResp)) return;
            return res.status(502).send('asset fetch failed (public URL)');
        }
        return res.status(500).send('server not configured');
    } catch (e: any) {
        res.status(500).send('download failed');
    }
}
