// This file contains client-side JavaScript for handling user interactions and making AJAX requests to the server.

document.addEventListener('DOMContentLoaded', () => {
    const pluginList = document.getElementById('plugin-list');
    
    if (pluginList) {
        fetchPlugins();
    }

    function fetchPlugins() {
        fetch('/api/plugins')
            .then(response => response.json())
            .then(data => {
                renderPlugins(data);
            })
            .catch(error => console.error('Error fetching plugins:', error));
    }

    function renderPlugins(plugins) {
        pluginList.innerHTML = '';
        plugins.forEach(plugin => {
            const listItem = document.createElement('li');
            listItem.textContent = `${plugin.name} - ${plugin.status}`;
            pluginList.appendChild(listItem);
        });
    }

    document.getElementById('update-plugins').addEventListener('click', updatePlugins);

    function updatePlugins() {
        fetch('/api/plugins/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            alert('Plugins updated successfully!');
            fetchPlugins();
        })
        .catch(error => console.error('Error updating plugins:', error));
    }
});