import { Router, RequestHandler } from 'express';
import { AdminDashboardRepository } from './repositories/AdminDashboardRepository';
import { ClassRepository } from './repositories/ClassRepository';
import { TeacherRepository } from './repositories/TeacherRepository';
import { TimetableRepository } from './repositories/TimetableRepository';
import { ExamRepository } from './repositories/ExamRepository';
import { PasswordService } from '../auth/services/PasswordService';
import { AdminService } from './services/AdminService';
import { ClassService } from './services/ClassService';
import { TeacherService } from './services/TeacherService';
import { TimetableService } from './services/TimetableService';
import { ExamService } from './services/ExamService';
import { AdminController } from './controllers/AdminController';
import { ClassController } from './controllers/ClassController';
import { TeacherController } from './controllers/TeacherController';
import { TimetableController } from './controllers/TimetableController';
import { ExamController } from './controllers/ExamController';
import { createAdminRouter } from './routes/admin.routes';

export interface AdminModuleComponents {
  router: Router;
  adminController: AdminController;
  classController: ClassController;
  teacherController: TeacherController;
  timetableController: TimetableController;
  examController: ExamController;
  adminService: AdminService;
  classService: ClassService;
  teacherService: TeacherService;
  timetableService: TimetableService;
  examService: ExamService;
  adminDashboardRepository: AdminDashboardRepository;
  classRepository: ClassRepository;
  teacherRepository: TeacherRepository;
  timetableRepository: TimetableRepository;
  examRepository: ExamRepository;
}

export function initAdminModule(authenticateMiddleware: RequestHandler): AdminModuleComponents {
  const adminDashboardRepository = new AdminDashboardRepository();
  const classRepository = new ClassRepository();
  const teacherRepository = new TeacherRepository();
  const timetableRepository = new TimetableRepository();
  const examRepository = new ExamRepository();

  const passwordService = new PasswordService(10);
  const classService = new ClassService(classRepository);
  const teacherService = new TeacherService(teacherRepository, passwordService, classRepository);
  const adminService = new AdminService(adminDashboardRepository, classRepository);
  const timetableService = new TimetableService(
    timetableRepository,
    classRepository,
    teacherRepository
  );
  const examService = new ExamService(
    examRepository,
    classRepository,
    teacherRepository
  );

  const adminController = new AdminController(adminService);
  const classController = new ClassController(classService);
  const teacherController = new TeacherController(teacherService);
  const timetableController = new TimetableController(timetableService);
  const examController = new ExamController(examService);

  const router = createAdminRouter({
    adminController,
    classController,
    teacherController,
    timetableController,
    examController,
    authenticateMiddleware,
  });

  return {
    router,
    adminController,
    classController,
    teacherController,
    timetableController,
    examController,
    adminService,
    classService,
    teacherService,
    timetableService,
    examService,
    adminDashboardRepository,
    classRepository,
    teacherRepository,
    timetableRepository,
    examRepository,
  };
}
