import { getStore } from '@netlify/blobs';

const ASSET_PREFIX = 'updates/assets';

function keyLatestFor(slug: string) {
    return `${ASSET_PREFIX}/${encodeURIComponent(slug)}.zip`;
}

function keyVersionFor(slug: string, version: string) {
    return `${ASSET_PREFIX}/${encodeURIComponent(slug)}/${encodeURIComponent(version)}.zip`;
}

function getStoreHandle() {
    return getStore('churchkite-admin');
}

export async function saveAssetVersion(slug: string, version: string, data: Buffer, contentType = 'application/zip') {
    const store = getStoreHandle();
    const ab = data.buffer.slice(data.byteOffset, data.byteLength + data.byteOffset);
    await store.set(keyVersionFor(slug, version), ab as ArrayBuffer, { contentType } as any);
    await store.set(keyLatestFor(slug), ab as ArrayBuffer, { contentType } as any);
    return true;
}

export async function hasAsset(slug: string) {
    const store = getStoreHandle();
    const b = await store.get(keyLatestFor(slug), { type: 'arrayBuffer' } as any);
    return Boolean(b);
}

export async function getAssetBuffer(slug: string) {
    const store = getStoreHandle();
    const b = (await store.get(keyLatestFor(slug), { type: 'arrayBuffer' } as any)) as unknown as ArrayBuffer | null;
    return b ? Buffer.from(b as ArrayBuffer) : null;
}

export async function getVersionedAssetBuffer(slug: string, version: string) {
    const store = getStoreHandle();
    const b = (await store.get(keyVersionFor(slug, version), { type: 'arrayBuffer' } as any)) as unknown as ArrayBuffer | null;
    return b ? Buffer.from(b as ArrayBuffer) : null;
}
