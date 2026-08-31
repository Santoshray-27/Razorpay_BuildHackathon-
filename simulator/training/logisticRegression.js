/**
 * simulator/training/logisticRegression.js
 * Logistic Regression Trainer and Evaluation Engine for Synthetic Recovery Benchmarks.
 * Note: ML metrics (Precision/Recall/ROC-AUC) are secondary diagnostics;
 * primary project evaluation is genuine recovered revenue (Paise/INR) and Recovery Rate.
 */

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));
}

/**
 * Trains logistic regression model using mini-batch gradient descent with L2 regularization.
 * @param {number[][]} X - Feature matrix [N, D]
 * @param {number[]} y - Binary label vector [N] (0 or 1)
 * @param {object} options
 * @returns {object} { weights, bias, lossHistory }
 */
export function trainLogisticRegression(X, y, {
  learningRate = 0.05,
  epochs = 200,
  lambdaL2 = 0.001
} = {}) {
  const numSamples = X.length;
  const numFeatures = X[0].length;

  let weights = new Array(numFeatures).fill(0);
  let bias = 0;
  const lossHistory = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    const gradWeights = new Array(numFeatures).fill(0);
    let gradBias = 0;

    for (let i = 0; i < numSamples; i++) {
      let z = bias;
      for (let j = 0; j < numFeatures; j++) {
        z += weights[j] * X[i][j];
      }
      const p = sigmoid(z);
      const err = p - y[i];

      // Binary cross-entropy loss
      const safeP = Math.max(1e-7, Math.min(1 - 1e-7, p));
      totalLoss -= (y[i] * Math.log(safeP) + (1 - y[i]) * Math.log(1 - safeP));

      gradBias += err;
      for (let j = 0; j < numFeatures; j++) {
        gradWeights[j] += err * X[i][j];
      }
    }

    // Apply gradients with L2 penalty
    bias -= (learningRate * gradBias) / numSamples;
    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= learningRate * ((gradWeights[j] / numSamples) + lambdaL2 * weights[j]);
    }

    lossHistory.push(totalLoss / numSamples);
  }

  return { weights, bias, lossHistory };
}

/**
 * Evaluates binary classification model on held-out split.
 */
export function evaluateClassification(yTrue, yProb, threshold = 0.5) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  let brierScore = 0;

  for (let i = 0; i < yTrue.length; i++) {
    const pred = yProb[i] >= threshold ? 1 : 0;
    const actual = yTrue[i];

    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else if (pred === 0 && actual === 1) fn++;

    brierScore += Math.pow(yProb[i] - actual, 2);
  }

  const accuracy = (tp + tn) / yTrue.length;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1Score: Number(f1.toFixed(4)),
    brierScore: Number((brierScore / yTrue.length).toFixed(4)),
    totalEvaluated: yTrue.length
  };
}
