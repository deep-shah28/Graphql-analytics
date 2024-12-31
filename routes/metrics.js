const express = require("express");
const router = express.Router();
const { metricsStore } = require("../telemetry");

router.get("/view-metrics", (req, res) => {
  try {
    const { operation, timeframe } = req.query;
    let metrics = metricsStore.readMetrics();

    if (operation) {
      metrics = metrics.filter((op) => op.operation.includes(operation));
    }

    if (timeframe) {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - parseInt(timeframe));
      metrics = metrics.filter((op) => new Date(op.timestamp) >= cutoff);
    }

    // Calculate overall metrics
    const overallMetrics = {
      totalOperations: metrics.reduce((sum, op) => sum + op.totalCount, 0),
      totalDuration: metrics.reduce(
        (sum, op) => sum + op.currentDuration * op.totalCount,
        0
      ),
      totalErrors: metrics.reduce(
        (sum, op) => sum + (op.isError ? op.totalCount : 0),
        0
      ),
      uniqueOperations: metrics.length,
      averageResponseTime: 0,
    };

    // Calculate average response time
    if (overallMetrics.totalOperations > 0) {
      overallMetrics.averageResponseTime = (
        overallMetrics.totalDuration / overallMetrics.totalOperations
      ).toFixed(2);
    }

    res.json({
      metricsOperation: metrics,
      overallMetrics,
    });
  } catch (error) {
    console.error("Error reading metrics:", error);
    res.status(500).json({
      error: "Failed to read metrics",
      details: error.message,
    });
  }
});

module.exports = router;
