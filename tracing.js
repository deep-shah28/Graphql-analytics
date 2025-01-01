const { NodeSDK } = require("@opentelemetry/sdk-node");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const {
  GraphQLInstrumentation,
} = require("@opentelemetry/instrumentation-graphql");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");

// Configure Jaeger exporter
const jaegerExporter = new JaegerExporter({
  endpoint: "http://localhost:14268/api/traces",
});

// Create SDK configuration
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "graphql-service",
  }),
  spanProcessor: new SimpleSpanProcessor(jaegerExporter),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation({
      mergeItems: true,
      depth: 2,
      allowValues: true,
    }),
  ],
});

// Initialize the SDK
sdk.start();

// Gracefully shut down the SDK on process exit
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error) => console.log("Error terminating tracing", error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
