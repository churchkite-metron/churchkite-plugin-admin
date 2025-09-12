// This file contains client-side JavaScript for handling user interactions and making AJAX requests to the server.

document.addEventListener('DOMContentLoaded', () => {
    const pluginList = document.getElementById('plugin-list');

    const params = new URLSearchParams(window.location.search);
    const site = params.get('site') || '';

    if (pluginList) {
        fetchPlugins();
    }

    async function fetchPlugins() {
        try {
            const url = site ? `/api/plugins?site=${encodeURIComponent(site)}` : '/api/plugins';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch plugins');
            const data = await response.json();
            renderPlugins(data);
        } catch (error) {
            console.error('Error fetching plugins:', error);
        }
    }

    function renderPlugins(plugins) {
        pluginList.innerHTML = '';
        plugins.forEach(plugin => {
            const listItem = document.createElement('li');
            listItem.textContent = `${plugin.name} - ${plugin.status}`;
            pluginList.appendChild(listItem);
        });
    }

    const updateBtn = document.getElementById('update-plugins');
    if (updateBtn) updateBtn.addEventListener('click', updatePlugins);

    async function updatePlugins() {
        try {
            const id = updateBtn?.dataset?.id;
            if (!id) return;
            const url = site ? `/api/plugins/update/${id}?site=${encodeURIComponent(site)}` : `/api/plugins/update/${id}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to update plugin');
            await fetchPlugins();
            alert('Plugins updated successfully!');
        } catch (error) {
            console.error('Error updating plugins:', error);
        }
    }
});