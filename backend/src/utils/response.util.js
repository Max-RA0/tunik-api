const { v4: uuidv4 } = require('uuid');

const success = (res, data, msg = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    ok: true,
    data,
    msg
  });
};

const created = (res, data, msg = 'Recurso creado exitosamente') => {
  return success(res, data, msg, 201);
};

const noContent = (res) => {
  return res.status(204).send();
};

const error = (res, msg = 'Error en la operación', statusCode = 400, details = null) => {
  const response = {
    ok: false,
    msg
  };
  if (details) {
    response.error = details;
  }
  return res.status(statusCode).json(response);
};

const notFound = (res, msg = 'Recurso no encontrado') => {
  return error(res, msg, 404);
};

const unauthorized = (res, msg = 'No autorizado') => {
  return error(res, msg, 401);
};

const forbidden = (res, msg = 'Acceso denegado') => {
  return error(res, msg, 403);
};

const conflict = (res, msg = 'Conflicto con el recurso') => {
  return error(res, msg, 409);
};

const validationError = (res, errors) => {
  return res.status(400).json({
    ok: false,
    msg: 'Error de validación',
    errors
  });
};

module.exports = {
  success,
  created,
  noContent,
  error,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  validationError
};
