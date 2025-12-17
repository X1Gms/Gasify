const { Router } = require("express");

// import middlewares
const { requireAuth } = require("../middlewares/require-auth");

// import handlers
const {
  getCountriesHandler,
} = require("../request-handlers/countries/get-countries");

const router = Router();

// routes
router.get("/", getCountriesHandler);

module.exports = router;
