/**
 * backend/src/services/analyticsService.js
 * High-performance aggregation pipeline for merchant revenue recovery analytics.
 * Strictly computes metrics from stored Payment, RecoveryCase, and RecoveryAction records.
 * All monetary amounts are stored in paise and formatted accurately.
 */

import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { RecoveryAction } from '../models/RecoveryAction.js';

/**
 * Calculates overview KPIs grouped overall and broken down by executionMode.
 * @param {string} merchantId
 */
export async function getOverviewMetrics(merchantId) {
  // 1. Recovery Case Aggregation
  const cases = await RecoveryCase.find({ merchantId }).lean();

  let revenueAtRiskPaise = 0;
  let recoveredRevenuePaise = 0;
  let totalFailedPaymentsCount = 0;
  let activeCasesCount = 0;
  let pendingApprovalsCount = 0;

  const modeBreakdown = {
    RAZORPAY_TEST: { revenueAtRiskPaise: 0, recoveredRevenuePaise: 0, casesCount: 0, recoveredCount: 0 },
    MOCK_DEMO: { revenueAtRiskPaise: 0, recoveredRevenuePaise: 0, casesCount: 0, recoveredCount: 0 },
    SIMULATION: { revenueAtRiskPaise: 0, recoveredRevenuePaise: 0, casesCount: 0, recoveredCount: 0 }
  };

  cases.forEach((c) => {
    const mode = c.executionMode || 'MOCK_DEMO';
    const amount = Number(c.amountAtRiskPaise) || 0;
    const recovered = Number(c.recoveredAmountPaise) || 0;

    totalFailedPaymentsCount++;

    if (['detected', 'analyzing', 'recommended', 'pending_approval', 'approved', 'scheduled', 'executing'].includes(c.status)) {
      activeCasesCount++;
      revenueAtRiskPaise += amount;
      if (modeBreakdown[mode]) modeBreakdown[mode].revenueAtRiskPaise += amount;
    }

    if (c.status === 'pending_approval') {
      pendingApprovalsCount++;
    }

    if (c.status === 'recovered') {
      recoveredRevenuePaise += recovered;
      if (modeBreakdown[mode]) {
        modeBreakdown[mode].recoveredRevenuePaise += recovered;
        modeBreakdown[mode].recoveredCount++;
      }
    }

    if (modeBreakdown[mode]) modeBreakdown[mode].casesCount++;
  });

  const eligibleFailedRevenuePaise = revenueAtRiskPaise + recoveredRevenuePaise;
  const recoveryRate = eligibleFailedRevenuePaise > 0
    ? Number(((recoveredRevenuePaise / eligibleFailedRevenuePaise) * 100).toFixed(2))
    : 0;

  // Recent activity logs
  const recentCases = await RecoveryCase.find({ merchantId })
    .sort({ updatedAt: -1 })
    .limit(10)
    .populate('paymentId')
    .populate('customerId', 'name email phoneMasked')
    .lean();

  return {
    kpis: {
      revenueAtRiskPaise,
      recoveredRevenuePaise,
      recoveryRate,
      totalFailedPaymentsCount,
      activeCasesCount,
      pendingApprovalsCount
    },
    modeBreakdown,
    recentCases
  };
}

/**
 * Aggregates recovery metrics by strategy / action type.
 */
export async function getRecoveryByStrategy(merchantId) {
  const result = await RecoveryCase.aggregate([
    { $match: { merchantId } },
    {
      $group: {
        _id: { $ifNull: ['$latestRecommendation.recommended_action', 'UNSPECIFIED'] },
        totalCases: { $sum: 1 },
        recoveredCases: {
          $sum: { $cond: [{ $eq: ['$status', 'recovered'] }, 1, 0] }
        },
        amountAtRiskPaise: { $sum: '$amountAtRiskPaise' },
        recoveredAmountPaise: { $sum: '$recoveredAmountPaise' }
      }
    }
  ]);

  return result.map((r) => ({
    strategy: r._id,
    totalCases: r.totalCases,
    recoveredCases: r.recoveredCases,
    amountAtRiskPaise: r.amountAtRiskPaise,
    recoveredAmountPaise: r.recoveredAmountPaise,
    successRate: r.totalCases > 0 ? Number(((r.recoveredCases / r.totalCases) * 100).toFixed(1)) : 0
  }));
}

/**
 * Aggregates failure reasons and their recovery conversion rates.
 */
export async function getFailureReasonAnalytics(merchantId) {
  const result = await RecoveryCase.aggregate([
    { $match: { merchantId } },
    {
      $group: {
        _id: { $ifNull: ['$failureReason', 'unknown'] },
        count: { $sum: 1 },
        recoveredCount: {
          $sum: { $cond: [{ $eq: ['$status', 'recovered'] }, 1, 0] }
        },
        totalAmountPaise: { $sum: '$amountAtRiskPaise' },
        recoveredAmountPaise: { $sum: '$recoveredAmountPaise' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return result.map((r) => ({
    failureReason: r._id,
    count: r.count,
    recoveredCount: r.recoveredCount,
    totalAmountPaise: r.totalAmountPaise,
    recoveredAmountPaise: r.recoveredAmountPaise,
    recoveryRate: r.count > 0 ? Number(((r.recoveredCount / r.count) * 100).toFixed(1)) : 0
  }));
}

/**
 * Aggregates the end-to-end recovery pipeline funnel stages.
 */
export async function getRecoveryFunnel(merchantId) {
  const counts = await RecoveryCase.aggregate([
    { $match: { merchantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        volumePaise: { $sum: '$amountAtRiskPaise' }
      }
    }
  ]);

  const statusMap = {};
  counts.forEach((item) => {
    statusMap[item._id] = { count: item.count, volumePaise: item.volumePaise };
  });

  const totalDetected = counts.reduce((acc, curr) => acc + curr.count, 0);

  return [
    { stage: '1. Detected', count: totalDetected, status: 'detected' },
    {
      stage: '2. Analyzed by AI',
      count: counts.filter(c => c._id !== 'detected').reduce((acc, c) => acc + c.count, 0),
      status: 'analyzing'
    },
    {
      stage: '3. Policy Approved',
      count: counts.filter(c => ['approved', 'scheduled', 'executing', 'recovered'].includes(c._id)).reduce((acc, c) => acc + c.count, 0),
      status: 'approved'
    },
    {
      stage: '4. Scheduled/Queue',
      count: counts.filter(c => ['scheduled', 'executing', 'recovered'].includes(c._id)).reduce((acc, c) => acc + c.count, 0),
      status: 'scheduled'
    },
    {
      stage: '5. Genuine Recovered',
      count: statusMap['recovered']?.count || 0,
      volumePaise: statusMap['recovered']?.volumePaise || 0,
      status: 'recovered'
    }
  ];
}
