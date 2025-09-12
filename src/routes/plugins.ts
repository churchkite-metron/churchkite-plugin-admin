import { Router } from 'express';
import { PluginsController } from '../controllers/plugins.controller';

const router = Router();
const pluginsController = new PluginsController();

export function setRoutes(app: Router) {
    app.get('/api/plugins', pluginsController.getPlugins.bind(pluginsController));
    app.put('/api/plugins/:id', pluginsController.updatePlugin.bind(pluginsController));
}