const express = require("express");
const swaggerUi = require("swagger-ui-express");

const options = require("./config/options.json");
const swaggerDocs = require("./swagger.json");

const authRoutes = require("./routes/auth-routes");
const meRoutes = require("./routes/me-routes");
const countriesRoutes = require("./routes/countries-routes");

const app = express();
const PORT = options.server.port || 8081;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// use routes
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/countries", countriesRoutes);

// start server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
