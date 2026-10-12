import { Router, RequestHandler } from 'express';
import { TeacherDashboardRepository } from './repositories/TeacherDashboardRepository';
import { TeacherDashboardService } from './services/TeacherDashboardService';
import { TeacherDashboardController } from './controllers/TeacherDashboardController';
import { createTeacherRouter } from './routes/teacher.routes';

export interface TeacherModuleComponents {
  router: Router;
  teacherDashboardController: TeacherDashboardController;
  teacherDashboardService: TeacherDashboardService;
  teacherDashboardRepository: TeacherDashboardRepository;
}

export function initTeacherModule(authenticateMiddleware: RequestHandler): TeacherModuleComponents {
  // 1. Repositories
  const teacherDashboardRepository = new TeacherDashboardRepository();

  // 2. Services
  const teacherDashboardService = new TeacherDashboardService(teacherDashboardRepository);

  // 3. Controllers
  const teacherDashboardController = new TeacherDashboardController(teacherDashboardService);

  // 4. Router
  const router = createTeacherRouter({
    teacherDashboardController,
    authenticateMiddleware,
  });

  return {
    router,
    teacherDashboardController,
    teacherDashboardService,
    teacherDashboardRepository,
  };
}
