import { getStore } from '@netlify/blobs';

export type RegisteredPlugin = {
    siteUrl: string;
    pluginSlug: string;
    pluginVersion?: string;
    wpVersion?: string;
    repoUrl?: string;
    firstSeen: string;
    lastSeen: string;
};

const STORE_PREFIX = 'registrations';

function keyFor(siteUrl: string, pluginSlug: string) {
    const site = encodeURIComponent(siteUrl);
    const slug = encodeURIComponent(pluginSlug);
    return `${STORE_PREFIX}/${site}/${slug}.json`;
}

function getRegistryStore() {
    return getStore('churchkite-admin');
}

export async function registerPlugin(entry: Omit<RegisteredPlugin, 'firstSeen' | 'lastSeen'>) {
    const now = new Date().toISOString();
    const key = keyFor(entry.siteUrl, entry.pluginSlug);
    const payload: RegisteredPlugin = { ...entry, firstSeen: now, lastSeen: now };
    const store = getRegistryStore();
    await store.setJSON(key, payload);
    return payload;
}

export async function heartbeat(siteUrl: string, pluginSlug: string, patch?: Partial<RegisteredPlugin>) {
    const key = keyFor(siteUrl, pluginSlug);
    const store = getRegistryStore();
    const current = (await store.get(key, { type: 'json' })) as RegisteredPlugin | null;
    const now = new Date().toISOString();
    const updated: RegisteredPlugin = current
        ? { ...current, ...patch, lastSeen: now }
        : {
            siteUrl,
            pluginSlug,
            pluginVersion: patch?.pluginVersion,
            wpVersion: patch?.wpVersion,
            repoUrl: patch?.repoUrl,
            firstSeen: now,
            lastSeen: now,
        };
    await store.setJSON(key, updated);
    return updated;
}

export async function deregister(siteUrl: string, pluginSlug: string) {
    const key = keyFor(siteUrl, pluginSlug);
    const store = getRegistryStore();
    await store.delete(key);
}

export async function listAll() {
    const out: RegisteredPlugin[] = [];
    const prefix = `${STORE_PREFIX}/`;
    const store = getRegistryStore();
    const listing = await store.list({ prefix });
    for (const item of listing.blobs) {
        if (!item.key.endsWith('.json')) continue;
        const rec = (await store.get(item.key, { type: 'json' })) as RegisteredPlugin | null;
        if (rec && !(rec as any).deleted) out.push(rec);
    }
    return out;
}
