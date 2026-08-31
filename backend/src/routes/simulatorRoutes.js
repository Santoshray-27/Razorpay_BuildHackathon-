/**
 * backend/src/routes/simulatorRoutes.js
 * Express routing definitions for simulation generation and 4-strategy benchmarks.
 */

import { Router } from 'express';
import * as simulatorController from '../controllers/simulatorController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected routes scoped to authenticated merchant
router.use(authenticate);

router.post('/generate', simulatorController.generateDataset);
router.post('/run', simulatorController.runSimulationBenchmark);
router.get('/results', simulatorController.listSimulationRuns);
router.get('/results/:runId', simulatorController.getSimulationRunById);

export default router;
