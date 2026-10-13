import { Router, RequestHandler } from 'express';
import { TeacherDashboardController } from '../controllers/TeacherDashboardController';
import { AttendanceController } from '../controllers/AttendanceController';
import { authorizeRoles } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '../../auth/dtos/auth.dto';

export interface TeacherRoutesDependencies {
  teacherDashboardController: TeacherDashboardController;
  attendanceController?: AttendanceController;
  authenticateMiddleware: RequestHandler;
}

export function createTeacherRouter(deps: TeacherRoutesDependencies): Router {
  const router = Router();
  const { teacherDashboardController, attendanceController, authenticateMiddleware } = deps;

  // Protect all Teacher endpoints with JWT authentication and TEACHER role authorization
  router.use(authenticateMiddleware, authorizeRoles(UserRole.TEACHER));

  // Dashboard Aggregated Overview
  router.get('/dashboard', teacherDashboardController.getDashboard);

  // Assigned Classes
  router.get('/classes', teacherDashboardController.getClasses);

  // Assigned Students
  router.get('/students', teacherDashboardController.getStudents);

  // Weekly Timetable
  router.get('/timetable', teacherDashboardController.getTimetable);

  // Daily Attendance
  if (attendanceController) {
    router.get('/attendance', attendanceController.getAttendance);
    router.post('/attendance', attendanceController.saveAttendance);
    router.put('/attendance', attendanceController.updateAttendance);
    router.get('/attendance/history', attendanceController.getHistory);
  }

  return router;
}
