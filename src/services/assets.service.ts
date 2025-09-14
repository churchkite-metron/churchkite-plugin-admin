import { getStore } from '@netlify/blobs';
import { Readable } from 'stream';

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
    // Convert Buffer to ArrayBuffer properly for Netlify Blobs
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    await store.set(keyVersionFor(slug, version), arrayBuffer, { contentType } as any);
    await store.set(keyLatestFor(slug), arrayBuffer, { contentType } as any);
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

// Prefer streaming to avoid any encoding/Buffer conversion pitfalls
export async function getAssetStream(slug: string) {
    const store = getStoreHandle();
    const s = (await store.get(keyLatestFor(slug), { type: 'stream' } as any)) as any;
    // Netlify returns a Web ReadableStream in Node runtimes; convert if needed
    if (s && typeof (Readable as any).fromWeb === 'function' && s?.getReader) {
        return (Readable as any).fromWeb(s);
    }
    return s as Readable | null;
}

export async function getVersionedAssetStream(slug: string, version: string) {
    const store = getStoreHandle();
    const s = (await store.get(keyVersionFor(slug, version), { type: 'stream' } as any)) as any;
    if (s && typeof (Readable as any).fromWeb === 'function' && s?.getReader) {
        return (Readable as any).fromWeb(s);
    }
    return s as Readable | null;
}
