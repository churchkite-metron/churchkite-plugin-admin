import { getStore } from '@netlify/blobs';

const ASSET_PREFIX = 'updates/assets';

function keyFor(slug: string) {
    return `${ASSET_PREFIX}/${encodeURIComponent(slug)}.zip`;
}

function getStoreHandle() {
    return getStore('churchkite-admin');
}

export async function saveAsset(slug: string, data: Buffer, contentType = 'application/zip') {
    const store = getStoreHandle();
    const ab = data.buffer.slice(data.byteOffset, data.byteLength + data.byteOffset);
    await store.set(keyFor(slug), ab as ArrayBuffer, { contentType } as any);
    return true;
}

export async function hasAsset(slug: string) {
    const store = getStoreHandle();
    const b = await store.get(keyFor(slug), { type: 'arrayBuffer' } as any);
    return Boolean(b);
}

export async function getAssetBuffer(slug: string) {
    const store = getStoreHandle();
    const b = (await store.get(keyFor(slug), { type: 'arrayBuffer' } as any)) as unknown as ArrayBuffer | null;
    return b ? Buffer.from(b as ArrayBuffer) : null;
}
