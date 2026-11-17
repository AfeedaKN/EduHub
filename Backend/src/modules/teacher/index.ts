import { TeacherDashboardRepository } from './repositories/TeacherDashboardRepository';
import { TeacherDashboardService } from './services/TeacherDashboardService';
import { TeacherDashboardController } from './controllers/TeacherDashboardController';
import { AttendanceRepository } from './repositories/AttendanceRepository';
import { AttendanceService } from './services/AttendanceService';
import { AttendanceController } from './controllers/AttendanceController';
import { AssignmentRepository } from './repositories/AssignmentRepository';
import { AssignmentService } from './services/AssignmentService';
import { AssignmentController } from './controllers/AssignmentController';
import { TeacherExamRepository } from './repositories/TeacherExamRepository';
import { TeacherExamService } from './services/TeacherExamService';
import { TeacherExamController } from './controllers/TeacherExamController';
import { StudyMaterialRepository } from './repositories/StudyMaterialRepository';
import { StudyMaterialService } from './services/StudyMaterialService';
import { StudyMaterialController } from './controllers/StudyMaterialController';
import { createTeacherRouter } from './routes/teacher.routes';
import { authenticateMiddleware } from '../auth';
import { TeacherModuleComponents } from './teacher.module';

export const teacherDashboardRepository = new TeacherDashboardRepository();
export const attendanceRepository = new AttendanceRepository();
export const assignmentRepository = new AssignmentRepository();
export const teacherExamRepository = new TeacherExamRepository();
export const studyMaterialRepository = new StudyMaterialRepository();

export const teacherDashboardService = new TeacherDashboardService(teacherDashboardRepository);
export const attendanceService = new AttendanceService(attendanceRepository);
export const assignmentService = new AssignmentService(assignmentRepository);
export const teacherExamService = new TeacherExamService(teacherExamRepository);
export const studyMaterialService = new StudyMaterialService(studyMaterialRepository);

export const teacherDashboardController = new TeacherDashboardController(teacherDashboardService);
export const attendanceController = new AttendanceController(attendanceService);
export const assignmentController = new AssignmentController(assignmentService);
export const teacherExamController = new TeacherExamController(teacherExamService);
export const studyMaterialController = new StudyMaterialController(studyMaterialService);

export const teacherRouter = createTeacherRouter({
  teacherDashboardController,
  attendanceController,
  assignmentController,
  teacherExamController,
  studyMaterialController,
  authenticateMiddleware,
});

export const teacherModule: TeacherModuleComponents = {
  router: teacherRouter,
  teacherDashboardController,
  teacherDashboardService,
  teacherDashboardRepository,
  attendanceController,
  attendanceService,
  attendanceRepository,
  assignmentController,
  assignmentService,
  assignmentRepository,
  teacherExamController,
  teacherExamService,
  teacherExamRepository,
  studyMaterialController,
  studyMaterialService,
  studyMaterialRepository,
};
