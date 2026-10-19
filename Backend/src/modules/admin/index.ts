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
import { authenticateMiddleware } from '../auth';
import { AdminModuleComponents } from './admin.module';

export const adminDashboardRepository = new AdminDashboardRepository();
export const classRepository = new ClassRepository();
export const teacherRepository = new TeacherRepository();
export const timetableRepository = new TimetableRepository();
export const examRepository = new ExamRepository();

export const passwordService = new PasswordService(10);
export const classService = new ClassService(classRepository);
export const teacherService = new TeacherService(teacherRepository, passwordService, classRepository);
export const adminService = new AdminService(adminDashboardRepository, classRepository);
export const timetableService = new TimetableService(
  timetableRepository,
  classRepository,
  teacherRepository
);
export const examService = new ExamService(
  examRepository,
  classRepository,
  teacherRepository
);

export const adminController = new AdminController(adminService);
export const classController = new ClassController(classService);
export const teacherController = new TeacherController(teacherService);
export const timetableController = new TimetableController(timetableService);
export const examController = new ExamController(examService);

export const adminRouter = createAdminRouter({
  adminController,
  classController,
  teacherController,
  timetableController,
  examController,
  authenticateMiddleware,
});

export const adminModule: AdminModuleComponents = {
  router: adminRouter,
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
