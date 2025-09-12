import express from 'express';
import path from 'path';
import { json, urlencoded } from 'body-parser';
import { setRoutes } from './routes/plugins';
import { authenticate } from './middlewares/auth';

const app = express();

// Middleware setup
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(authenticate);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'src/views'));

// Static files
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Set up routes
setRoutes(app);

export default app;