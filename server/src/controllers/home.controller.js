function getHome(_request, response) {
  response.json({ message: 'WebChat API is running' });
}

module.exports = { getHome };
