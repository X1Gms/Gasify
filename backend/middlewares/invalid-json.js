/**
 * Middleware to handle invalid JSON body errors
 *
 * @param {Error} err
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function invalidJsonMiddleware(err, _, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  next(err);
}
module.exports.invalidJsonMiddleware = invalidJsonMiddleware;
