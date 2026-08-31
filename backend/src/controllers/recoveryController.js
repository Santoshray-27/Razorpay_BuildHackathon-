/**
 * backend/src/controllers/recoveryController.js
 * Controller handling merchant-scoped recovery case endpoints, AI analysis, policy evaluations, approvals, and scheduling.
 */

import * as recoveryService from '../services/recoveryService.js';
import * as schedulingService from '../services/schedulingService.js';
import { processRecoveryActionJob } from '../jobs/recoveryWorker.js';

export async function listRecoveryCases(req, res, next) {
  try {
    const { status, riskLevel, page, limit } = req.query;
    const result = await recoveryService.getMerchantRecoveryCases(req.user.merchantId, {
      status,
      riskLevel,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
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

export async function getPendingApprovals(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await recoveryService.getPendingApprovals(req.user.merchantId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
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

export async function getRecoveryCase(req, res, next) {
  try {
    const caseDetails = await recoveryService.getRecoveryCaseById(
      req.user.merchantId,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: { recoveryCase: caseDetails },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeCase(req, res, next) {
  try {
    const updatedCase = await recoveryService.analyzeRecoveryCase(
      req.user.merchantId,
      req.params.id,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      data: { recoveryCase: updatedCase },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function evaluatePolicyForCase(req, res, next) {
  try {
    const result = await recoveryService.evaluatePolicyForCase(
      req.user.merchantId,
      req.params.id,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function approveCase(req, res, next) {
  try {
    const { reason } = req.body || {};
    const updatedCase = await recoveryService.approveCase(
      req.user.merchantId,
      req.params.id,
      req.user,
      reason,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      data: { recoveryCase: updatedCase },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectCase(req, res, next) {
  try {
    const { reason } = req.body || {};
    const updatedCase = await recoveryService.rejectCase(
      req.user.merchantId,
      req.params.id,
      req.user,
      reason,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      data: { recoveryCase: updatedCase },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function stopCase(req, res, next) {
  try {
    const { reason } = req.body || {};
    const updatedCase = await recoveryService.transitionCaseStatus(
      req.user.merchantId,
      req.params.id,
      'stopped',
      {
        actor: 'human',
        correlationId: req.correlationId,
        reason: reason || 'Manually stopped by merchant'
      }
    );

    res.status(200).json({
      success: true,
      data: { recoveryCase: updatedCase },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function scheduleCaseAction(req, res, next) {
  try {
    const result = await schedulingService.scheduleApprovedAction(
      req.user.merchantId,
      req.params.id,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function executeCaseActionDirect(req, res, next) {
  try {
    // 1. Schedule / prepare action
    const { recoveryCase, recoveryAction } = await schedulingService.scheduleApprovedAction(
      req.user.merchantId,
      req.params.id,
      req.correlationId
    );

    // 2. Direct inline execution for demo/testing without waiting for delayed background worker
    const result = await processRecoveryActionJob({
      id: recoveryAction.idempotencyKey,
      data: {
        recoveryCaseId: recoveryCase._id.toString(),
        recoveryActionId: recoveryAction._id.toString(),
        correlationId: req.correlationId
      }
    });

    const refreshedCase = await recoveryService.getRecoveryCaseById(req.user.merchantId, req.params.id);

    res.status(200).json({
      success: true,
      data: {
        executionResult: result,
        recoveryCase: refreshedCase
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}
