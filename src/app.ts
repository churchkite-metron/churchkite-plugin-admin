import express from 'express';
import path from 'path';
import { json, urlencoded } from 'body-parser';
import { setRoutes } from './routes/plugins';
import { authMiddleware } from './middlewares/auth';

const app = express();

// Middleware setup
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(authMiddleware);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Set up routes
setRoutes(app);

export default app;