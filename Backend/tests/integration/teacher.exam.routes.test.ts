import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { ExamModel } from '../../src/modules/admin/models/Exam.model';
import { ExamScheduleModel } from '../../src/modules/admin/models/ExamSchedule.model';
import { ExamMarksModel } from '../../src/modules/admin/models/ExamMarks.model';

describe('Teacher Exam & Marks Routes Integration Tests', () => {
  const app = createApp();

  const tokenService = new TokenService(
    'eduhub_dev_access_secret_key_change_in_production_2026',
    '15m'
  );

  const teacherUserId = new mongoose.Types.ObjectId().toString();
  const strangerTeacherUserId = new mongoose.Types.ObjectId().toString();
  const adminUserId = new mongoose.Types.ObjectId().toString();

  const teacherToken = tokenService.generateAccessToken({
    sub: teacherUserId,
    email: 'teacher.examtest@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Prof. Eleanor Vance',
  });

  const strangerTeacherToken = tokenService.generateAccessToken({
    sub: strangerTeacherUserId,
    email: 'stranger.teacher@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Prof. Stranger',
  });

  const parentToken = tokenService.generateAccessToken({
    sub: new mongoose.Types.ObjectId().toString(),
    email: 'parent.examtest@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent User',
  });

  const adminToken = tokenService.generateAccessToken({
    sub: adminUserId,
    email: 'admin.examtest@eduhub.school',
    role: UserRole.MANAGEMENT,
    fullName: 'School Admin',
  });

  let testClassId: mongoose.Types.ObjectId;
  let testExamId: string;
  let authorizedScheduleId: string;
  let unauthorizedScheduleId: string;
  let student1Id: string;
  let student2Id: string;

  beforeAll(async () => {
    await connectDatabase();

    testClassId = new mongoose.Types.ObjectId();

    // 1. Create Teacher 1 (assigned to Grade 10-A Math)
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(teacherUserId),
      fullName: 'Prof. Eleanor Vance',
      email: 'teacher.examtest@eduhub.school',
      phone: '+1 555-1234',
      passwordHash: 'dummyhash',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(teacherUserId),
      employeeId: 'EMP-EXAM-01',
      fullName: 'Prof. Eleanor Vance',
      email: 'teacher.examtest@eduhub.school',
      phone: '+1 555-1234',
      qualification: 'M.Sc. Mathematics',
      designation: 'Senior Faculty',
      department: 'Mathematics',
      status: 'ACTIVE',
      assignedClasses: [
        {
          classId: testClassId,
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          academicYear: '2026-2027',
        },
      ],
    });

    // 2. Create Stranger Teacher (assigned to Grade 12-B Physics)
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(strangerTeacherUserId),
      fullName: 'Prof. Stranger',
      email: 'stranger.teacher@eduhub.school',
      phone: '+1 555-5678',
      passwordHash: 'dummyhash',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(strangerTeacherUserId),
      employeeId: 'EMP-EXAM-02',
      fullName: 'Prof. Stranger',
      email: 'stranger.teacher@eduhub.school',
      phone: '+1 555-5678',
      status: 'ACTIVE',
      assignedClasses: [
        {
          className: 'Grade 12',
          section: 'B',
          subject: 'Physics',
          academicYear: '2026-2027',
        },
      ],
    });

    // 3. Create Students in Grade 10-A
    const parentId = new mongoose.Types.ObjectId();
    const s1 = await StudentModel.create({
      parentId,
      fullName: 'Johnathan Doe',
      studentId: 'STU-EXAM-01',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: '101',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    student1Id = s1._id.toString();

    const s2 = await StudentModel.create({
      parentId,
      fullName: 'Samantha Smith',
      studentId: 'STU-EXAM-02',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: '102',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    student2Id = s2._id.toString();

    // 4. Create Exam & Schedules
    const examDoc = await ExamModel.create({
      name: 'Mid-Term Institutional Examination 2026',
      examType: 'MID_TERM',
      academicYear: '2026-2027',
      applicableClasses: [
        { classId: testClassId, className: 'Grade 10' },
      ],
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-20'),
      status: 'SCHEDULED',
    });
    testExamId = examDoc._id.toString();

    // Schedule 1: Grade 10-A Mathematics (Teacher 1 is authorized)
    const sch1 = await ExamScheduleModel.create({
      examId: examDoc._id,
      academicYear: '2026-2027',
      classId: testClassId,
      className: 'Grade 10',
      section: 'A',
      subject: 'Mathematics',
      examDate: new Date('2026-11-05'),
      startTime: '09:30',
      endTime: '12:30',
      maxMarks: 100,
      passingMarks: 40,
      roomNumber: 'Room 201',
    });
    authorizedScheduleId = sch1._id.toString();

    // Schedule 2: Grade 12-B Physics (Teacher 1 is NOT authorized)
    const sch2 = await ExamScheduleModel.create({
      examId: examDoc._id,
      academicYear: '2026-2027',
      classId: new mongoose.Types.ObjectId(),
      className: 'Grade 12',
      section: 'B',
      subject: 'Physics',
      examDate: new Date('2026-11-08'),
      startTime: '10:00',
      endTime: '13:00',
      maxMarks: 75,
      passingMarks: 30,
      roomNumber: 'Physics Lab',
    });
    unauthorizedScheduleId = sch2._id.toString();
  });

  afterAll(async () => {
    await ExamMarksModel.deleteMany({ examId: testExamId });
    await ExamScheduleModel.deleteMany({ examId: testExamId });
    await ExamModel.findByIdAndDelete(testExamId);
    await StudentModel.deleteMany({ studentId: { $in: ['STU-EXAM-01', 'STU-EXAM-02'] } });
    await TeacherModel.deleteMany({ employeeId: { $in: ['EMP-EXAM-01', 'EMP-EXAM-02'] } });
    await UserModel.deleteMany({ email: { $in: ['teacher.examtest@eduhub.school', 'stranger.teacher@eduhub.school'] } });
    await disconnectDatabase();
  });

  describe('Route Security & Role Authorization', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/teacher/exams');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects parent role from teacher exams with 403', async () => {
      const res = await request(app)
        .get('/api/v1/teacher/exams')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/teacher/exams', () => {
    it('returns only the exam schedules authorized for the authenticated teacher', async () => {
      const res = await request(app)
        .get('/api/v1/teacher/exams')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.assignedExams).toBe(1);
      expect(res.body.data.schedules).toHaveLength(1);

      const sch = res.body.data.schedules[0];
      expect(sch.id).toBe(authorizedScheduleId);
      expect(sch.subject).toBe('Mathematics');
      expect(sch.className).toBe('Grade 10');
      expect(sch.section).toBe('A');
      expect(sch.marksStatus).toBe('PENDING');
    });

    it('supports query filtering by academicYear, class, and status', async () => {
      const res = await request(app)
        .get('/api/v1/teacher/exams?academicYear=2026-2027&className=Grade 10&status=PENDING')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.schedules).toHaveLength(1);
    });
  });

  describe('GET /api/v1/teacher/exams/schedules/:scheduleId', () => {
    it('returns official roster and schedule details for authorized schedule', async () => {
      const res = await request(app)
        .get(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isReadOnly).toBe(false);
      expect(res.body.data.schedule.id).toBe(authorizedScheduleId);
      expect(res.body.data.students).toHaveLength(2);
      expect(res.body.data.summary.totalStudents).toBe(2);
      expect(res.body.data.summary.enteredCount).toBe(0);
      expect(res.body.data.summary.remainingCount).toBe(2);
    });

    it('rejects access to unauthorized exam schedule with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/teacher/exams/schedules/${unauthorizedScheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/teacher/exams/schedules/:scheduleId/draft', () => {
    it('successfully saves draft marks and allows reopening', async () => {
      const draftPayload = {
        records: [
          {
            studentId: student1Id,
            marksObtained: 85,
            isAbsent: false,
            remarks: 'Strong conceptual foundation',
          },
          {
            studentId: student2Id,
            marksObtained: null,
            isAbsent: true,
            remarks: 'Sick leave',
          },
        ],
      };

      const res = await request(app)
        .post(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}/draft`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(draftPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schedule.marksStatus).toBe('DRAFT');
      expect(res.body.data.isReadOnly).toBe(false);
      expect(res.body.data.summary.enteredCount).toBe(2);

      // Verify reopening via GET
      const getRes = await request(app)
        .get(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.schedule.marksStatus).toBe('DRAFT');
      const s1 = getRes.body.data.students.find((s: any) => s.studentId === student1Id);
      expect(s1.marksObtained).toBe(85);
      const s2 = getRes.body.data.students.find((s: any) => s.studentId === student2Id);
      expect(s2.isAbsent).toBe(true);
      expect(s2.marksObtained).toBeNull();
    });

    it('rejects marks exceeding maximum marks with 400 Validation Error', async () => {
      const invalidPayload = {
        records: [
          {
            studentId: student1Id,
            marksObtained: 150, // maxMarks is 100
            isAbsent: false,
          },
        ],
      };

      const res = await request(app)
        .post(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}/draft`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthorized teacher trying to save draft marks with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}/draft`)
        .set('Authorization', `Bearer ${strangerTeacherToken}`)
        .send({ records: [] });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/teacher/exams/schedules/:scheduleId/submit', () => {
    it('rejects submission if any enrolled student is missing marks', async () => {
      const incompletePayload = {
        records: [
          {
            studentId: student1Id,
            marksObtained: 90,
            isAbsent: false,
          },
          // student2 is omitted!
        ],
      };

      const res = await request(app)
        .post(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}/submit`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(incompletePayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('submits marks for review and makes them read-only', async () => {
      const completePayload = {
        records: [
          {
            studentId: student1Id,
            marksObtained: 95,
            isAbsent: false,
            remarks: 'Outstanding score',
          },
          {
            studentId: student2Id,
            marksObtained: null,
            isAbsent: true,
            remarks: 'Official medical absence',
          },
        ],
      };

      const res = await request(app)
        .post(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}/submit`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(completePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schedule.marksStatus).toBe('SUBMITTED');
      expect(res.body.data.isReadOnly).toBe(true);
      expect(res.body.data.schedule.marksSubmittedByName).toBe('Prof. Eleanor Vance');
    });

    it('rejects editing after submission with 403 Forbidden', async () => {
      const attemptEditPayload = {
        records: [
          {
            studentId: student1Id,
            marksObtained: 99,
          },
        ],
      };

      const res = await request(app)
        .post(`/api/v1/teacher/exams/schedules/${authorizedScheduleId}/draft`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(attemptEditPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Management Access Integration', () => {
    it('allows Management to view submitted marks for review', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/exams/${testExamId}/schedules/${authorizedScheduleId}/marks`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.marks).toBeDefined();
      expect(res.body.data.marks.status).toBe('SUBMITTED');
      expect(res.body.data.marks.teacherName).toBe('Prof. Eleanor Vance');
      expect(res.body.data.marks.students).toHaveLength(2);
      expect(res.body.data.marks.students[0].marksObtained).toBe(95);
      expect(res.body.data.marks.students[1].isAbsent).toBe(true);
    });
  });
});
