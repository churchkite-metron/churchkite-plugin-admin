import { Router } from 'express';
import { PluginsController } from '../controllers/plugins.controller';

const router = Router();
const pluginsController = new PluginsController();

export function setRoutes(app: Router) {
    // SSR pages
    app.get('/', (req, res) => res.redirect('/plugins'));
    app.get('/plugins', pluginsController.getPlugins.bind(pluginsController));

    // API endpoints (JSON)
    app.get('/api/plugins', pluginsController.getPlugins.bind(pluginsController));
    app.post('/api/plugins/update/:id', pluginsController.updatePluginStatus.bind(pluginsController));

    // Form post from SSR page
    app.post('/plugins/update/:id', pluginsController.updatePluginStatus.bind(pluginsController));
}