import { Request, Response } from 'express';
import { WordPressService } from '../services/wordpress.service';

function getSitesFromEnv(): string[] {
    const raw = process.env.WORDPRESS_SITES || '';
    return raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

export class PluginsController {
    public async getPlugins(req: Request, res: Response): Promise<void> {
        try {
            const sites = getSitesFromEnv();
            const selectedSite = (req.query.site as string) || process.env.WORDPRESS_API_URL || sites[0] || '';
            if (!selectedSite) {
                res.status(400).send('No site configured. Set WORDPRESS_SITES or WORDPRESS_API_URL.');
                return;
            }
            const wp = new WordPressService(selectedSite);
            const plugins = await wp.fetchPlugins();
            res.render('plugins', { plugins, sites, selectedSite });
        } catch (error) {
            res.status(500).send('Error fetching plugins');
        }
    }

    public async updatePluginStatus(req: Request, res: Response): Promise<void> {
        const pluginId = req.params.id;
        const status = (req.body && (req.body.status as string)) || 'toggle';
        const selectedSite = (req.query.site as string) || process.env.WORDPRESS_API_URL || '';
        try {
            if (!selectedSite) throw new Error('No site provided');
            const wp = new WordPressService(selectedSite);
            await wp.updatePluginStatus(pluginId, status);
            const accept = req.headers['accept'] || '';
            if (typeof accept === 'string' && accept.includes('application/json')) {
                res.status(200).json({ ok: true });
            } else {
                const redirectTo = `/plugins?site=${encodeURIComponent(selectedSite)}`;
                res.redirect(302, redirectTo);
            }
        } catch (error) {
            res.status(500).send('Error updating plugin status');
        }
    }
}