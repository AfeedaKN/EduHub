import { AdminDashboardRepository } from './repositories/AdminDashboardRepository';
import { ClassRepository } from './repositories/ClassRepository';
import { SubjectRepository } from './repositories/SubjectRepository';
import { TeacherRepository } from './repositories/TeacherRepository';
import { TimetableRepository } from './repositories/TimetableRepository';
import { ExamRepository } from './repositories/ExamRepository';
import { StudentDirectoryRepository } from './repositories/StudentDirectoryRepository';
import { ParentDirectoryRepository } from './repositories/ParentDirectoryRepository';
import { AdminAttendanceRepository } from './repositories/AdminAttendanceRepository';
import { PasswordService } from '../auth/services/PasswordService';
import { AdminService } from './services/AdminService';
import { ClassService } from './services/ClassService';
import { SubjectService } from './services/SubjectService';
import { TeacherService } from './services/TeacherService';
import { TimetableService } from './services/TimetableService';
import { ExamService } from './services/ExamService';
import { StudentDirectoryService } from './services/StudentDirectoryService';
import { ParentDirectoryService } from './services/ParentDirectoryService';
import { AdminAttendanceService } from './services/AdminAttendanceService';
import { AdminController } from './controllers/AdminController';
import { ClassController } from './controllers/ClassController';
import { SubjectController } from './controllers/SubjectController';
import { TeacherController } from './controllers/TeacherController';
import { TimetableController } from './controllers/TimetableController';
import { ExamController } from './controllers/ExamController';
import { StudentDirectoryController } from './controllers/StudentDirectoryController';
import { ParentDirectoryController } from './controllers/ParentDirectoryController';
import { AdminAttendanceController } from './controllers/AdminAttendanceController';
import { createAdminRouter } from './routes/admin.routes';
import { authenticateMiddleware } from '../auth';
import { AdminModuleComponents } from './admin.module';

export const adminDashboardRepository = new AdminDashboardRepository();
export const classRepository = new ClassRepository();
export const subjectRepository = new SubjectRepository();
export const teacherRepository = new TeacherRepository();
export const timetableRepository = new TimetableRepository();
export const examRepository = new ExamRepository();
export const studentDirectoryRepository = new StudentDirectoryRepository();
export const parentDirectoryRepository = new ParentDirectoryRepository();
export const adminAttendanceRepository = new AdminAttendanceRepository();

export const passwordService = new PasswordService(10);
export const classService = new ClassService(classRepository);
export const subjectService = new SubjectService(subjectRepository, classRepository);
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
export const studentDirectoryService = new StudentDirectoryService(studentDirectoryRepository);
export const parentDirectoryService = new ParentDirectoryService(parentDirectoryRepository);
export const adminAttendanceService = new AdminAttendanceService(adminAttendanceRepository);

export const adminController = new AdminController(adminService);
export const classController = new ClassController(classService);
export const subjectController = new SubjectController(subjectService);
export const teacherController = new TeacherController(teacherService);
export const timetableController = new TimetableController(timetableService);
export const examController = new ExamController(examService);
export const studentDirectoryController = new StudentDirectoryController(studentDirectoryService);
export const parentDirectoryController = new ParentDirectoryController(parentDirectoryService);
export const adminAttendanceController = new AdminAttendanceController(adminAttendanceService);

export const adminRouter = createAdminRouter({
  adminController,
  classController,
  subjectController,
  teacherController,
  timetableController,
  examController,
  studentDirectoryController,
  parentDirectoryController,
  adminAttendanceController,
  authenticateMiddleware,
});

export const adminModule: AdminModuleComponents = {
  router: adminRouter,
  adminController,
  classController,
  subjectController,
  teacherController,
  timetableController,
  examController,
  studentDirectoryController,
  parentDirectoryController,
  adminAttendanceController,
  adminService,
  classService,
  subjectService,
  teacherService,
  timetableService,
  examService,
  studentDirectoryService,
  parentDirectoryService,
  adminAttendanceService,
  adminDashboardRepository,
  classRepository,
  subjectRepository,
  teacherRepository,
  timetableRepository,
  examRepository,
  studentDirectoryRepository,
  parentDirectoryRepository,
  adminAttendanceRepository,
};
