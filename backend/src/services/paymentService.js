/**
 * backend/src/services/paymentService.js
 * Business logic for payment queries, strictly scoped by merchant tenancy.
 */

import { Payment } from '../models/Payment.js';
import '../models/Customer.js'; // Ensure Customer schema is registered for populate

export async function getMerchantPayments(merchantId, { limit = 50, page = 1, status } = {}) {
  const query = { merchantId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const [payments, totalCount] = await Promise.all([
    Payment.find(query)
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email phoneMasked')
      .lean(),
    Payment.countDocuments(query)
  ]);

  return {
    payments,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit) || 1
    }
  };
}

export async function getPaymentById(merchantId, paymentId) {
  const payment = await Payment.findOne({ _id: paymentId, merchantId })
    .populate('customerId', 'name email phoneMasked')
    .lean();

  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    error.code = 'PAYMENT_NOT_FOUND';
    throw error;
  }

  return payment;
}
