import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import app from '../../src/app';

export const handler = async (event: any, context: any) => {
    try {
        connectLambda(event);
    } catch { }
    const wrapped = serverless(app);
    return wrapped(event, context);
};
