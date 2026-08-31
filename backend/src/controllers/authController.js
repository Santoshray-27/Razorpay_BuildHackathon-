/**
 * backend/src/controllers/authController.js
 * Thin HTTP controller for merchant authentication endpoints.
 */

import * as authService from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.validatedBody);
    res.status(201).json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.validatedBody);
    res.status(200).json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}
