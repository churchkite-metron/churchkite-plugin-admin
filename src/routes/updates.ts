import { Router } from 'express';
import { getCheck, getDownload, postPublish } from '../controllers/updates.controller';

const router = Router();
router.post('/publish', postPublish);
router.get('/check', getCheck);
router.get('/download', getDownload);

export default function updatesRoutes() { return router; }
