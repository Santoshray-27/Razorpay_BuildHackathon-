/**
 * backend/src/controllers/simulatorController.js
 * Controller managing synthetic data generation, 4-strategy benchmarks, and SimulationRun persistence.
 */

import { generateSyntheticTransactions } from '../../../simulator/generator/syntheticDataGenerator.js';
import { runComparativeBenchmark } from '../../../simulator/engine/strategyEvaluator.js';
import { SimulationRun } from '../models/SimulationRun.js';

export async function generateDataset(req, res, next) {
  try {
    const { count = 10000, seed = 42, failureRate = 0.18 } = req.body || {};
    const transactions = generateSyntheticTransactions({ count, seed, failureRate, saveToFile: true });

    const failedCount = transactions.filter((t) => t.paymentStatus === 'failed').length;
    const totalAmountPaise = transactions.reduce((s, t) => s + t.amountPaise, 0);

    res.status(200).json({
      success: true,
      data: {
        totalGenerated: transactions.length,
        seed,
        failedCount,
        totalAmountPaise,
        savedTo: 'simulator/data/synthetic_transactions.json'
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function runSimulationBenchmark(req, res, next) {
  try {
    const { count = 10000, seed = 42, failureRate = 0.18 } = req.body || {};

    // 1. Deterministic generation
    const transactions = generateSyntheticTransactions({ count, seed, failureRate, saveToFile: false });

    // 2. 4-Strategy evaluation
    const benchmarkResults = runComparativeBenchmark(transactions);

    // 3. Persist SimulationRun document in MongoDB
    const simulationRun = await SimulationRun.create({
      merchantId: req.user.merchantId,
      seed,
      transactionCount: count,
      configuration: { failureRate },
      policyVersion: 'v1',
      modelVersion: 'v1.1-trained-logistic-regression',
      results: benchmarkResults.strategies,
      completedAt: new Date()
    });

    res.status(200).json({
      success: true,
      data: {
        simulationRunId: simulationRun._id,
        benchmark: benchmarkResults
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function listSimulationRuns(req, res, next) {
  try {
    const runs = await SimulationRun.find({ merchantId: req.user.merchantId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: { runs },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

export async function getSimulationRunById(req, res, next) {
  try {
    const run = await SimulationRun.findOne({
      _id: req.params.runId,
      merchantId: req.user.merchantId
    }).lean();

    if (!run) {
      const error = new Error('Simulation run not found');
      error.statusCode = 404;
      error.code = 'SIMULATION_RUN_NOT_FOUND';
      throw error;
    }

    res.status(200).json({
      success: true,
      data: { run },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}
