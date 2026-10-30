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
import { StudentRegistrationRequestModel, RegistrationStatus } from '../../src/modules/parent/models/StudentRegistrationRequest.model';
import { AttendanceModel } from '../../src/modules/teacher/models/Attendance.model';
import { AssignmentModel } from '../../src/modules/teacher/models/Assignment.model';
import { SubmissionModel } from '../../src/modules/teacher/models/Submission.model';
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
    '15m'
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
      // Clean up potential leftovers
      await UserModel.deleteMany({ email: 'teacher.dashboard@eduhub.school' });
      await TeacherModel.deleteMany({
        $or: [{ userId: teacherUserId }, { employeeId: 'TCH-TEST-01' }],
      });

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

      it('Pending admission registration requests are excluded from attendance roster', async () => {
        if (!anjaliToken) return;

        // Create a dummy pending admission request for UKG
        const pendingReq = await StudentRegistrationRequestModel.create({
          parentId: new mongoose.Types.ObjectId(),
          studentFullName: 'Unapproved Pending Child',
          dateOfBirth: new Date('2020-05-15'),
          gender: 'MALE',
          requestedGrade: 'UKG',
          academicYear: '2026-2027',
          parentRelationship: 'FATHER',
          status: RegistrationStatus.PENDING,
        });

        try {
          const res = await request(app)
            .get('/api/v1/teacher/attendance?className=UKG&section=A&date=2026-10-13')
            .set('Authorization', `Bearer ${anjaliToken}`);

          expect(res.status).toBe(200);
          const studentNames = res.body.data.students.map((s: any) => s.fullName.toLowerCase());
          expect(studentNames).not.toContain('unapproved pending child');
        } finally {
          await StudentRegistrationRequestModel.findByIdAndDelete(pendingReq._id);
        }
      });

      it('Inactive or graduated students are excluded from attendance roster', async () => {
        if (!anjaliToken) return;

        const inactiveStudent = await StudentModel.create({
          fullName: 'Inactive Graduated Student',
          studentId: 'STU-INACTIVE-001',
          grade: 'UKG',
          section: 'A',
          parentId: new mongoose.Types.ObjectId(),
          status: 'INACTIVE',
          academicYear: '2026-2027',
        });

        try {
          const res = await request(app)
            .get('/api/v1/teacher/attendance?className=UKG&section=A&date=2026-10-13')
            .set('Authorization', `Bearer ${anjaliToken}`);

          expect(res.status).toBe(200);
          const studentNames = res.body.data.students.map((s: any) => s.fullName.toLowerCase());
          expect(studentNames).not.toContain('inactive graduated student');
        } finally {
          await StudentModel.findByIdAndDelete(inactiveStudent._id);
        }
      });
    });

    describe('Teacher Assignments Management Endpoints', () => {
      let createdAssignmentId: string;

      afterAll(async () => {
        await AssignmentModel.deleteMany({ teacherUserId: new mongoose.Types.ObjectId(teacherUserId) });
      });

      it('POST /api/v1/teacher/assignments creates a new assignment for assigned class', async () => {
        const payload = {
          title: 'Kinematics Problem Set 1',
          description: 'Solve questions 1 through 10 on page 50.',
          className: 'Grade 8',
          section: 'A',
          subject: 'Physics',
          assignedDate: '2026-10-14',
          dueDate: '2026-10-21',
          maxMarks: 50,
          status: 'PUBLISHED',
          attachmentUrl: 'https://example.com/physics-sheet.pdf',
          attachmentName: 'physics-sheet.pdf',
        };

        const res = await request(app)
          .post('/api/v1/teacher/assignments')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.title).toBe(payload.title);
        expect(res.body.data.status).toBe('PUBLISHED');
        expect(res.body.data.maxMarks).toBe(50);
        expect(res.body.data.teacherName).toBe('Prof. Marcus Vance');

        createdAssignmentId = res.body.data.id;
      });

      it('POST /api/v1/teacher/assignments fails when teacher is not assigned to the class', async () => {
        const payload = {
          title: 'Unauthorized Assignment',
          description: 'Should not be allowed',
          className: 'Grade 12',
          section: 'C',
          subject: 'Economics',
          dueDate: '2026-10-25',
          maxMarks: 50,
        };

        const res = await request(app)
          .post('/api/v1/teacher/assignments')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(payload);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN_CLASS_ASSIGNMENT');
      });

      it('POST /api/v1/teacher/assignments fails when dueDate is earlier than assignedDate', async () => {
        const payload = {
          title: 'Invalid Date Assignment',
          description: 'Testing backwards dates',
          className: 'Grade 8',
          section: 'A',
          subject: 'Physics',
          assignedDate: '2026-10-25',
          dueDate: '2026-10-20',
          maxMarks: 50,
        };

        const res = await request(app)
          .post('/api/v1/teacher/assignments')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toContain('Due date cannot be earlier than assigned date');
      });

      it('GET /api/v1/teacher/assignments returns assignments list and summary metrics', async () => {
        const res = await request(app)
          .get('/api/v1/teacher/assignments')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.assignments)).toBe(true);
        expect(res.body.data.assignments.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data.summary).toBeDefined();
        expect(res.body.data.summary.total).toBeGreaterThanOrEqual(1);
        expect(res.body.data.summary.published).toBeGreaterThanOrEqual(1);
      });

      it('GET /api/v1/teacher/assignments/:id returns the assignment details', async () => {
        const res = await request(app)
          .get(`/api/v1/teacher/assignments/${createdAssignmentId}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(createdAssignmentId);
        expect(res.body.data.title).toBe('Kinematics Problem Set 1');
      });

      it('GET /api/v1/teacher/assignments/:id/submissions and PUT .../grade flow', async () => {
        // Seed a test student in Grade 8 A
        const student = await StudentModel.create({
          parentId: new mongoose.Types.ObjectId(),
          fullName: 'David Miller',
          studentId: 'STU-GR8-01',
          grade: 'Grade 8',
          section: 'A',
          academicYear: '2026-2027',
          status: 'ACTIVE',
        });

        // Seed a submission
        const sub = await SubmissionModel.create({
          assignmentId: new mongoose.Types.ObjectId(createdAssignmentId),
          studentId: student._id,
          parentId: student.parentId,
          teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
          className: 'Grade 8',
          section: 'A',
          academicYear: '2026-2027',
          subject: 'Physics',
          answerText: 'Kinematics formulas: v = u + at, s = ut + 0.5at^2',
          attachmentUrl: '',
          attachmentName: '',
          attachmentSize: 0,
          attachmentType: '',
          submittedAt: new Date(),
          status: 'SUBMITTED',
          isLate: false,
          version: 1,
          gradingStatus: 'PENDING',
          maxMarks: 50,
          isPublished: false,
        });

        // 1. Fetch submissions for assignment
        const listRes = await request(app)
          .get(`/api/v1/teacher/assignments/${createdAssignmentId}/submissions`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(listRes.status).toBe(200);
        expect(listRes.body.success).toBe(true);
        expect(Array.isArray(listRes.body.data)).toBe(true);
        expect(listRes.body.data.length).toBe(1);
        expect(listRes.body.data[0].studentName).toBe('David Miller');
        expect(listRes.body.data[0].studentAdmissionNumber).toBe('STU-GR8-01');

        // 2. Save draft review (publishResult = false)
        const draftGradeRes = await request(app)
          .put(`/api/v1/teacher/assignments/${createdAssignmentId}/submissions/${sub._id}/grade`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            marksObtained: 42,
            feedback: 'Good work, please double check units in question 4.',
            publishResult: false,
          });

        expect(draftGradeRes.status).toBe(200);
        expect(draftGradeRes.body.success).toBe(true);
        expect(draftGradeRes.body.data.marksObtained).toBe(42);
        expect(draftGradeRes.body.data.status).toBe('UNDER_REVIEW');
        expect(draftGradeRes.body.data.isPublished).toBe(false);

        // 3. Reject invalid marks (> maxMarks)
        const invalidMarksRes = await request(app)
          .put(`/api/v1/teacher/assignments/${createdAssignmentId}/submissions/${sub._id}/grade`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            marksObtained: 999,
            publishResult: true,
          });

        expect(invalidMarksRes.status).toBe(400);
        expect(invalidMarksRes.body.success).toBe(false);

        // 4. Publish graded result (publishResult = true)
        const publishGradeRes = await request(app)
          .put(`/api/v1/teacher/assignments/${createdAssignmentId}/submissions/${sub._id}/grade`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            marksObtained: 45,
            feedback: 'Excellent reasoning and clear steps.',
            publishResult: true,
          });

        expect(publishGradeRes.status).toBe(200);
        expect(publishGradeRes.body.success).toBe(true);
        expect(publishGradeRes.body.data.marksObtained).toBe(45);
        expect(publishGradeRes.body.data.status).toBe('GRADED');
        expect(publishGradeRes.body.data.isPublished).toBe(true);

        // Cleanup seeded student and submission
        await SubmissionModel.deleteMany({ assignmentId: new mongoose.Types.ObjectId(createdAssignmentId) });
        await StudentModel.deleteMany({ _id: student._id });
      });

      it('PUT /api/v1/teacher/assignments/:id updates the assignment', async () => {
        const res = await request(app)
          .put(`/api/v1/teacher/assignments/${createdAssignmentId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            title: 'Kinematics Problem Set 1 (Updated)',
            maxMarks: 75,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Kinematics Problem Set 1 (Updated)');
        expect(res.body.data.maxMarks).toBe(75);
      });

      it('PATCH /api/v1/teacher/assignments/:id/status updates status to DRAFT', async () => {
        const res = await request(app)
          .patch(`/api/v1/teacher/assignments/${createdAssignmentId}/status`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({ status: 'DRAFT' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('DRAFT');
      });

      it('DELETE /api/v1/teacher/assignments/:id deletes the assignment', async () => {
        const res = await request(app)
          .delete(`/api/v1/teacher/assignments/${createdAssignmentId}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verification: fetching deleted assignment should now return 404
        const verifyRes = await request(app)
          .get(`/api/v1/teacher/assignments/${createdAssignmentId}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(verifyRes.status).toBe(404);
      });

      it('Non-teacher role cannot access assignments endpoints', async () => {
        const res = await request(app)
          .get('/api/v1/teacher/assignments')
          .set('Authorization', `Bearer ${parentToken}`);

        expect(res.status).toBe(403);
      });
    });
  });
});

