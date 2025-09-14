import express from 'express';
import ejs from 'ejs';
import path from 'path';
import { setRoutes } from './routes/plugins';
import { registryRoutes } from './routes/registry';
import updatesRoutes from './routes/updates';
import { isProductionRequest } from './utils/env';

const app = express();

// Middleware setup
app.use((req, res, next) => {
    (res as any).locals = (res as any).locals || {};
    (res as any).locals.isProd = isProductionRequest(req);
    next();
});
app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
});
app.use((req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (typeof ct === 'string' && (ct.includes('application/zip') || ct.includes('application/octet-stream'))) {
        return express.raw({ type: (req) => true, limit: '64mb' })(req, res, next);
    }
    next();
});
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// View engine setup
app.engine('ejs', (ejs as any).__express);
app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'src/views'));

// Static files
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Set up routes
setRoutes(app);
app.use('/api/registry', registryRoutes());
app.use('/api/updates', updatesRoutes());

export default app;