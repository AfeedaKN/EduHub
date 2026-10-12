import { Router, RequestHandler } from 'express';
import { AdminController } from '../controllers/AdminController';
import { ClassController } from '../controllers/ClassController';
import { TeacherController } from '../controllers/TeacherController';
import { authorizeRoles } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '../../auth/dtos/auth.dto';

export interface AdminRoutesDependencies {
  adminController: AdminController;
  classController: ClassController;
  teacherController: TeacherController;
  authenticateMiddleware: RequestHandler;
}

export function createAdminRouter(deps: AdminRoutesDependencies): Router {
  const router = Router();
  const { adminController, classController, teacherController, authenticateMiddleware } = deps;

  // Protect all Admin endpoints with JWT authentication and MANAGEMENT role authorization
  router.use(authenticateMiddleware, authorizeRoles(UserRole.MANAGEMENT));

  // Dashboard Aggregated Overview
  router.get('/dashboard', adminController.getDashboardSummary);

  // Admissions Summary Counts & Capacity (Specific routes before :id)
  router.get('/admissions/summary', adminController.getAdmissionCounts);
  router.get('/admissions/capacity', adminController.getClassCapacity);

  // Admissions List
  router.get('/admissions', adminController.getAdmissions);

  // Single Admission Detail & Decisions
  router.get('/admissions/:id', adminController.getAdmissionDetail);
  router.post('/admissions/:id/approve', adminController.approveAdmission);
  router.post('/admissions/:id/reject', adminController.rejectAdmission);

  // Classes & Sections Management
  router.get('/classes/summary', classController.getSummaryStats);
  router.get('/classes', classController.getClasses);
  router.post('/classes', classController.createClass);
  router.get('/classes/:id', classController.getClassById);
  router.put('/classes/:id', classController.updateClass);
  router.patch('/classes/:id/status', classController.changeClassStatus);
  router.delete('/classes/:id', classController.deleteClass);

  // Class Sections
  router.get('/classes/:classId/sections', classController.getSectionsForClass);
  router.post('/classes/:classId/sections', classController.createSection);
  router.put('/classes/:classId/sections/:sectionId', classController.updateSection);
  router.patch('/classes/:classId/sections/:sectionId/status', classController.changeSectionStatus);
  router.delete('/classes/:classId/sections/:sectionId', classController.deleteSection);

  // Teacher Management
  router.get('/teachers/summary', teacherController.getSummaryStats);
  router.get('/teachers', teacherController.getTeachers);
  router.post('/teachers', teacherController.createTeacher);
  router.get('/teachers/:id', teacherController.getTeacherById);
  router.put('/teachers/:id', teacherController.updateTeacher);
  router.patch('/teachers/:id/status', teacherController.changeTeacherStatus);
  router.delete('/teachers/:id', teacherController.deleteTeacher);

  return router;
}
