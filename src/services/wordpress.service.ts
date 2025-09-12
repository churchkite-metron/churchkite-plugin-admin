export class WordPressService {
    private apiUrl: string;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }

    async fetchPlugins(): Promise<any> {
        const response = await fetch(`${this.apiUrl}/wp-json/plugins/v1/all`);
        if (!response.ok) {
            throw new Error('Failed to fetch plugins');
        }
        return await response.json();
    }

    async updatePluginStatus(pluginId: string, status: string): Promise<any> {
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