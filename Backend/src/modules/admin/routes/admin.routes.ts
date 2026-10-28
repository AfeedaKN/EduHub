import { Router, RequestHandler } from 'express';
import { AdminController } from '../controllers/AdminController';
import { ClassController } from '../controllers/ClassController';
import { SubjectController } from '../controllers/SubjectController';
import { TeacherController } from '../controllers/TeacherController';
import { TimetableController } from '../controllers/TimetableController';
import { ExamController } from '../controllers/ExamController';
import { StudentDirectoryController } from '../controllers/StudentDirectoryController';
import { ParentDirectoryController } from '../controllers/ParentDirectoryController';
import { AdminAttendanceController } from '../controllers/AdminAttendanceController';
import { authorizeRoles } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '../../auth/dtos/auth.dto';

export interface AdminRoutesDependencies {
  adminController: AdminController;
  classController: ClassController;
  subjectController: SubjectController;
  teacherController: TeacherController;
  timetableController: TimetableController;
  examController: ExamController;
  studentDirectoryController: StudentDirectoryController;
  parentDirectoryController: ParentDirectoryController;
  adminAttendanceController: AdminAttendanceController;
  authenticateMiddleware: RequestHandler;
}

export function createAdminRouter(deps: AdminRoutesDependencies): Router {
  const router = Router();
  const {
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
  } = deps;

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

  // Subjects Management
  router.get('/subjects/summary', subjectController.getSummaryStats);
  router.get('/subjects', subjectController.getSubjects);
  router.post('/subjects', subjectController.createSubject);
  router.get('/subjects/:id', subjectController.getSubjectById);
  router.get('/subjects/:id/references', subjectController.getSubjectReferences);
  router.put('/subjects/:id', subjectController.updateSubject);
  router.patch('/subjects/:id/status', subjectController.changeSubjectStatus);
  router.delete('/subjects/:id', subjectController.deleteSubject);

  // Teacher Management
  router.get('/teachers/summary', teacherController.getSummaryStats);
  router.get('/teachers/assignments/all', teacherController.getAllAssignments);
  router.get('/teachers', teacherController.getTeachers);
  router.post('/teachers', teacherController.createTeacher);
  router.get('/teachers/:id', teacherController.getTeacherById);
  router.put('/teachers/:id', teacherController.updateTeacher);
  router.patch('/teachers/:id/status', teacherController.changeTeacherStatus);
  router.delete('/teachers/:id', teacherController.deleteTeacher);

  // Teacher Class Assignments
  router.get('/teachers/:id/assignments', teacherController.getTeacherAssignments);
  router.post('/teachers/:id/assignments', teacherController.assignTeacherToClass);
  router.put('/teachers/:id/assignments/:assignmentId', teacherController.updateTeacherAssignment);
  router.delete('/teachers/:id/assignments/:assignmentId', teacherController.removeTeacherAssignment);

  // Master Academic Timetable Management
  router.get('/timetable', timetableController.getPeriods);
  router.post('/timetable', timetableController.createPeriod);
  router.get('/timetable/:id', timetableController.getPeriodById);
  router.put('/timetable/:id', timetableController.updatePeriod);
  router.delete('/timetable/:id', timetableController.deletePeriod);

  // Examinations & Subject-wise Scheduling Management
  router.get('/exams/summary', examController.getSummary);
  router.get('/exams/results-dashboard', examController.getResultsDashboard);
  router.get('/exams/classes/:classId/sections/:section/subjects', examController.getValidSubjects);
  router.get('/exams', examController.getExams);
  router.post('/exams', examController.createExam);
  router.get('/exams/:id', examController.getExamById);
  router.put('/exams/:id', examController.updateExam);
  router.delete('/exams/:id', examController.deleteExam);

  // Subject Schedules for an Exam
  router.get('/exams/:id/schedules', examController.getSchedules);
  router.post('/exams/:id/schedules', examController.createSchedule);
  router.get('/exams/:id/schedules/:scheduleId/marks', examController.getScheduleMarks);
  router.get('/exams/:id/schedules/:scheduleId/marks-review', examController.getScheduleMarksReview);
  router.post('/exams/:id/schedules/:scheduleId/marks/return', examController.returnScheduleMarks);
  router.post('/exams/:id/schedules/:scheduleId/marks/publish', examController.publishScheduleMarks);
  router.post('/exams/:id/schedules/:scheduleId/marks/reopen', examController.reopenScheduleMarks);
  router.put('/exams/:id/schedules/:scheduleId', examController.updateSchedule);
  router.delete('/exams/:id/schedules/:scheduleId', examController.deleteSchedule);

  // Students Directory
  router.get('/students/summary', studentDirectoryController.getSummary);
  router.get('/students', studentDirectoryController.getStudents);
  router.get('/students/:id', studentDirectoryController.getStudentById);
  router.put('/students/:id', studentDirectoryController.updateStudent);

  // Parents Directory
  router.get('/parents/summary', parentDirectoryController.getSummary);
  router.get('/parents', parentDirectoryController.getParents);
  router.get('/parents/:id', parentDirectoryController.getParentById);
  router.patch('/parents/:id/status', parentDirectoryController.updateStatus);

  // School Attendance Management
  router.get('/attendance/summary', adminAttendanceController.getSummary);
  router.get('/attendance/register', adminAttendanceController.getDailyRegister);
  router.get('/attendance/subject-wise-grid', adminAttendanceController.getSubjectWiseAttendanceGrid);
  router.post('/attendance/subject-wise-grid', adminAttendanceController.saveSubjectWiseAttendanceBatch);
  router.get('/attendance/classes-overview', adminAttendanceController.getClassesOverview);
  router.get('/attendance/submissions', adminAttendanceController.getSubmissionsMonitoring);
  router.get('/attendance/reports/monthly', adminAttendanceController.getMonthlyReport);
  router.get('/attendance/reports/low-attendance', adminAttendanceController.getLowAttendanceReport);
  router.get('/attendance/reports/student/:studentId', adminAttendanceController.getStudentHistory);
  router.post('/attendance/student/:studentId', adminAttendanceController.recordSingleStudentAttendance);
  router.put('/attendance/record/:id', adminAttendanceController.correctAttendanceRecord);

  return router;
}

