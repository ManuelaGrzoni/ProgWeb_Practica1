// src/config.js
import 'dotenv/config';

export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
export const JWT_SECRET = process.env.JWT_SECRET || 'manu0701';
export const JWT_EXPIRES = process.env.JWT_EXPIRES || '2d';
