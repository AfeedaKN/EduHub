import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { AttendanceModel } from '../../src/modules/teacher/models/Attendance.model';
import { TimetablePeriodModel } from '../../src/modules/admin/models/TimetablePeriod.model';

describe('Teacher Routes Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  const tokenService = new TokenService(
    'eduhub_dev_access_secret_key_change_in_production_2026',
    '15m',
    'eduhub_dev_refresh_secret_key_change_in_production_2026',
    7
  );

  const teacherUserId = new mongoose.Types.ObjectId().toString();

  const teacherToken = tokenService.generateAccessToken({
    sub: teacherUserId,
    email: 'teacher.dashboard@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Prof. Marcus Vance',
  });

  const parentToken = tokenService.generateAccessToken({
    sub: '65f1234567890abcdef12346',
    email: 'parent@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent User',
  });

  const managementToken = tokenService.generateAccessToken({
    sub: '65f1234567890abcdef12345',
    email: 'admin@eduhub.school',
    role: UserRole.MANAGEMENT,
    fullName: 'Admin User',
  });

  it('GET /api/v1/teacher/dashboard without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/teacher/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/teacher/dashboard with Parent token should return 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/teacher/dashboard')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  it('GET /api/v1/teacher/dashboard with Management token should return 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/teacher/dashboard')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  describe('Authenticated Teacher Flow', () => {
    beforeAll(async () => {
      // Create user & teacher doc in DB for testing
      await UserModel.create({
        _id: new mongoose.Types.ObjectId(teacherUserId),
        fullName: 'Prof. Marcus Vance',
        email: 'teacher.dashboard@eduhub.school',
        phone: '+1 555-4321',
        passwordHash: 'dummy_hash',
        role: UserRole.TEACHER,
        status: 'ACTIVE',
      });

      await TeacherModel.create({
        userId: new mongoose.Types.ObjectId(teacherUserId),
        employeeId: 'TCH-TEST-01',
        fullName: 'Prof. Marcus Vance',
        email: 'teacher.dashboard@eduhub.school',
        phone: '+1 555-4321',
        department: 'Science',
        designation: 'Senior Teacher',
        status: 'ACTIVE',
        assignedClasses: [
          {
            className: 'Grade 8',
            section: 'A',
            subject: 'Physics',
          },
        ],
      });
    });

    afterAll(async () => {
      await TeacherModel.deleteMany({ email: 'teacher.dashboard@eduhub.school' });
      await UserModel.deleteMany({ email: 'teacher.dashboard@eduhub.school' });
    });

    it('GET /api/v1/teacher/dashboard returns real teacher dashboard structure', async () => {
      const res = await request(app)
        .get('/api/v1/teacher/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teacher.fullName).toBe('Prof. Marcus Vance');
      expect(res.body.data.teacher.employeeId).toBe('TCH-TEST-01');
      expect(res.body.data.summaryStats.assignedClassesCount).toBe(1);
      expect(Array.isArray(res.body.data.assignedClasses)).toBe(true);
      expect(res.body.data.assignedClasses[0].className).toBe('Grade 8');
      expect(res.body.data.assignedClasses[0].section).toBe('A');
    });

    it('GET /api/v1/teacher/classes returns assigned classes', async () => {
      const res = await request(app)
        .get('/api/v1/teacher/classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].className).toBe('Grade 8');
    });

    it('GET /api/v1/teacher/timetable returns teacher weekly timetable', async () => {
      const marcusTeacher = await TeacherModel.findOne({ email: 'teacher.dashboard@eduhub.school' });
      const testPeriod = await TimetablePeriodModel.create({
        academicYear: '2026-2027',
        classId: new mongoose.Types.ObjectId(),
        className: 'Grade 8',
        section: 'A',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Physics',
        teacherId: marcusTeacher?._id,
        teacherName: 'Prof. Marcus Vance',
        roomNumber: 'Room 101',
        periodType: 'TEACHING',
      });

      const res = await request(app)
        .get('/api/v1/teacher/timetable')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teacher.fullName).toBe('Prof. Marcus Vance');
      expect(Array.isArray(res.body.data.periods)).toBe(true);
      expect(res.body.data.periods.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.periods[0].subject).toBe('Physics');
      expect(res.body.data.periods[0].formattedTime).toBe('9:00 AM - 9:45 AM');

      await TimetablePeriodModel.findByIdAndDelete(testPeriod._id);
    });

    it('GET /api/v1/teacher/students returns only students from assigned sections', async () => {
      const parentUser = await UserModel.create({
        fullName: 'Test Parent',
        email: 'testparent@eduhub.school',
        phone: '+1 555-8888',
        passwordHash: 'dummy',
        role: UserRole.PARENT,
        status: 'ACTIVE',
      });

      // Student in assigned class (Grade 8 - A)
      const assignedStudent = await StudentModel.create({
        parentId: parentUser._id,
        fullName: 'Dev Patel',
        studentId: 'STU-TEST-001',
        grade: 'Grade 8',
        section: 'A',
        rollNumber: '15',
        status: 'ACTIVE',
        academicYear: '2026-2027',
      });

      // Student in UNASSIGNED class (Grade 10 - B)
      const unassignedStudent = await StudentModel.create({
        parentId: parentUser._id,
        fullName: 'Priya Sharma',
        studentId: 'STU-TEST-002',
        grade: 'Grade 10',
        section: 'B',
        rollNumber: '22',
        status: 'ACTIVE',
        academicYear: '2026-2027',
      });

      try {
        const res = await request(app)
          .get('/api/v1/teacher/students')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);

        const studentIds = res.body.data.map((s: any) => s.studentId);
        expect(studentIds).toContain('STU-TEST-001');
        expect(studentIds).not.toContain('STU-TEST-002');

        // Test filtering by search
        const searchRes = await request(app)
          .get('/api/v1/teacher/students?search=Dev')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(searchRes.status).toBe(200);
        expect(searchRes.body.data).toHaveLength(1);
        expect(searchRes.body.data[0].fullName).toBe('Dev Patel');

        // Test filtering by unassigned grade returns empty
        const unassignedRes = await request(app)
          .get('/api/v1/teacher/students?grade=Grade%2010')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(unassignedRes.status).toBe(200);
        expect(unassignedRes.body.data).toHaveLength(0);
      } finally {
        await StudentModel.deleteMany({ _id: { $in: [assignedStudent._id, unassignedStudent._id] } });
        await UserModel.deleteOne({ _id: parentUser._id });
      }
    });

    describe('Daily Attendance Feature', () => {
      let testStudent: any;
      let parentUser: any;
      const testDate = '2026-10-10';

      beforeAll(async () => {
        parentUser = await UserModel.create({
          fullName: 'Test Parent Attend',
          email: 'parent.attend@eduhub.school',
          phone: '+1 555-8888',
          passwordHash: 'dummy',
          role: UserRole.PARENT,
          status: 'ACTIVE',
        });

        testStudent = await StudentModel.create({
          fullName: 'Kiran Rao',
          studentId: 'STU-ATT-001',
          grade: 'Grade 8',
          section: 'A',
          parentId: parentUser._id,
          status: 'ACTIVE',
          academicYear: '2026-2027',
        });
      });

      afterAll(async () => {
        await AttendanceModel.deleteMany({ className: 'Grade 8', section: 'A' });
        await StudentModel.deleteMany({ _id: testStudent._id });
        await UserModel.deleteMany({ _id: parentUser._id });
      });

      it('GET /api/v1/teacher/attendance without token should return 401', async () => {
        const res = await request(app).get('/api/v1/teacher/attendance?className=Grade%208&section=A&date=2026-10-10');
        expect(res.status).toBe(401);
      });

      it('GET /api/v1/teacher/attendance for unassigned class should return 403', async () => {
        const res = await request(app)
          .get('/api/v1/teacher/attendance?className=Grade%2012&section=B&date=2026-10-10')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it('GET /api/v1/teacher/attendance for assigned class returns register with students', async () => {
        const res = await request(app)
          .get(`/api/v1/teacher/attendance?className=Grade%208&section=A&date=${testDate}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.className).toBe('Grade 8');
        expect(res.body.data.section).toBe('A');
        expect(res.body.data.isAlreadyMarked).toBe(false);
        expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data.students[0].status).toBe('PRESENT');
      });

      it('POST /api/v1/teacher/attendance saves new attendance register', async () => {
        const res = await request(app)
          .post('/api/v1/teacher/attendance')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            className: 'Grade 8',
            section: 'A',
            date: testDate,
            records: [
              {
                studentId: testStudent._id.toString(),
                status: 'PRESENT',
                remarks: 'Attended session',
              },
            ],
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.isAlreadyMarked).toBe(true);
        expect(res.body.data.summary.present).toBe(1);
      });

      it('POST /api/v1/teacher/attendance with duplicate date returns 409 Conflict', async () => {
        const res = await request(app)
          .post('/api/v1/teacher/attendance')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            className: 'Grade 8',
            section: 'A',
            date: testDate,
            records: [
              {
                studentId: testStudent._id.toString(),
                status: 'ABSENT',
              },
            ],
          });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('ATTENDANCE_ALREADY_EXISTS');
      });

      it('PUT /api/v1/teacher/attendance updates existing attendance register', async () => {
        const res = await request(app)
          .put('/api/v1/teacher/attendance')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            className: 'Grade 8',
            section: 'A',
            date: testDate,
            records: [
              {
                studentId: testStudent._id.toString(),
                status: 'LATE',
                remarks: 'Reported 15 mins late',
              },
            ],
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.summary.late).toBe(1);
        expect(res.body.data.students[0].status).toBe('LATE');
        expect(res.body.data.students[0].remarks).toBe('Reported 15 mins late');
      });

      it('GET /api/v1/teacher/attendance/history returns history for assigned class and section', async () => {
        const res = await request(app)
          .get('/api/v1/teacher/attendance/history?className=Grade%208&section=A')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0].date).toBe(testDate);
      });
    });

    describe('Real Student Roster & Cross-Teacher Attendance Verification', () => {
      let anjaliToken: string;
      let samToken: string;

      beforeAll(async () => {
        const anjaliUser = await UserModel.findOne({ email: 'anjali@gmail.com' });
        const samUser = await UserModel.findOne({ email: 'sam@gmail.com' });

        if (anjaliUser) {
          anjaliToken = tokenService.generateAccessToken({
            sub: anjaliUser._id.toString(),
            email: anjaliUser.email,
            role: UserRole.TEACHER,
            fullName: anjaliUser.fullName,
          });
        }

        if (samUser) {
          samToken = tokenService.generateAccessToken({
            sub: samUser._id.toString(),
            email: samUser.email,
            role: UserRole.TEACHER,
            fullName: samUser.fullName,
          });
        }
      });

      it('Aisha appears in UKG Section A attendance roster even when teacher assignment has older year', async () => {
        if (!anjaliToken) return;

        const res = await request(app)
          .get('/api/v1/teacher/attendance?className=UKG&section=A&date=2026-10-13')
          .set('Authorization', `Bearer ${anjaliToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.summary.total).toBeGreaterThanOrEqual(1);

        const studentNames = res.body.data.students.map((s: any) => s.fullName.toLowerCase());
        expect(studentNames).toContain('aisha');
      });

      it('Adam appears in LKG Section A attendance roster', async () => {
        if (!anjaliToken) return;

        const res = await request(app)
          .get('/api/v1/teacher/attendance?className=LKG&section=A&date=2026-10-13')
          .set('Authorization', `Bearer ${anjaliToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.summary.total).toBeGreaterThanOrEqual(1);

        const studentNames = res.body.data.students.map((s: any) => s.fullName.toLowerCase());
        expect(studentNames).toContain('adam');
      });

      it('Students without attendance records still appear in the register', async () => {
        if (!anjaliToken) return;

        const futureUnrecordedDate = '2026-10-12';
        const res = await request(app)
          .get(`/api/v1/teacher/attendance?className=UKG&section=A&date=${futureUnrecordedDate}`)
          .set('Authorization', `Bearer ${anjaliToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);
        const aisha = res.body.data.students.find((s: any) => s.fullName.toLowerCase() === 'aisha');
        expect(aisha).toBeDefined();
        expect(aisha.status).toBe('PRESENT'); // Default status
      });

      it('Students from other sections do not appear in the roster', async () => {
        if (!anjaliToken) return;

        // In UKG Section A, Adam (from LKG Section A) must NOT appear
        const ukgRes = await request(app)
          .get('/api/v1/teacher/attendance?className=UKG&section=A&date=2026-10-13')
          .set('Authorization', `Bearer ${anjaliToken}`);

        const ukgNames = ukgRes.body.data.students.map((s: any) => s.fullName.toLowerCase());
        expect(ukgNames).toContain('aisha');
        expect(ukgNames).not.toContain('adam');

        // In LKG Section A, Aisha (from UKG Section A) must NOT appear
        const lkgRes = await request(app)
          .get('/api/v1/teacher/attendance?className=LKG&section=A&date=2026-10-13')
          .set('Authorization', `Bearer ${anjaliToken}`);

        const lkgNames = lkgRes.body.data.students.map((s: any) => s.fullName.toLowerCase());
        expect(lkgNames).toContain('adam');
        expect(lkgNames).not.toContain('aisha');
      });

      it('Unauthorized teachers cannot access another teacher roster', async () => {
        if (!samToken) return;

        // Teacher Sam is not assigned to UKG Section A
        const res = await request(app)
          .get('/api/v1/teacher/attendance?className=UKG&section=A&date=2026-10-13')
          .set('Authorization', `Bearer ${samToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN_SECTION');
      });
    });
  });
});
