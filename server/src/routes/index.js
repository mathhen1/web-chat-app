import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getHealth } from '../controllers/health.controller.js';
import { login, register } from '../controllers/auth.controller.js';

const routes = Router();

routes.get('/', getHome);
routes.get('/health', getHealth);
routes.post('/auth/register', register);
routes.post('/auth/login', login);

export default routes;
