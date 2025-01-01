const { trace, context } = require("@opentelemetry/api");
const tracer = trace.getTracer("graphql-tracer");

const tracingMiddleware = async (req, res, next) => {
  if (req.url !== "/graphql" || req.method !== "POST") {
    return next();
  }

  const span = tracer.startSpan("graphql_operation");

  // Add operation details to span
  if (req.body?.query) {
    span.setAttribute("graphql.query", req.body.query);
    span.setAttribute(
      "graphql.operation_name",
      req.body.operationName || "anonymous"
    );
  }

  // Store span in context
  const ctx = trace.setSpan(context.active(), span);

  // Wrap response end to capture duration and status
  const originalEnd = res.end;
  res.end = function (...args) {
    span.setAttributes({
      "http.status_code": res.statusCode,
      "graphql.has_errors": res.statusCode >= 400,
    });
    span.end();
    originalEnd.apply(res, args);
  };

  return context.with(ctx, () => next());
};

module.exports = tracingMiddleware;
