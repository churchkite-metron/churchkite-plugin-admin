import { Router } from 'express';
import { getSites, postDeregister, postHeartbeat, postRegister } from '../controllers/registry.controller';

export function registryRoutes() {
    const router = Router();
    router.post('/register', postRegister);
    router.post('/heartbeat', postHeartbeat);
    router.post('/deregister', postDeregister);
    router.get('/sites', getSites);
    return router;
}
