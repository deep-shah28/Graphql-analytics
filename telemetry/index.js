const fs = require("fs");
const path = require("path");

// Configure metrics log file path
const METRICS_LOG_FILE = path.join(__dirname, "../logs/metrics.log");
const logsDir = path.join(__dirname, "../logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const metricsStore = {
  readMetrics() {
    try {
      if (!fs.existsSync(METRICS_LOG_FILE)) {
        return [];
      }
      const data = fs.readFileSync(METRICS_LOG_FILE, "utf8");
      return data
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
    } catch (error) {
      console.error("[Metrics] Error reading metrics:", error);
      return [];
    }
  },

  writeMetrics(metrics) {
    try {
      const logData = metrics.map((entry) => JSON.stringify(entry)).join("\n");
      fs.writeFileSync(METRICS_LOG_FILE, logData + "\n");
    } catch (error) {
      console.error("[Metrics] Error writing metrics:", error);
    }
  },

  updateOperation(operationType, operationName, duration, hasErrors, query) {
    const metrics = this.readMetrics();
    const timestamp = new Date().toISOString();
    const currentHour = `${new Date()
      .getHours()
      .toString()
      .padStart(2, "0")}:00`;

    // Find or create operation entry
    const existingOperationIndex = metrics.findIndex(
      (op) => op.operation === operationName
    );

    if (existingOperationIndex !== -1) {
      // Update existing operation metrics
      const existingOperation = metrics[existingOperationIndex];
      const newTotalCount = existingOperation.totalCount + 1;

      metrics[existingOperationIndex] = {
        timestamp,
        operation: operationName,
        path: "/",
        method: "POST",
        currentDuration: duration,
        averageDuration: (
          (existingOperation.averageDuration * existingOperation.totalCount +
            duration) /
          newTotalCount
        ).toFixed(2),
        slowestDuration: Math.max(existingOperation.slowestDuration, duration),
        fastestDuration: Math.min(existingOperation.fastestDuration, duration),
        totalCount: newTotalCount,
        hourlyDistribution: {
          ...existingOperation.hourlyDistribution,
          [currentHour]:
            (existingOperation.hourlyDistribution[currentHour] || 0) + 1,
        },
        status: hasErrors ? 500 : 200,
        query,
        isError: hasErrors,
        errorMessage: hasErrors ? "Internal Server Error" : null,
      };
    } else {
      // Create new operation entry
      metrics.push({
        timestamp,
        operation: operationName,
        path: "/",
        method: "POST",
        currentDuration: duration,
        averageDuration: duration.toFixed(2),
        slowestDuration: duration,
        fastestDuration: duration,
        totalCount: 1,
        hourlyDistribution: {
          [currentHour]: 1,
        },
        status: hasErrors ? 500 : 200,
        query,
        isError: hasErrors,
        errorMessage: hasErrors ? "Internal Server Error" : null,
      });
    }

    this.writeMetrics(metrics);
  },

  getMetrics() {
    return this.readMetrics();
  },
};

module.exports = { metricsStore };
