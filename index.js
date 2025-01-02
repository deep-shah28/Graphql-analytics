require("./tracing");
const express = require("express");
const schema = require("./schema/schema");
const { graphqlHTTP } = require("express-graphql");
const { initializeDB } = require("./config/db");
const cors = require("cors");
const tracingMiddleware = require("./middleware/tracingMiddleware");

const app = express();
const PORT = 5000;

// Middleware setup
app.use(express.json());
app.use(cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Server] Error:", err.stack);
  res.status(500).send("Something broke!");
});

// API routes
app.use(tracingMiddleware);
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

// Start server
const startServer = async () => {
  try {
    await initializeDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
};

startServer();
