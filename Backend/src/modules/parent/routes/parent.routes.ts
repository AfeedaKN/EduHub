import { Router, RequestHandler } from 'express';
import { ParentController } from '../controllers/ParentController';
import { validateRequest } from '../../../shared/presentation/middleware/validateRequest';
import { createStudentRegistrationSchema } from '../validators/parent.validator';
import { authorizeRoles } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '../../auth/dtos/auth.dto';

export interface ParentRoutesDependencies {
  parentController: ParentController;
  authenticateMiddleware: RequestHandler;
}

export function createParentRouter(deps: ParentRoutesDependencies): Router {
  const router = Router();
  const { parentController, authenticateMiddleware } = deps;

  // Metadata endpoint (can be accessed by authenticated parent or for options)
  router.get('/meta', authenticateMiddleware, parentController.getMetadata);

  // Authenticated Parent Routes
  router.use(authenticateMiddleware, authorizeRoles(UserRole.PARENT));

  // Dashboard Aggregated Overview
  router.get('/dashboard', parentController.getDashboard);

  // Add Student Registration Request
  router.post(
    '/students/add',
    validateRequest(createStudentRegistrationSchema),
    parentController.createRegistrationRequest
  );

  // Registration Requests List
  router.get('/registration-requests', parentController.getRegistrationRequests);

  // Children List
  router.get('/children', parentController.getChildren);

  return router;
}
