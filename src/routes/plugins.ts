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
            let items: any[] = [];
            try { items = await listAll(); } catch { items = []; }
            const bySite = new Map<string, { siteUrl: string; lastSeen: string; plugins: string[] }>();
            for (const r of items) {
                const existing = bySite.get(r.siteUrl);
                const e: { siteUrl: string; lastSeen: string; plugins: string[] } = existing || { siteUrl: String(r.siteUrl), lastSeen: String(r.lastSeen), plugins: [] as string[] };
                e.lastSeen = e.lastSeen > r.lastSeen ? e.lastSeen : String(r.lastSeen);
                const slug = String(r.pluginSlug || '');
                if (slug && !e.plugins.includes(slug)) e.plugins.push(slug);
                bySite.set(String(r.siteUrl), e);
            }
            return res.render('sites', { sites: Array.from(bySite.values()) });
        } catch {
            return res.render('sites', { sites: [] });
        }
    });

    app.get('/inventory', async (req, res) => {
        try {
            const { listAll, getInventory } = await import('../services/registry.service');
            let items: any[] = [];
            try { items = await listAll(); } catch { items = []; }
            const sites = Array.from(new Set(items.map(i => i.siteUrl))).sort();
            const selectedSite = (req.query.site as string) || sites[0] || '';
            let inv = null;
            if (selectedSite) {
                try { inv = await getInventory(selectedSite); } catch { inv = null; }
            }
            return res.render('inventory', { sites, selectedSite, inventory: inv });
        } catch {
            return res.render('inventory', { sites: [], selectedSite: '', inventory: null });
        }
    });

    // API endpoints (JSON)
    app.get('/api/plugins', pluginsController.getPlugins.bind(pluginsController));
    app.post('/api/plugins/update/:id', pluginsController.updatePluginStatus.bind(pluginsController));

    // Form post from SSR page
    app.post('/plugins/update/:id', pluginsController.updatePluginStatus.bind(pluginsController));
}