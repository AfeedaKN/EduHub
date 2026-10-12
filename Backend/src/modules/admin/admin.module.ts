import { Router, RequestHandler } from 'express';
import { AdminDashboardRepository } from './repositories/AdminDashboardRepository';
import { ClassRepository } from './repositories/ClassRepository';
import { TeacherRepository } from './repositories/TeacherRepository';
import { PasswordService } from '../auth/services/PasswordService';
import { AdminService } from './services/AdminService';
import { ClassService } from './services/ClassService';
import { TeacherService } from './services/TeacherService';
import { AdminController } from './controllers/AdminController';
import { ClassController } from './controllers/ClassController';
import { TeacherController } from './controllers/TeacherController';
import { createAdminRouter } from './routes/admin.routes';

export interface AdminModuleComponents {
  router: Router;
  adminController: AdminController;
  classController: ClassController;
  teacherController: TeacherController;
  adminService: AdminService;
  classService: ClassService;
  teacherService: TeacherService;
  adminDashboardRepository: AdminDashboardRepository;
  classRepository: ClassRepository;
  teacherRepository: TeacherRepository;
}

export function initAdminModule(authenticateMiddleware: RequestHandler): AdminModuleComponents {
  // 1. Repositories
  const adminDashboardRepository = new AdminDashboardRepository();
  const classRepository = new ClassRepository();
  const teacherRepository = new TeacherRepository();

  // 2. Services
  const passwordService = new PasswordService();
  const classService = new ClassService(classRepository);
  const teacherService = new TeacherService(teacherRepository, passwordService);
  const adminService = new AdminService(adminDashboardRepository, classRepository);

  // 3. Controllers
  const adminController = new AdminController(adminService);
  const classController = new ClassController(classService);
  const teacherController = new TeacherController(teacherService);

  // 4. Router
  const router = createAdminRouter({
    adminController,
    classController,
    teacherController,
    authenticateMiddleware,
  });

  return {
    router,
    adminController,
    classController,
    teacherController,
    adminService,
    classService,
    teacherService,
    adminDashboardRepository,
    classRepository,
    teacherRepository,
  };
}
