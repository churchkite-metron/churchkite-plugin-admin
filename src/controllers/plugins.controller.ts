import { Request, Response } from 'express';
import { listAll, getInventory } from '../services/registry.service';

function getSitesFromEnv(): string[] {
    const raw = process.env.WORDPRESS_SITES || '';
    return raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

async function getSites(): Promise<string[]> {
    try {
        const items = await listAll();
        const sites = Array.from(new Set(items.map(i => i.siteUrl))).sort();
        if (sites.length > 0) return sites;
    } catch {
        // Ignore and fall back to env
    }
    return getSitesFromEnv();
}

export class PluginsController {
    public async getPlugins(req: Request, res: Response): Promise<void> {
        try {
            const sites = await getSites();
            const selectedSite = (req.query.site as string) || sites[0] || '';
            const message = !selectedSite
                ? 'No sites registered yet. Visit a WordPress site with the connector active or set WORDPRESS_SITES to see data here.'
                : '';
            const inv = selectedSite ? await getInventory(selectedSite) : null;
            const plugins = (inv?.plugins || []).map(p => ({
                name: p.name,
                slug: p.slug,
                version: p.version,
                active: p.active,
                updateAvailable: p.updateAvailable,
                newVersion: p.newVersion || null,
            }));
            res.render('plugins', { plugins, sites, selectedSite, message });
        } catch (error) {
            res.status(500).send('Error fetching plugins');
        }
    }

    public async updatePluginStatus(req: Request, res: Response): Promise<void> {
        const pluginId = req.params.id;
        const status = (req.body && (req.body.status as string)) || 'toggle';
        const selectedSite = (req.query.site as string) || process.env.WORDPRESS_API_URL || '';
        res.status(501).send('Updating plugins is not supported in this view');
    }
}