import { Router, RequestHandler } from 'express';
import { AdminDashboardRepository } from './repositories/AdminDashboardRepository';
import { ClassRepository } from './repositories/ClassRepository';
import { TeacherRepository } from './repositories/TeacherRepository';
import { TimetableRepository } from './repositories/TimetableRepository';
import { PasswordService } from '../auth/services/PasswordService';
import { AdminService } from './services/AdminService';
import { ClassService } from './services/ClassService';
import { TeacherService } from './services/TeacherService';
import { TimetableService } from './services/TimetableService';
import { AdminController } from './controllers/AdminController';
import { ClassController } from './controllers/ClassController';
import { TeacherController } from './controllers/TeacherController';
import { TimetableController } from './controllers/TimetableController';
import { createAdminRouter } from './routes/admin.routes';

export interface AdminModuleComponents {
  router: Router;
  adminController: AdminController;
  classController: ClassController;
  teacherController: TeacherController;
  timetableController: TimetableController;
  adminService: AdminService;
  classService: ClassService;
  teacherService: TeacherService;
  timetableService: TimetableService;
  adminDashboardRepository: AdminDashboardRepository;
  classRepository: ClassRepository;
  teacherRepository: TeacherRepository;
  timetableRepository: TimetableRepository;
}

export function initAdminModule(authenticateMiddleware: RequestHandler): AdminModuleComponents {
  // 1. Repositories
  const adminDashboardRepository = new AdminDashboardRepository();
  const classRepository = new ClassRepository();
  const teacherRepository = new TeacherRepository();
  const timetableRepository = new TimetableRepository();

  // 2. Services
  const passwordService = new PasswordService();
  const classService = new ClassService(classRepository);
  const teacherService = new TeacherService(teacherRepository, passwordService, classRepository);
  const adminService = new AdminService(adminDashboardRepository, classRepository);
  const timetableService = new TimetableService(
    timetableRepository,
    classRepository,
    teacherRepository
  );

  // 3. Controllers
  const adminController = new AdminController(adminService);
  const classController = new ClassController(classService);
  const teacherController = new TeacherController(teacherService);
  const timetableController = new TimetableController(timetableService);

  // 4. Router
  const router = createAdminRouter({
    adminController,
    classController,
    teacherController,
    timetableController,
    authenticateMiddleware,
  });

  return {
    router,
    adminController,
    classController,
    teacherController,
    timetableController,
    adminService,
    classService,
    teacherService,
    timetableService,
    adminDashboardRepository,
    classRepository,
    teacherRepository,
    timetableRepository,
  };
}
