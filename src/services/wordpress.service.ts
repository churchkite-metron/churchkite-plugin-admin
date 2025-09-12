export class WordPressService {
    private apiUrl: string;

    constructor(apiUrl?: string) {
        this.apiUrl = apiUrl || process.env.WORDPRESS_API_URL || '';
    }

    async fetchPlugins(): Promise<any> {
        if (!this.apiUrl) throw new Error('WORDPRESS_API_URL is not configured');
        const response = await fetch(`${this.apiUrl}/wp-json/plugins/v1/all`);
        if (!response.ok) {
            throw new Error('Failed to fetch plugins');
        }
        return await response.json();
    }

    async updatePluginStatus(pluginId: string, status: string): Promise<any> {
        if (!this.apiUrl) throw new Error('WORDPRESS_API_URL is not configured');
        const response = await fetch(`${this.apiUrl}/wp-json/plugins/v1/update/${pluginId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            throw new Error('Failed to update plugin status');
        }
        return await response.json();
    }
}