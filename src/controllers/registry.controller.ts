import { Request, Response } from 'express';
import { deregister, heartbeat, listAll, registerPlugin } from '../services/registry.service';

const HEADER = 'x-registration-key';

function checkKey(req: Request) {
    const provided = req.header(HEADER);
    const expected = process.env.REGISTRATION_API_KEY;
    return Boolean(provided) && Boolean(expected) && provided === expected;
}

export async function postRegister(req: Request, res: Response) {
    if (!checkKey(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { siteUrl, pluginSlug, pluginVersion, wpVersion, repoUrl } = req.body || {};
    if (!siteUrl || !pluginSlug) return res.status(400).json({ error: 'siteUrl and pluginSlug required' });
    try {
        const saved = await registerPlugin({ siteUrl, pluginSlug, pluginVersion, wpVersion, repoUrl });
        res.json(saved);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to register', detail: e?.message });
    }
}

export async function postHeartbeat(req: Request, res: Response) {
    if (!checkKey(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { siteUrl, pluginSlug, pluginVersion, wpVersion, repoUrl } = req.body || {};
    if (!siteUrl || !pluginSlug) return res.status(400).json({ error: 'siteUrl and pluginSlug required' });
    try {
        const saved = await heartbeat(siteUrl, pluginSlug, { pluginVersion, wpVersion, repoUrl } as any);
        res.json(saved);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to heartbeat', detail: e?.message });
    }
}

export async function postDeregister(req: Request, res: Response) {
    if (!checkKey(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { siteUrl, pluginSlug } = req.body || {};
    if (!siteUrl || !pluginSlug) return res.status(400).json({ error: 'siteUrl and pluginSlug required' });
    try {
        await deregister(siteUrl, pluginSlug);
        res.json({ ok: true });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to deregister', detail: e?.message });
    }
}

export async function getSites(req: Request, res: Response) {
    if (!checkKey(req)) return res.status(401).json({ error: 'Unauthorized' });
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
