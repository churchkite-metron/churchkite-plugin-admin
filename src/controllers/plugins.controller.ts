import { Request, Response } from 'express';
import { WordPressService } from '../services/wordpress.service';

export class PluginsController {
    private wordpressService: WordPressService;

    constructor() {
        this.wordpressService = new WordPressService();
    }

    public async getPlugins(req: Request, res: Response): Promise<void> {
        try {
            const plugins = await this.wordpressService.fetchPlugins();
            res.render('plugins', { plugins });
        } catch (error) {
            res.status(500).send('Error fetching plugins');
        }
    }

    public async updatePluginStatus(req: Request, res: Response): Promise<void> {
        const { pluginId, status } = req.body;
        try {
            await this.wordpressService.updatePluginStatus(pluginId, status);
            res.status(200).send('Plugin status updated successfully');
        } catch (error) {
            res.status(500).send('Error updating plugin status');
        }
    }
}