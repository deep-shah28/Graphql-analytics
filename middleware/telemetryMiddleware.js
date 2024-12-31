const { parse } = require("graphql");
const { metricsStore } = require("../telemetry");

const telemetryMiddleware = async (req, res, next) => {
  // Only process GraphQL POST requests
  if (req.url !== "/graphql" || req.method !== "POST") {
    return next();
  }

  const startTime = Date.now();

  res.on("finish", () => {
    try {
      if (req.body?.query) {
        const document = parse(req.body.query);
        const operation = document.definitions[0];

        if (operation.kind === "OperationDefinition") {
          // Extract operation details
          const operationType = operation.operation || "query";
          const operationName =
            operation.name?.value ||
            operation.selectionSet.selections[0]?.name?.value ||
            "anonymous";

          // Skip GraphiQL introspection queries
          if (operationName.includes("IntrospectionQuery")) {
            return;
          }

          const duration = Date.now() - startTime;
          const hasErrors = res.statusCode >= 400;

          // Record operation metrics
          metricsStore.updateOperation(
            operationType,
            operationName,
            duration,
            hasErrors,
            req.body.query
          );
        }
      }
    } catch (error) {
      console.error("[Telemetry] Error recording metrics:", error);
    }
  });

  next();
};

module.exports = telemetryMiddleware;
