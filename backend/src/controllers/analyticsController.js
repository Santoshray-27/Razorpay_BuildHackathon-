/**
 * backend/src/controllers/analyticsController.js
 * Controller handling merchant-scoped recovery analytics, KPIs, and charts.
 */

import * as analyticsService from '../services/analyticsService.js';

export async function getOverview(req, res, next) {
  try {
    const data = await analyticsService.getOverviewMetrics(req.user.merchantId);
    res.status(200).json({
      success: true,
      data,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getRecoveryByStrategy(req.user.merchantId);
    res.status(200).json({
      success: true,
      data: { strategies: data },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function getFailureAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getFailureReasonAnalytics(req.user.merchantId);
    res.status(200).json({
      success: true,
      data: { failures: data },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function getFunnelAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getRecoveryFunnel(req.user.merchantId);
    res.status(200).json({
      success: true,
      data: { funnel: data },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}
