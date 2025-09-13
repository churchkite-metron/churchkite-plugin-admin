import { getStore } from '@netlify/blobs';

export type UpdateMeta = {
    slug: string;
    version: string;
    url: string;
    changelog?: string;
    assetApiUrl: string;
    createdAt: string;
};

const STORE_PREFIX = 'updates';

function keyFor(slug: string) {
    return `${STORE_PREFIX}/${encodeURIComponent(slug)}.json`;
}

function getUpdatesStore() {
    return getStore('churchkite-admin');
}

export async function saveUpdate(meta: UpdateMeta) {
    const store = getUpdatesStore();
    await store.setJSON(keyFor(meta.slug), meta);
    return meta;
}

export async function getUpdate(slug: string) {
    const store = getUpdatesStore();
    const rec = (await store.get(keyFor(slug), { type: 'json' })) as UpdateMeta | null;
    return rec || null;
}
