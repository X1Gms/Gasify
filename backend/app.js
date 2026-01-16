const express = require("express");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const options = require("./config/options.json");
const swaggerDocs = require("./swagger.json");

const { invalidJsonMiddleware } = require("./middlewares/invalid-json");
const { requireAuth } = require("./middlewares/require-auth");

const { isDevelopmentEnv } = require("./utils/dev-environment");

const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const countriesRoutes = require("./routes/countries-routes");

const app = express();
const PORT = options.server.port || 8081;

const { createMqttClient } = require("../mqtt_server/mqtt/client");

// middlewares
app.use(express.json());
app.use(invalidJsonMiddleware);
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "www")));

// swagger docs only in development environment
if (isDevelopmentEnv) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  console.log(`Swagger docs running on http://localhost:${PORT}/docs`);
}

// use routes
app.use("/auth", authRoutes);
app.use("/users", requireAuth, userRoutes);
app.use("/countries", countriesRoutes);

// start server
app.listen(PORT, () => {
  // create mqtt client
  createMqttClient();
  console.log(`Server running on port http://localhost:${PORT}`);
});
