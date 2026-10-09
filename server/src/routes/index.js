import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getHealth } from '../controllers/health.controller.js';

const routes = Router();

routes.get('/', getHome);
routes.get('/health', getHealth);

export default routes;
