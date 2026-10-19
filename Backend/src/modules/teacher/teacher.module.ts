import { Router, RequestHandler } from 'express';
import { TeacherDashboardRepository } from './repositories/TeacherDashboardRepository';
import { TeacherDashboardService } from './services/TeacherDashboardService';
import { TeacherDashboardController } from './controllers/TeacherDashboardController';
import { AttendanceRepository } from './repositories/AttendanceRepository';
import { AttendanceService } from './services/AttendanceService';
import { AttendanceController } from './controllers/AttendanceController';
import { AssignmentRepository } from './repositories/AssignmentRepository';
import { AssignmentService } from './services/AssignmentService';
import { AssignmentController } from './controllers/AssignmentController';
import { createTeacherRouter } from './routes/teacher.routes';

export interface TeacherModuleComponents {
  router: Router;
  teacherDashboardController: TeacherDashboardController;
  teacherDashboardService: TeacherDashboardService;
  teacherDashboardRepository: TeacherDashboardRepository;
  attendanceController: AttendanceController;
  attendanceService: AttendanceService;
  attendanceRepository: AttendanceRepository;
  assignmentController: AssignmentController;
  assignmentService: AssignmentService;
  assignmentRepository: AssignmentRepository;
}

export function initTeacherModule(authenticateMiddleware: RequestHandler): TeacherModuleComponents {
  const teacherDashboardRepository = new TeacherDashboardRepository();
  const attendanceRepository = new AttendanceRepository();
  const assignmentRepository = new AssignmentRepository();

  const teacherDashboardService = new TeacherDashboardService(teacherDashboardRepository);
  const attendanceService = new AttendanceService(attendanceRepository);
  const assignmentService = new AssignmentService(assignmentRepository);

  const teacherDashboardController = new TeacherDashboardController(teacherDashboardService);
  const attendanceController = new AttendanceController(attendanceService);
  const assignmentController = new AssignmentController(assignmentService);

  const router = createTeacherRouter({
    teacherDashboardController,
    attendanceController,
    assignmentController,
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
    assignmentController,
    assignmentService,
    assignmentRepository,
  };
}
