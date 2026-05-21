function notFound(req, res) {
  res.status(404).json({ message: "Маршрут не найден" });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _ = next;
  const status = err.statusCode || 500;
  const message = status === 500 ? "Ошибка сервера" : err.message;
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };

