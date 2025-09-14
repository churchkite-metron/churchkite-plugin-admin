import { Request, Response } from 'express';
import { listAll, getInventory } from '../services/registry.service';

function getSitesFromEnv(): string[] {
    const raw = process.env.WORDPRESS_SITES || '';
    return raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

function getMetronMatcher() {
    const prefixEnv = process.env.METRON_PLUGIN_PREFIXES || 'metron-,churchkite-';
    const allowEnv = process.env.METRON_PLUGIN_SLUGS || 'churchkite-connector,metron-youtube-playlist-video-importer';
    const prefixes = prefixEnv.split(',').map(s => s.trim()).filter(Boolean);
    const allowlist = new Set(allowEnv.split(',').map(s => s.trim()).filter(Boolean));
    return (slug: string) => {
        if (!slug) return false;
        if (allowlist.has(slug)) return true;
        return prefixes.some(p => slug.startsWith(p));
    };
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
                updateUri: (p as any).updateUri || undefined,
            }));
            const isMetronByUri = (u?: string) => !!(u && u.toLowerCase().startsWith('churchkite://'));
            const isConnector = (slug?: string) => slug === 'churchkite-connector';
            const metronPlugins = plugins.filter(p => isMetronByUri(p.updateUri) || isConnector(p.slug));
            const thirdPartyPlugins = plugins.filter(p => !(isMetronByUri(p.updateUri) || isConnector(p.slug)));
            res.render('plugins', { plugins, metronPlugins, thirdPartyPlugins, sites, selectedSite, message });
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