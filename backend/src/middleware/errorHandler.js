// Centralized error handler for all forwarded errors
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const body = { success: false, message: err.message || 'Internal server error' };
  if (err.currentVersion !== undefined) body.currentVersion = err.currentVersion;
  res.status(status).json(body);
}

module.exports = errorHandler;