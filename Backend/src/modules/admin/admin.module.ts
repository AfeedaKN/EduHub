import { Router, RequestHandler } from 'express';
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

export interface AdminModuleComponents {
  router: Router;
  adminController: AdminController;
  classController: ClassController;
  subjectController: SubjectController;
  teacherController: TeacherController;
  timetableController: TimetableController;
  examController: ExamController;
  studentDirectoryController: StudentDirectoryController;
  parentDirectoryController: ParentDirectoryController;
  adminAttendanceController: AdminAttendanceController;
  adminService: AdminService;
  classService: ClassService;
  subjectService: SubjectService;
  teacherService: TeacherService;
  timetableService: TimetableService;
  examService: ExamService;
  studentDirectoryService: StudentDirectoryService;
  parentDirectoryService: ParentDirectoryService;
  adminAttendanceService: AdminAttendanceService;
  adminDashboardRepository: AdminDashboardRepository;
  classRepository: ClassRepository;
  subjectRepository: SubjectRepository;
  teacherRepository: TeacherRepository;
  timetableRepository: TimetableRepository;
  examRepository: ExamRepository;
  studentDirectoryRepository: StudentDirectoryRepository;
  parentDirectoryRepository: ParentDirectoryRepository;
  adminAttendanceRepository: AdminAttendanceRepository;
}

export function initAdminModule(authenticateMiddleware: RequestHandler): AdminModuleComponents {
  const adminDashboardRepository = new AdminDashboardRepository();
  const classRepository = new ClassRepository();
  const subjectRepository = new SubjectRepository();
  const teacherRepository = new TeacherRepository();
  const timetableRepository = new TimetableRepository();
  const examRepository = new ExamRepository();
  const studentDirectoryRepository = new StudentDirectoryRepository();
  const parentDirectoryRepository = new ParentDirectoryRepository();
  const adminAttendanceRepository = new AdminAttendanceRepository();

  const passwordService = new PasswordService(10);
  const classService = new ClassService(classRepository);
  const subjectService = new SubjectService(subjectRepository, classRepository);
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
  const studentDirectoryService = new StudentDirectoryService(studentDirectoryRepository);
  const parentDirectoryService = new ParentDirectoryService(parentDirectoryRepository);
  const adminAttendanceService = new AdminAttendanceService(adminAttendanceRepository);

  const adminController = new AdminController(adminService);
  const classController = new ClassController(classService);
  const subjectController = new SubjectController(subjectService);
  const teacherController = new TeacherController(teacherService);
  const timetableController = new TimetableController(timetableService);
  const examController = new ExamController(examService);
  const studentDirectoryController = new StudentDirectoryController(studentDirectoryService);
  const parentDirectoryController = new ParentDirectoryController(parentDirectoryService);
  const adminAttendanceController = new AdminAttendanceController(adminAttendanceService);

  const router = createAdminRouter({
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

  return {
    router,
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
}
