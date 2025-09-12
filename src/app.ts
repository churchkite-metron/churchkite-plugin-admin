import express from 'express';
import path from 'path';
import { setRoutes } from './routes/plugins';

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'src/views'));

// Static files
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Set up routes
setRoutes(app);

export default app;