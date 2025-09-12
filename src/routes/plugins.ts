import { Router } from 'express';
import { PluginsController } from '../controllers/plugins.controller';

const router = Router();
const pluginsController = new PluginsController();

export function setRoutes(app: Router) {
    // SSR pages
    app.get('/', (req, res) => res.redirect('/plugins'));
    app.get('/plugins', pluginsController.getPlugins.bind(pluginsController));
    app.get('/sites', async (req, res) => {
        try {
            const { listAll } = await import('../services/registry.service');
            const items = await listAll();
            const bySite = new Map<string, { siteUrl: string; lastSeen: string; plugins: string[] }>();
            for (const r of items) {
                const e = bySite.get(r.siteUrl) || { siteUrl: r.siteUrl, lastSeen: r.lastSeen, plugins: [] };
                e.lastSeen = e.lastSeen > r.lastSeen ? e.lastSeen : r.lastSeen;
                if (!e.plugins.includes(r.pluginSlug)) e.plugins.push(r.pluginSlug);
                bySite.set(r.siteUrl, e);
            }
            res.render('sites', { sites: Array.from(bySite.values()) });
        } catch (e) {
            res.status(500).send('Error loading sites');
        }
    });

    // API endpoints (JSON)
    app.get('/api/plugins', pluginsController.getPlugins.bind(pluginsController));
    app.post('/api/plugins/update/:id', pluginsController.updatePluginStatus.bind(pluginsController));

    // Form post from SSR page
    app.post('/plugins/update/:id', pluginsController.updatePluginStatus.bind(pluginsController));
}