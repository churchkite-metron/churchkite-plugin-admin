import { Request, Response } from 'express';
import { deregister, heartbeat, listAll, registerPlugin, markVerified, getOne, saveInventory } from '../services/registry.service';

const HEADER = 'x-registration-key';

function checkKey(req: Request) {
    const provided = req.header(HEADER);
    const expected = process.env.REGISTRATION_API_KEY;
    return Boolean(provided) && Boolean(expected) && provided === expected;
}

export async function postRegister(req: Request, res: Response) {
    const { siteUrl, pluginSlug, pluginVersion, wpVersion, repoUrl, token, proofEndpoint } = req.body || {};
    if (!siteUrl || !pluginSlug) return res.status(400).json({ error: 'siteUrl and pluginSlug required' });
    try {
        const saved = await registerPlugin({ siteUrl, pluginSlug, pluginVersion, wpVersion, repoUrl, verifyUrl: proofEndpoint ?? null } as any);
        if (checkKey(req)) {
            const verified = await markVerified(siteUrl, pluginSlug, proofEndpoint ?? undefined);
            return res.json(verified ?? saved);
        }
        if (token && proofEndpoint) {
            const gfetch: any = (globalThis as any).fetch;
            if (typeof gfetch === 'function') {
                try {
                    const url = new URL(proofEndpoint);
                    url.searchParams.set('token', token);
                    const resp = await gfetch(url.toString(), { method: 'GET' });
                    if (resp && resp.ok) {
                        const verified = await markVerified(siteUrl, pluginSlug, proofEndpoint);
                        return res.json(verified ?? saved);
                    }
                } catch {
                    // ignore and fallthrough
                }
            }
            return res.status(202).json({ message: 'Registration received, pending verification', record: saved });
        }
        return res.status(202).json({ message: 'Registration received', record: saved });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to register', detail: e?.message });
    }
}

export async function postHeartbeat(req: Request, res: Response) {
    const { siteUrl, pluginSlug, pluginVersion, wpVersion, repoUrl, token, proofEndpoint } = req.body || {};
    if (!siteUrl || !pluginSlug) return res.status(400).json({ error: 'siteUrl and pluginSlug required' });
    try {
        let current = await getOne(siteUrl, pluginSlug);
        if (!checkKey(req)) {
            if (!current || !current.verified) {
                if (token && proofEndpoint) {
                    const gfetch: any = (globalThis as any).fetch;
                    if (typeof gfetch === 'function') {
                        try {
                            const url = new URL(proofEndpoint);
                            url.searchParams.set('token', token);
                            const resp = await gfetch(url.toString(), { method: 'GET' });
                            if (resp && resp.ok) {
                                await markVerified(siteUrl, pluginSlug, proofEndpoint);
                                current = await getOne(siteUrl, pluginSlug);
                            }
                        } catch { }
                    }
                }
                if (!current || !current.verified) return res.status(401).json({ error: 'Unauthorized' });
            }
        }
        const saved = await heartbeat(siteUrl, pluginSlug, { pluginVersion, wpVersion, repoUrl } as any);
        res.json(saved);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to heartbeat', detail: e?.message });
    }
}

export async function postDeregister(req: Request, res: Response) {
    const { siteUrl, pluginSlug } = req.body || {};
    if (!siteUrl || !pluginSlug) return res.status(400).json({ error: 'siteUrl and pluginSlug required' });
    try {
        if (!checkKey(req)) {
            const current = await getOne(siteUrl, pluginSlug);
            if (!current || !current.verified) return res.status(401).json({ error: 'Unauthorized' });
        }
        await deregister(siteUrl, pluginSlug);
        res.json({ ok: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to deregister', detail: e?.message });
    }
}

export async function getSites(req: Request, res: Response) {
    try {
        const all = await listAll();
        // Collapse to site-level unique list with lastSeen per site
        const bySite = new Map<string, { siteUrl: string; lastSeen: string; plugins: string[] }>();
        for (const r of all) {
            const e = bySite.get(r.siteUrl) || { siteUrl: r.siteUrl, lastSeen: r.lastSeen, plugins: [] };
            e.lastSeen = e.lastSeen > r.lastSeen ? e.lastSeen : r.lastSeen;
            if (!e.plugins.includes(r.pluginSlug)) e.plugins.push(r.pluginSlug);
            bySite.set(r.siteUrl, e);
        }
        res.json({ sites: Array.from(bySite.values()), items: all });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to list sites', detail: e?.message });
    }
}

export async function postInventory(req: Request, res: Response) {
    const { siteUrl, plugins, wpVersion, phpVersion, token, proofEndpoint } = req.body || {};
    if (!siteUrl || !Array.isArray(plugins)) return res.status(400).json({ error: 'siteUrl and plugins[] required' });
    try {
        let current = await getOne(siteUrl, 'churchkite-connector');
        if (!checkKey(req)) {
            if (!current || !current.verified) {
                if (token && proofEndpoint) {
                    const gfetch: any = (globalThis as any).fetch;
                    if (typeof gfetch === 'function') {
                        try {
                            const url = new URL(proofEndpoint);
                            url.searchParams.set('token', token);
                            const resp = await gfetch(url.toString(), { method: 'GET' });
                            if (resp && resp.ok) {
                                await markVerified(siteUrl, 'churchkite-connector', proofEndpoint);
                                current = await getOne(siteUrl, 'churchkite-connector');
                            }
                        } catch { }
                    }
                }
                if (!current || !current.verified) return res.status(401).json({ error: 'Unauthorized' });
            }
        }
        const saved = await saveInventory({ siteUrl, wpVersion, phpVersion, collectedAt: new Date().toISOString(), plugins });
        res.json({ ok: true, inventory: saved });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to save inventory', detail: e?.message });
    }
}
