import { Router, RequestHandler } from 'express';
import { TeacherDashboardController } from '../controllers/TeacherDashboardController';
import { authorizeRoles } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '../../auth/dtos/auth.dto';

export interface TeacherRoutesDependencies {
  teacherDashboardController: TeacherDashboardController;
  authenticateMiddleware: RequestHandler;
}

export function createTeacherRouter(deps: TeacherRoutesDependencies): Router {
  const router = Router();
  const { teacherDashboardController, authenticateMiddleware } = deps;

  // Protect all Teacher endpoints with JWT authentication and TEACHER role authorization
  router.use(authenticateMiddleware, authorizeRoles(UserRole.TEACHER));

  // Dashboard Aggregated Overview
  router.get('/dashboard', teacherDashboardController.getDashboard);

  // Assigned Classes
  router.get('/classes', teacherDashboardController.getClasses);

  // Assigned Students
  router.get('/students', teacherDashboardController.getStudents);

  return router;
}
