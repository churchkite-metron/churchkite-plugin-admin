import { getStore } from '@netlify/blobs';

export type RegisteredPlugin = {
    siteUrl: string;
    pluginSlug: string;
    pluginVersion?: string;
    wpVersion?: string;
    repoUrl?: string;
    verified?: boolean;
    verifiedAt?: string | null;
    verifyUrl?: string | null;
    firstSeen: string;
    lastSeen: string;
};

const STORE_PREFIX = 'registrations';
const INV_PREFIX = 'inventory';

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
    const payload: RegisteredPlugin = { verified: false, verifiedAt: null, verifyUrl: null, ...entry, firstSeen: now, lastSeen: now };
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
            verified: false,
            verifiedAt: null,
            verifyUrl: null,
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

export async function markVerified(siteUrl: string, pluginSlug: string, verifyUrl?: string) {
    const key = keyFor(siteUrl, pluginSlug);
    const store = getRegistryStore();
    const current = (await store.get(key, { type: 'json' })) as RegisteredPlugin | null;
    if (!current) return null;
    const now = new Date().toISOString();
    const updated: RegisteredPlugin = { ...current, verified: true, verifiedAt: now, verifyUrl: verifyUrl ?? current.verifyUrl ?? null };
    await store.setJSON(key, updated);
    return updated;
}

export async function getOne(siteUrl: string, pluginSlug: string) {
    const key = keyFor(siteUrl, pluginSlug);
    const store = getRegistryStore();
    const rec = (await store.get(key, { type: 'json' })) as RegisteredPlugin | null;
    return rec || null;
}

export type InventoryItem = {
    slug: string;
    name: string;
    version: string;
    active: boolean;
    updateAvailable?: boolean;
    newVersion?: string | null;
    updateUri?: string;
};

export type SiteInventory = {
    siteUrl: string;
    wpVersion?: string;
    phpVersion?: string;
    collectedAt: string;
    plugins: InventoryItem[];
};

function invKeyFor(siteUrl: string) {
    return `${INV_PREFIX}/${encodeURIComponent(siteUrl)}.json`;
}

export async function saveInventory(inv: SiteInventory) {
    const key = invKeyFor(inv.siteUrl);
    const store = getRegistryStore();
    await store.setJSON(key, inv);
    return inv;
}

export async function getInventory(siteUrl: string) {
    const key = invKeyFor(siteUrl);
    const store = getRegistryStore();
    const inv = (await store.get(key, { type: 'json' })) as SiteInventory | null;
    return inv || null;
}
