const { metricsStore } = require("./index");

const RETENTION_DAYS = 7;

const cleanupMetrics = () => {
  try {
    const metrics = metricsStore.readMetrics();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    // Keep only recent metrics
    const cleanedMetrics = metrics.filter(
      (metric) => new Date(metric.timestamp) >= cutoff
    );

    metricsStore.writeMetrics(cleanedMetrics);
    console.log("[Cleanup] Metrics cleanup completed");
  } catch (error) {
    console.error("[Cleanup] Error during metrics cleanup:", error);
  }
};

// Run cleanup daily
setInterval(cleanupMetrics, 24 * 60 * 60 * 1000);

module.exports = cleanupMetrics;
