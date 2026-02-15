const logger = require('../utils/logger.util');

const errorMiddleware = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      ok: false,
      msg: 'Error de validación',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      ok: false,
      msg: 'El registro ya existe',
      error: err.errors?.[0]?.message || 'Conflicto de unicidad'
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      ok: false,
      msg: 'Error de referencia: el registro relacionado no existe'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ok: false,
      msg: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ok: false,
      msg: 'Token expirado'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    ok: false,
    msg: statusCode === 500 ? 'Error interno del servidor' : message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorMiddleware;
