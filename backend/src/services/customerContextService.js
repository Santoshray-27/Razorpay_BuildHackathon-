/**
 * backend/src/services/customerContextService.js
 * Builds privacy-safe customer context and payment history aggregates.
 * Never stores or transmits card credentials, CVVs, or unneeded sensitive PII.
 */

import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';
import { RecoveryCase } from '../models/RecoveryCase.js';

/**
 * Masks an email address for privacy (e.g., "rahul.kumar@example.com" -> "r***r@example.com").
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Masks a phone number for privacy (e.g., "+919876543210" -> "+91*****3210").
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.trim();
  if (cleaned.length < 6) return '******';
  const prefix = cleaned.substring(0, 3);
  const suffix = cleaned.substring(cleaned.length - 4);
  return `${prefix}*****${suffix}`;
}

/**
 * Upserts a customer context record from incoming payment customer details.
 */
export async function upsertCustomer(merchantId, providerCustomerId, details = {}) {
  if (!providerCustomerId) return null;

  const updateFields = {};
  if (details.name) updateFields.name = details.name;
  if (details.email) updateFields.email = details.email.toLowerCase().trim();
  if (details.contact) updateFields.phoneMasked = maskPhone(details.contact);

  const customer = await Customer.findOneAndUpdate(
    { merchantId, providerCustomerId },
    {
      $set: updateFields,
      $setOnInsert: {
        merchantId,
        providerCustomerId,
        optedOutOfRecovery: false,
        subscriptionStatus: 'none',
        successfulPaymentsCount: 0,
        failedPaymentsCount: 0,
        totalSuccessfulSpendPaise: 0,
        lastSuccessfulPaymentAt: null
      }
    },
    { upsert: true, new: true }
  );

  return customer;
}

/**
 * Builds rich, privacy-safe customer payment context for risk evaluation and AI intelligence.
 * @param {string} merchantId
 * @param {string} customerId - Customer ObjectId or ProviderCustomerId
 * @returns {Promise<object>}
 */
export async function buildCustomerContext(merchantId, customerId) {
  if (!customerId) {
    return {
      hasHistory: false,
      successfulPaymentsCount: 0,
      failedPaymentsCount: 0,
      recentSuccessRate: 0,
      averagePaymentAmountPaise: 0,
      daysSinceLastSuccess: null,
      subscriptionStatus: 'none',
      optedOutOfRecovery: false,
      existingActiveRecoveryCases: 0
    };
  }

  const customer = await Customer.findOne({
    merchantId,
    $or: [{ _id: customerId }, { providerCustomerId: customerId }]
  }).lean();

  if (!customer) {
    return {
      hasHistory: false,
      successfulPaymentsCount: 0,
      failedPaymentsCount: 0,
      recentSuccessRate: 0,
      averagePaymentAmountPaise: 0,
      daysSinceLastSuccess: null,
      subscriptionStatus: 'none',
      optedOutOfRecovery: false,
      existingActiveRecoveryCases: 0
    };
  }

  // Calculate days since last successful payment
  let daysSinceLastSuccess = null;
  if (customer.lastSuccessfulPaymentAt) {
    const diffMs = Date.now() - new Date(customer.lastSuccessfulPaymentAt).getTime();
    daysSinceLastSuccess = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const totalPayments = (customer.successfulPaymentsCount || 0) + (customer.failedPaymentsCount || 0);
  const recentSuccessRate = totalPayments > 0
    ? Number(((customer.successfulPaymentsCount || 0) / totalPayments).toFixed(2))
    : 0;

  const averagePaymentAmountPaise = customer.successfulPaymentsCount > 0
    ? Math.round((customer.totalSuccessfulSpendPaise || 0) / customer.successfulPaymentsCount)
    : 0;

  // Query existing active recovery cases for this customer
  const activeCasesCount = await RecoveryCase.countDocuments({
    merchantId,
    customerId: customer._id,
    status: { $in: ['detected', 'analyzing', 'recommended', 'pending_approval', 'approved', 'scheduled', 'executing'] }
  });

  return {
    customerId: customer._id.toString(),
    providerCustomerId: customer.providerCustomerId,
    maskedEmail: maskEmail(customer.email),
    maskedPhone: customer.phoneMasked,
    hasHistory: totalPayments > 0,
    successfulPaymentsCount: customer.successfulPaymentsCount || 0,
    failedPaymentsCount: customer.failedPaymentsCount || 0,
    recentSuccessRate,
    averagePaymentAmountPaise,
    daysSinceLastSuccess,
    subscriptionStatus: customer.subscriptionStatus || 'none',
    optedOutOfRecovery: Boolean(customer.optedOutOfRecovery),
    existingActiveRecoveryCases: activeCasesCount
  };
}

/**
 * Updates customer metrics upon payment state changes.
 */
export async function updateCustomerPaymentMetrics(merchantId, customerId, paymentStatus, amountPaise) {
  if (!customerId) return;

  const updateQuery = {};
  if (paymentStatus === 'captured' || paymentStatus === 'recovered') {
    updateQuery.$inc = {
      successfulPaymentsCount: 1,
      totalSuccessfulSpendPaise: amountPaise
    };
    updateQuery.$set = {
      lastSuccessfulPaymentAt: new Date()
    };
  } else if (paymentStatus === 'failed') {
    updateQuery.$inc = {
      failedPaymentsCount: 1
    };
  }

  if (Object.keys(updateQuery).length > 0) {
    await Customer.updateOne(
      { merchantId, _id: customerId },
      updateQuery
    );
  }
}
