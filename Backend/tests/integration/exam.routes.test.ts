import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { ClassModel } from '../../src/modules/admin/models/Class.model';
import { SectionModel } from '../../src/modules/admin/models/Section.model';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';
import { ExamModel } from '../../src/modules/admin/models/Exam.model';
import { ExamScheduleModel } from '../../src/modules/admin/models/ExamSchedule.model';

describe('Exam Routes Integration Tests', () => {
  const app = createApp();

  const tokenService = new TokenService(
    'eduhub_dev_access_secret_key_change_in_production_2026',
    '15m'
  );

  const managementToken = tokenService.generateAccessToken({
    sub: '65f1234567890abcdef12345',
    email: 'admin@eduhub.school',
    role: UserRole.MANAGEMENT,
    fullName: 'Admin User',
  });

  const parentToken = tokenService.generateAccessToken({
    sub: '65f1234567890abcdef12346',
    email: 'parent@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent User',
  });

  const teacherToken = tokenService.generateAccessToken({
    sub: '65f1234567890abcdef12347',
    email: 'teacher@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Teacher User',
  });

  let testClassId: string;
  let testClass2Id: string;
  let testSectionId: string;
  let testExamId: string;
  let testScheduleId: string;

  beforeAll(async () => {
    await connectDatabase();

    // Clean up test collections only (scoped to test items)
    await ExamModel.deleteMany({ name: { $in: ['Exam Test Exam 1', 'Exam Test Exam 2', 'Exam Test Update Exam'] } });
    await ClassModel.deleteMany({ name: { $in: ['Exam Test Grade 10', 'Exam Test Grade 9'] } });
    await SectionModel.deleteMany({ name: 'EXAM-A' });

    // Seed test class and section
    const cls1 = await ClassModel.create({
      name: 'Exam Test Grade 10',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    testClassId = cls1._id.toString();

    const cls2 = await ClassModel.create({
      name: 'Exam Test Grade 9',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    testClass2Id = cls2._id.toString();

    const sec = await SectionModel.create({
      classId: cls1._id,
      name: 'EXAM-A',
      academicYear: '2026-2027',
      capacity: 35,
      roomNumber: 'Room-501',
      status: 'ACTIVE',
    });
    testSectionId = sec._id.toString();

    // Assign teacher with subject to this class & section
    await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(),
      employeeId: 'EMP-EXAM-99',
      fullName: 'Dr. Exam Subject Teacher',
      email: 'examsubjectteacher@eduhub.school',
      phone: '9876543210',
      qualification: 'M.Sc B.Ed',
      designation: 'Senior Faculty',
      department: 'Mathematics',
      status: 'ACTIVE',
      assignedClasses: [
        {
          classId: cls1._id,
          className: 'Exam Test Grade 10',
          section: 'EXAM-A',
          subject: 'Advanced Mathematics',
          academicYear: '2026-2027',
        },
        {
          classId: cls1._id,
          className: 'Exam Test Grade 10',
          section: 'EXAM-A',
          subject: 'Physics',
          academicYear: '2026-2027',
        },
      ],
    });
  });

  afterAll(async () => {
    if (testExamId) {
      await ExamScheduleModel.deleteMany({ examId: testExamId });
      await ExamModel.findByIdAndDelete(testExamId);
    }
    await ExamModel.deleteMany({ name: { $in: ['Exam Test Exam 1', 'Exam Test Exam 2', 'Exam Test Update Exam'] } });
    await ClassModel.deleteMany({ name: { $in: ['Exam Test Grade 10', 'Exam Test Grade 9'] } });
    await SectionModel.deleteMany({ name: 'EXAM-A' });
    await TeacherModel.deleteMany({ employeeId: 'EMP-EXAM-99' });
    await disconnectDatabase();
  });

  // ==========================================
  // Security & Authorization
  // ==========================================

  it('GET /api/v1/admin/exams without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/admin/exams');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/exams with Parent token should return 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/exams')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/exams with Teacher token should return 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/exams')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ==========================================
  // Summary & Valid Subjects
  // ==========================================

  it('GET /api/v1/admin/exams/summary with Management token should return 200 with stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/exams/summary')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalExams).toBe('number');
    expect(typeof res.body.data.upcomingExams).toBe('number');
    expect(typeof res.body.data.completedExams).toBe('number');
    expect(typeof res.body.data.publishedResults).toBe('number');
  });

  it('GET /api/v1/admin/exams/classes/:classId/sections/:section/subjects should return valid subjects', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/exams/classes/${testClassId}/sections/EXAM-A/subjects`)
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toContain('Advanced Mathematics');
    expect(res.body.data).toContain('Physics');
  });

  // ==========================================
  // Exam Creation & Listing
  // ==========================================

  it('POST /api/v1/admin/exams with missing fields should return 400 ValidationError', async () => {
    const res = await request(app)
      .post('/api/v1/admin/exams')
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        name: '',
        academicYear: '2026-2027',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/admin/exams with end date earlier than start date should return 400', async () => {
    const res = await request(app)
      .post('/api/v1/admin/exams')
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        name: 'Invalid Date Exam',
        examType: 'UNIT_TEST',
        academicYear: '2026-2027',
        applicableClassIds: [testClassId],
        startDate: '2026-11-20',
        endDate: '2026-11-10',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Exam end date cannot be earlier than start date');
  });

  it('POST /api/v1/admin/exams with valid payload should create examination', async () => {
    const res = await request(app)
      .post('/api/v1/admin/exams')
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        name: 'First Term Examination 2026',
        examType: 'FIRST_TERM',
        academicYear: '2026-2027',
        applicableClassIds: [testClassId],
        startDate: '2026-11-10',
        endDate: '2026-11-25',
        description: 'Official first term exams for senior secondary',
        status: 'SCHEDULED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('First Term Examination 2026');
    expect(res.body.data.applicableClasses).toHaveLength(1);
    expect(res.body.data.applicableClasses[0].className).toBe('Exam Test Grade 10');
    testExamId = res.body.data.id;
  });

  it('GET /api/v1/admin/exams should list exams including scheduled count', async () => {
    const res = await request(app)
      .get('/api/v1/admin/exams?academicYear=2026-2027')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((e: any) => e.id === testExamId);
    expect(found).toBeDefined();
    expect(found.scheduledSubjectsCount).toBe(0);
  });

  it('GET /api/v1/admin/exams/:id should return single exam details', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/exams/${testExamId}`)
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testExamId);
    expect(res.body.data.name).toBe('First Term Examination 2026');
  });

  it('PUT /api/v1/admin/exams/:id should update exam details', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/exams/${testExamId}`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        description: 'Updated instructions: calculators allowed for physics and math',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toContain('calculators allowed');
  });

  // ==========================================
  // Schedule Management & Conflict Detection
  // ==========================================

  it('POST /api/v1/admin/exams/:id/schedules should reject non-applicable class', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        classId: testClass2Id, // Grade 9 was not added to applicableClasses
        section: 'A',
        subject: 'Advanced Mathematics',
        examDate: '2026-11-12',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 40,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not marked as applicable');
  });

  it('POST /api/v1/admin/exams/:id/schedules should reject invalid marks', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        classId: testClassId,
        section: 'EXAM-A',
        subject: 'Advanced Mathematics',
        examDate: '2026-11-12',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 50,
        passingMarks: 60, // passing > max marks
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('cannot exceed maximum marks');
  });

  it('POST /api/v1/admin/exams/:id/schedules should reject date outside exam date window', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        classId: testClassId,
        section: 'EXAM-A',
        subject: 'Advanced Mathematics',
        examDate: '2026-12-05', // Exam is 2026-11-10 to 2026-11-25
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 40,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('must fall within the examination window');
  });

  it('POST /api/v1/admin/exams/:id/schedules should schedule subject exam with valid details', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        classId: testClassId,
        section: 'EXAM-A',
        subject: 'Advanced Mathematics',
        examDate: '2026-11-12',
        startTime: '09:30',
        endTime: '12:30',
        maxMarks: 100,
        passingMarks: 40,
        roomNumber: 'Hall 101',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subject).toBe('Advanced Mathematics');
    expect(res.body.data.roomNumber).toBe('Hall 101');
    testScheduleId = res.body.data.id;
  });

  it('POST /api/v1/admin/exams/:id/schedules should return 409 Conflict when section has overlapping schedule', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        classId: testClassId,
        section: 'EXAM-A',
        subject: 'Physics',
        examDate: '2026-11-12',
        startTime: '10:00', // overlaps 09:30 - 12:30
        endTime: '11:30',
        maxMarks: 75,
        passingMarks: 30,
        roomNumber: 'Different Room',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('Schedule conflict');
  });

  it('POST /api/v1/admin/exams/:id/schedules should return 409 Conflict when room has overlapping schedule', async () => {
    // Add Grade 9 to applicable classes of test exam first to test room conflict across classes
    await request(app)
      .put(`/api/v1/admin/exams/${testExamId}`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        applicableClassIds: [testClassId, testClass2Id],
      });

    // Create section for Grade 9
    await SectionModel.create({
      classId: new mongoose.Types.ObjectId(testClass2Id),
      name: 'EXAM-A',
      academicYear: '2026-2027',
      capacity: 30,
      status: 'ACTIVE',
    });

    const res = await request(app)
      .post(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        classId: testClass2Id,
        section: 'EXAM-A',
        subject: 'Social Science',
        examDate: '2026-11-12',
        startTime: '11:00',
        endTime: '13:00', // overlaps 09:30 - 12:30
        maxMarks: 50,
        passingMarks: 20,
        roomNumber: 'Hall 101', // Same room as earlier schedule!
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('Room conflict');
  });

  it('GET /api/v1/admin/exams/:id/schedules should list scheduled subjects', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/exams/${testExamId}/schedules`)
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(testScheduleId);
  });

  it('PUT /api/v1/admin/exams/:id/schedules/:scheduleId should update schedule marks', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/exams/${testExamId}/schedules/${testScheduleId}`)
      .set('Authorization', `Bearer ${managementToken}`)
      .send({
        maxMarks: 80,
        passingMarks: 32,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.maxMarks).toBe(80);
    expect(res.body.data.passingMarks).toBe(32);
  });

  it('DELETE /api/v1/admin/exams/:id/schedules/:scheduleId should delete schedule item', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/exams/${testExamId}/schedules/${testScheduleId}`)
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/v1/admin/exams/:id should delete exam successfully', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/exams/${testExamId}`)
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const getRes = await request(app)
      .get(`/api/v1/admin/exams/${testExamId}`)
      .set('Authorization', `Bearer ${managementToken}`);
    expect(getRes.status).toBe(404);
  });
});
