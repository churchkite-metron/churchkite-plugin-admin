import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
    // Initialize Netlify Blobs for Lambda-compatibility functions
    try { connectLambda(event); } catch { }

    if (!cachedHandler) {
        const mod = await import('../../src/app');
        const app = mod.default;
        cachedHandler = serverless(app);
    }
    return cachedHandler(event, context);
};
