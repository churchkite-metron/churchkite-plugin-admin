import express from 'express';
import { createServer } from 'http';
import { config } from 'dotenv';
import app from './app';

config();

const PORT = process.env.PORT || 3000;

const server = createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});