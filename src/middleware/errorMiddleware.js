// 404 Handler
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
