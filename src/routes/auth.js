import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/AuthController.js';

const router = express.Router();

// Admin login
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], AuthController.login);

// Refresh token
router.post('/refresh', AuthController.refreshToken);

// Logout
router.post('/logout', AuthController.logout);

export default router;