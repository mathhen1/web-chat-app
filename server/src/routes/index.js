const { Router } = require('express');
const { getHome } = require('../controllers/home.controller');
const { getHealth } = require('../controllers/health.controller');

const routes = Router();

routes.get('/', getHome);
routes.get('/health', getHealth);

module.exports = routes;
