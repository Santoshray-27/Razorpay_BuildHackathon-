/**
 * backend/src/controllers/paymentController.js
 * Controller handling merchant-scoped payment endpoints.
 */

import * as paymentService from '../services/paymentService.js';

export async function listPayments(req, res, next) {
  try {
    const { limit, page, status } = req.query;
    const result = await paymentService.getMerchantPayments(req.user.merchantId, {
      limit: limit ? parseInt(limit, 10) : 50,
      page: page ? parseInt(page, 10) : 1,
      status
    });

    res.status(200).json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayment(req, res, next) {
  try {
    const payment = await paymentService.getPaymentById(req.user.merchantId, req.params.id);
    res.status(200).json({
      success: true,
      data: { payment },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}
