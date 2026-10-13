import { Router, RequestHandler } from 'express';
import { TeacherDashboardRepository } from './repositories/TeacherDashboardRepository';
import { TeacherDashboardService } from './services/TeacherDashboardService';
import { TeacherDashboardController } from './controllers/TeacherDashboardController';
import { AttendanceRepository } from './repositories/AttendanceRepository';
import { AttendanceService } from './services/AttendanceService';
import { AttendanceController } from './controllers/AttendanceController';
import { createTeacherRouter } from './routes/teacher.routes';

export interface TeacherModuleComponents {
  router: Router;
  teacherDashboardController: TeacherDashboardController;
  teacherDashboardService: TeacherDashboardService;
  teacherDashboardRepository: TeacherDashboardRepository;
  attendanceController: AttendanceController;
  attendanceService: AttendanceService;
  attendanceRepository: AttendanceRepository;
}

export function initTeacherModule(authenticateMiddleware: RequestHandler): TeacherModuleComponents {
  // 1. Repositories
  const teacherDashboardRepository = new TeacherDashboardRepository();
  const attendanceRepository = new AttendanceRepository();

  // 2. Services
  const teacherDashboardService = new TeacherDashboardService(teacherDashboardRepository);
  const attendanceService = new AttendanceService(attendanceRepository);

  // 3. Controllers
  const teacherDashboardController = new TeacherDashboardController(teacherDashboardService);
  const attendanceController = new AttendanceController(attendanceService);

  // 4. Router
  const router = createTeacherRouter({
    teacherDashboardController,
    attendanceController,
    authenticateMiddleware,
  });

  return {
    router,
    teacherDashboardController,
    teacherDashboardService,
    teacherDashboardRepository,
    attendanceController,
    attendanceService,
    attendanceRepository,
  };
}
