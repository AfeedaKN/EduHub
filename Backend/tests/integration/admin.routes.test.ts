import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { StudentRegistrationRequestModel, RegistrationStatus } from '../../src/modules/parent/models/StudentRegistrationRequest.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { ClassModel } from '../../src/modules/admin/models/Class.model';
import { SectionModel } from '../../src/modules/admin/models/Section.model';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';
import { TimetablePeriodModel } from '../../src/modules/admin/models/TimetablePeriod.model';
import { SubjectModel } from '../../src/modules/admin/models/Subject.model';
import { AttendanceModel } from '../../src/modules/teacher/models/Attendance.model';

describe('Admin Routes Integration Tests', () => {
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

  it('GET /api/v1/admin/dashboard without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/admin/dashboard with Parent token should return 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  it('GET /api/v1/admin/dashboard with Management token should return 200 with summary structure', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.totalStudents).toBe('number');
    expect(typeof res.body.data.activeStudents).toBe('number');
    expect(typeof res.body.data.totalTeachers).toBe('number');
    expect(typeof res.body.data.pendingAdmissionsCount).toBe('number');
    expect(Array.isArray(res.body.data.recentPendingAdmissions)).toBe(true);
    expect(res.body.data.feesSummary).toBeNull();
    expect(Array.isArray(res.body.data.enrollmentByClass)).toBe(true);
    expect(res.body.data.examOverview).toBeDefined();
    expect(Array.isArray(res.body.data.recentActivities)).toBe(true);
    if (res.body.data.attendanceSummary !== null) {
      expect(typeof res.body.data.attendanceSummary.presentCount).toBe('number');
    }
  });

  it('GET /api/v1/admin/admissions with Management token should return 200 with admissions list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/admissions')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/admin/admissions/summary should return status counts', async () => {
    const res = await request(app)
      .get('/api/v1/admin/admissions/summary')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.pendingCount).toBe('number');
    expect(typeof res.body.data.approvedCount).toBe('number');
    expect(typeof res.body.data.rejectedCount).toBe('number');
    expect(typeof res.body.data.totalCount).toBe('number');
  });

  it('GET /api/v1/admin/admissions/capacity should return capacity information for a grade', async () => {
    const res = await request(app)
      .get('/api/v1/admin/admissions/capacity?grade=Grade%208&section=A')
      .set('Authorization', `Bearer ${managementToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grade).toBe('Grade 8');
    expect(res.body.data.section).toBe('A');
    expect(res.body.data.maxCapacity).toBe(40);
    expect(typeof res.body.data.currentlyEnrolled).toBe('number');
    expect(typeof res.body.data.availableSeats).toBe('number');
  });

  it('Non-management user cannot approve or reject requests (403 Forbidden)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const approveRes = await request(app)
      .post(`/api/v1/admin/admissions/${fakeId}/approve`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ section: 'A' });

    expect(approveRes.status).toBe(403);

    const rejectRes = await request(app)
      .post(`/api/v1/admin/admissions/${fakeId}/reject`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ rejectionReason: 'Test' });

    expect(rejectRes.status).toBe(403);
  });

  describe('Admissions Approval and Rejection Flow', () => {
    let testParentId: mongoose.Types.ObjectId;
    let pendingReq1Id: string;
    let pendingReq2Id: string;

    beforeAll(async () => {
      // Ensure a parent user exists
      let parentUser = await UserModel.findOne({ email: 'integration_parent@eduhub.test' });
      if (!parentUser) {
        parentUser = await UserModel.create({
          fullName: 'Integration Parent',
          email: 'integration_parent@eduhub.test',
          passwordHash: 'dummyHash',
          role: UserRole.PARENT,
          isVerified: true,
          phone: '+919876543210',
        });
      }
      testParentId = parentUser._id as mongoose.Types.ObjectId;

      // Seed two test registration requests
      const req1 = await StudentRegistrationRequestModel.create({
        parentId: testParentId,
        studentFullName: 'Integration Child One',
        dateOfBirth: new Date('2015-04-12'),
        gender: 'MALE',
        requestedGrade: 'Grade 4',
        academicYear: '2026-2027',
        parentRelationship: 'FATHER',
        status: RegistrationStatus.PENDING,
      });
      pendingReq1Id = (req1._id as mongoose.Types.ObjectId).toString();

      const req2 = await StudentRegistrationRequestModel.create({
        parentId: testParentId,
        studentFullName: 'Integration Child Two',
        dateOfBirth: new Date('2014-06-20'),
        gender: 'FEMALE',
        requestedGrade: 'Grade 5',
        academicYear: '2026-2027',
        parentRelationship: 'MOTHER',
        status: RegistrationStatus.PENDING,
      });
      pendingReq2Id = (req2._id as mongoose.Types.ObjectId).toString();
    });

    afterAll(async () => {
      // Cleanup
      await StudentRegistrationRequestModel.deleteMany({ parentId: testParentId });
      await StudentModel.deleteMany({ parentId: testParentId });
      await UserModel.deleteOne({ _id: testParentId });
    });

    it('Approve request: creates official student record and sets status to APPROVED', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/admissions/${pendingReq1Id}/approve`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ section: 'A', notes: 'Approved for 2026 session' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('APPROVED');
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.student.fullName).toBe('Integration Child One');
      expect(res.body.data.student.studentId).toMatch(/^STU-2026-\d{4}$/);

      // Verify DB state
      const dbStudent = await StudentModel.findById(res.body.data.student.id);
      expect(dbStudent).not.toBeNull();
      expect(dbStudent?.fullName).toBe('Integration Child One');
      expect(dbStudent?.grade).toBe('Grade 4');
      expect(dbStudent?.status).toBe('ACTIVE');

      const dbReq = await StudentRegistrationRequestModel.findById(pendingReq1Id);
      expect(dbReq?.status).toBe('APPROVED');
      expect(dbReq?.createdStudentId?.toString()).toBe(res.body.data.student.id);
      expect(dbReq?.reviewedBy).toBeDefined();
      expect(dbReq?.reviewedAt).toBeDefined();
    });

    it('Cannot approve an already finalized request (repeat approval protection)', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/admissions/${pendingReq1Id}/approve`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ section: 'A' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REQUEST_ALREADY_REVIEWED');
    });

    it('Cannot approve admission if selected section does not exist in class (400 ValidationError)', async () => {
      const tempReq = await StudentRegistrationRequestModel.create({
        parentId: testParentId,
        studentFullName: 'Section Test Child',
        dateOfBirth: new Date('2015-01-01'),
        gender: 'MALE',
        requestedGrade: 'Grade 4',
        academicYear: '2026-2027',
        parentRelationship: 'FATHER',
        status: RegistrationStatus.PENDING,
      });

      const res = await request(app)
        .post(`/api/v1/admin/admissions/${tempReq._id}/approve`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ section: 'NONEXISTENT_SECTION' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('does not exist for class');

      await StudentRegistrationRequestModel.findByIdAndDelete(tempReq._id);
    });

    it('Reject request without reason returns 400 ValidationError', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/admissions/${pendingReq2Id}/reject`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ rejectionReason: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Reject request: sets status to REJECTED with reason and audit timestamp, without creating student', async () => {
      const initialStudentCount = await StudentModel.countDocuments({ fullName: 'Integration Child Two' });

      const res = await request(app)
        .post(`/api/v1/admin/admissions/${pendingReq2Id}/reject`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ rejectionReason: 'Grade 5 is at full capacity for the academic year.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('REJECTED');

      // Verify DB state
      const dbReq = await StudentRegistrationRequestModel.findById(pendingReq2Id);
      expect(dbReq?.status).toBe('REJECTED');
      expect(dbReq?.rejectionReason).toBe('Grade 5 is at full capacity for the academic year.');
      expect(dbReq?.reviewedBy).toBeDefined();
      expect(dbReq?.reviewedAt).toBeDefined();

      // Official student count must NOT have increased
      const finalStudentCount = await StudentModel.countDocuments({ fullName: 'Integration Child Two' });
      expect(finalStudentCount).toBe(initialStudentCount);
      expect(finalStudentCount).toBe(0);
    });

    it('Cannot reject an already finalized request', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/admissions/${pendingReq2Id}/reject`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ rejectionReason: 'Another reason' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REQUEST_ALREADY_REVIEWED');
    });
  });

  describe('Classes & Sections Management Routes', () => {
    let createdClassId: string;
    let createdSectionId: string;

    afterAll(async () => {
      // Clean up test classes and sections
      if (createdClassId) {
        await SectionModel.deleteMany({ classId: createdClassId });
        await ClassModel.deleteOne({ _id: createdClassId });
      }
    });

    it('Parent token accessing /api/v1/admin/classes returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });

    it('Management token can fetch summary statistics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/classes/summary')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.totalClasses).toBe('number');
      expect(typeof res.body.data.totalSections).toBe('number');
      expect(typeof res.body.data.totalEnrolledStudents).toBe('number');
      expect(typeof res.body.data.totalAvailableSeats).toBe('number');
    });

    it('POST /api/v1/admin/classes creates a new class', async () => {
      const res = await request(app)
        .post('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          name: 'Grade 8 Test Class',
          academicYear: '2026-2027',
          description: 'Test class for integration testing',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Grade 8 Test Class');
      expect(res.body.data.status).toBe('ACTIVE');
      createdClassId = res.body.data.id;
    });

    it('POST /api/v1/admin/classes with duplicate name and academic year returns 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          name: 'Grade 8 Test Class',
          academicYear: '2026-2027',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_CLASS');
    });

    it('POST /api/v1/admin/classes/:classId/sections creates a section', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/classes/${createdClassId}/sections`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          name: 'A',
          capacity: 35,
          roomNumber: 'Room 101',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('A');
      expect(res.body.data.capacity).toBe(35);
      expect(res.body.data.availableSeats).toBe(35);
      createdSectionId = res.body.data.id;
    });

    it('POST /api/v1/admin/classes/:classId/sections with duplicate section name returns 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/classes/${createdClassId}/sections`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          name: 'A',
          capacity: 30,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_SECTION');
    });

    it('PUT /api/v1/admin/classes/:classId/sections/:sectionId updates section capacity', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/classes/${createdClassId}/sections/${createdSectionId}`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          capacity: 38,
          roomNumber: 'Room 102',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capacity).toBe(38);
      expect(res.body.data.roomNumber).toBe('Room 102');
    });

    it('PATCH /api/v1/admin/classes/:id/status updates class status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/classes/${createdClassId}/status`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('GET /api/v1/admin/classes lists classes including the created class', async () => {
      const res = await request(app)
        .get('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((c: any) => c.id === createdClassId);
      expect(found).toBeDefined();
      expect(found.sectionsCount).toBe(1);
    });
  });

  describe('Teacher Management Integration Tests', () => {
    let createdTeacherId: string;
    const testEmail = `teacher.test.${Date.now()}@eduhub.school`;

    afterAll(async () => {
      await TeacherModel.deleteMany({ email: testEmail });
      await UserModel.deleteMany({ email: testEmail });
    });

    it('POST /api/v1/admin/teachers with Parent token should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          fullName: 'Test Teacher',
          email: testEmail,
          phone: '+1 555-9988',
          password: 'TeacherPassword123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/admin/teachers creates a teacher account for Management without leaking password', async () => {
      const res = await request(app)
        .post('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          fullName: 'Prof. Alistair Finch',
          email: testEmail,
          phone: '+1 555-8899',
          password: 'TeacherPassword123!',
          qualification: 'M.Sc. Mathematics',
          designation: 'Senior Faculty',
          department: 'Mathematics',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Prof. Alistair Finch');
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.employeeId).toBeDefined();

      // Ensure password and passwordHash are NEVER returned in response
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.passwordHash).toBeUndefined();

      createdTeacherId = res.body.data.id;

      // Verify User record was created in database with hashed password
      const userDoc = await UserModel.findOne({ email: testEmail });
      expect(userDoc).toBeDefined();
      expect(userDoc?.role).toBe(UserRole.TEACHER);
      expect(userDoc?.passwordHash).not.toBe('TeacherPassword123!');
    });

    it('POST /api/v1/admin/teachers rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          fullName: 'Duplicate Teacher',
          email: testEmail,
          phone: '+1 555-7766',
          password: 'AnotherPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('GET /api/v1/admin/teachers/summary returns teacher summary stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/teachers/summary')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.totalTeachers).toBe('number');
      expect(typeof res.body.data.activeTeachers).toBe('number');
      expect(typeof res.body.data.inactiveTeachers).toBe('number');
      expect(res.body.data.totalTeachers).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/admin/teachers lists teachers including newly created teacher', async () => {
      const res = await request(app)
        .get('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((t: any) => t.id === createdTeacherId);
      expect(found).toBeDefined();
    });

    it('PATCH /api/v1/admin/teachers/:id/status updates teacher status to INACTIVE', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/teachers/${createdTeacherId}/status`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('INACTIVE');

      // Verify User record was updated to DISABLED
      const userDoc = await UserModel.findOne({ email: testEmail });
      expect(userDoc?.status).toBe('DISABLED');
    });

    describe('Teacher Class Assignment Endpoints', () => {
      let assignClassId: string;
      let assignSectionId: string;
      let assignmentId: string;

      beforeAll(async () => {
        // Ensure teacher is ACTIVE for assignment tests
        await TeacherModel.findByIdAndUpdate(createdTeacherId, {
          status: 'ACTIVE',
          department: 'Science',
        });

        // Clear any conflicting test assignment in dev DB
        await TeacherModel.updateMany({}, {
          $pull: {
            assignedClasses: {
              className: 'Grade 10',
              section: 'A',
              subject: 'Physics',
              academicYear: '2026-2027',
            },
          },
        });

        // Find or create test class and section
        let c = await ClassModel.findOne({ name: 'Grade 10', academicYear: '2026-2027' });
        if (!c) {
          c = await ClassModel.create({
            name: 'Grade 10',
            academicYear: '2026-2027',
            status: 'ACTIVE',
          });
        }
        assignClassId = c._id.toString();

        let s = await SectionModel.findOne({ classId: c._id, name: 'A', academicYear: '2026-2027' });
        if (!s) {
          s = await SectionModel.create({
            classId: c._id,
            name: 'A',
            academicYear: '2026-2027',
            capacity: 35,
            status: 'ACTIVE',
          });
        }
        assignSectionId = s._id.toString();
      });

      afterAll(async () => {
        // Cleanup assignments
        await TeacherModel.findByIdAndUpdate(createdTeacherId, {
          $set: { assignedClasses: [] },
        });
      });

      it('POST /api/v1/admin/teachers/:id/assignments without token returns 401', async () => {
        const res = await request(app)
          .post(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .send({
            className: 'Grade 10',
            section: 'A',
            subject: 'Physics',
            academicYear: '2026-2027',
          });

        expect(res.status).toBe(401);
      });

      it('POST /api/v1/admin/teachers/:id/assignments with Parent token returns 403', async () => {
        const res = await request(app)
          .post(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .set('Authorization', `Bearer ${parentToken}`)
          .send({
            className: 'Grade 10',
            section: 'A',
            subject: 'Physics',
            academicYear: '2026-2027',
          });

        expect(res.status).toBe(403);
      });

      it('POST /api/v1/admin/teachers/:id/assignments rejects incompatible subject for teacher department', async () => {
        // Teacher department is Science; assign Physical Education
        const res = await request(app)
          .post(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            className: 'Grade 10',
            section: 'A',
            subject: 'Physical Education',
            academicYear: '2026-2027',
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.message).toContain('not compatible');
      });

      it('POST /api/v1/admin/teachers/:id/assignments successfully assigns class and section', async () => {
        const res = await request(app)
          .post(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            classId: assignClassId,
            className: 'Grade 10',
            section: 'A',
            subject: 'Physics',
            academicYear: '2026-2027',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.className).toBe('Grade 10');
        expect(res.body.data.section).toBe('A');
        expect(res.body.data.subject).toBe('Physics');
        expect(res.body.data.academicYear).toBe('2026-2027');
        expect(res.body.data.id).toBeDefined();
        assignmentId = res.body.data.id;
      });

      it('POST /api/v1/admin/teachers/:id/assignments rejects duplicate assignment', async () => {
        const res = await request(app)
          .post(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            classId: assignClassId,
            className: 'Grade 10',
            section: 'A',
            subject: 'Physics',
            academicYear: '2026-2027',
          });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
      });

      it('GET /api/v1/admin/teachers/:id/assignments returns teacher assignments', async () => {
        const res = await request(app)
          .get(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .set('Authorization', `Bearer ${managementToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0].subject).toBe('Physics');
      });

      it('GET /api/v1/admin/teachers/assignments/all returns all assignments across school', async () => {
        const res = await request(app)
          .get('/api/v1/admin/teachers/assignments/all')
          .set('Authorization', `Bearer ${managementToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        const match = res.body.data.find((a: any) => a.id === assignmentId);
        expect(match).toBeDefined();
      });

      it('PUT /api/v1/admin/teachers/:id/assignments/:assignmentId updates assignment subject', async () => {
        const res = await request(app)
          .put(`/api/v1/admin/teachers/${createdTeacherId}/assignments/${assignmentId}`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            classId: assignClassId,
            className: 'Grade 10',
            section: 'A',
            subject: 'Chemistry',
            academicYear: '2026-2027',
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.subject).toBe('Chemistry');
      });

      it('DELETE /api/v1/admin/teachers/:id/assignments/:assignmentId removes assignment', async () => {
        const res = await request(app)
          .delete(`/api/v1/admin/teachers/${createdTeacherId}/assignments/${assignmentId}`)
          .set('Authorization', `Bearer ${managementToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify assignment is gone
        const verify = await request(app)
          .get(`/api/v1/admin/teachers/${createdTeacherId}/assignments`)
          .set('Authorization', `Bearer ${managementToken}`);

        const found = verify.body.data.find((a: any) => a.id === assignmentId);
        expect(found).toBeUndefined();
      });
    });

    describe('Timetable Management Endpoints', () => {
      let createdPeriodId: string;
      let ttClassId: string;

      const teacherToken = tokenService.generateAccessToken({
        sub: '65f1234567890abcdef12347',
        email: 'teacher.temp@eduhub.school',
        role: UserRole.TEACHER,
        fullName: 'Teacher User',
      });

      beforeAll(async () => {
        const cls = await ClassModel.create({
          name: 'Grade 11',
          academicYear: '2026-2027',
          status: 'ACTIVE',
        });
        ttClassId = cls._id.toString();

        await SectionModel.create({
          classId: cls._id,
          name: 'A',
          academicYear: '2026-2027',
          capacity: 30,
          roomNumber: 'Lab 101',
          status: 'ACTIVE',
        });
      });

      afterAll(async () => {
        await TimetablePeriodModel.deleteMany({});
        await SectionModel.deleteMany({ classId: ttClassId });
        await ClassModel.findByIdAndDelete(ttClassId);
      });

      it('POST /api/v1/admin/timetable rejects unauthenticated requests', async () => {
        const res = await request(app).post('/api/v1/admin/timetable').send({});
        expect(res.status).toBe(401);
      });

      it('POST /api/v1/admin/timetable rejects requests without MANAGEMENT role', async () => {
        const res = await request(app)
          .post('/api/v1/admin/timetable')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({});
        expect(res.status).toBe(403);
      });

      it('POST /api/v1/admin/timetable creates period successfully', async () => {
        const res = await request(app)
          .post('/api/v1/admin/timetable')
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            academicYear: '2026-2027',
            classId: ttClassId,
            section: 'A',
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '09:45',
            subject: 'Physics',
            teacherId: createdTeacherId,
            roomNumber: 'Lab 101',
            periodType: 'TEACHING',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.className).toBe('Grade 11');
        expect(res.body.data.section).toBe('A');
        expect(res.body.data.subject).toBe('Physics');
        expect(res.body.data.formattedTime).toBe('9:00 AM - 9:45 AM');
        createdPeriodId = res.body.data.id;
      });

      it('POST /api/v1/admin/timetable prevents overlapping period for same section', async () => {
        const res = await request(app)
          .post('/api/v1/admin/timetable')
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            academicYear: '2026-2027',
            classId: ttClassId,
            section: 'A',
            dayOfWeek: 'MONDAY',
            startTime: '09:15',
            endTime: '10:00',
            subject: 'Chemistry',
          });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toContain('Section conflict');
      });

      it('POST /api/v1/admin/timetable allows adjacent period starting exactly when previous ends', async () => {
        const res = await request(app)
          .post('/api/v1/admin/timetable')
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            academicYear: '2026-2027',
            classId: ttClassId,
            section: 'A',
            dayOfWeek: 'MONDAY',
            startTime: '09:45',
            endTime: '10:30',
            subject: 'Mathematics',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.startTime).toBe('09:45');
      });

      it('GET /api/v1/admin/timetable returns scheduled periods', async () => {
        const res = await request(app)
          .get('/api/v1/admin/timetable')
          .query({ academicYear: '2026-2027', className: 'Grade 11' })
          .set('Authorization', `Bearer ${managementToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      });

      it('PUT /api/v1/admin/timetable/:id updates period subject and room', async () => {
        const res = await request(app)
          .put(`/api/v1/admin/timetable/${createdPeriodId}`)
          .set('Authorization', `Bearer ${managementToken}`)
          .send({
            subject: 'Advanced Physics',
            roomNumber: 'Main Lab A',
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.subject).toBe('Advanced Physics');
        expect(res.body.data.roomNumber).toBe('Main Lab A');
      });

      it('DELETE /api/v1/admin/timetable/:id removes period', async () => {
        const res = await request(app)
          .delete(`/api/v1/admin/timetable/${createdPeriodId}`)
          .set('Authorization', `Bearer ${managementToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const checkRes = await request(app)
          .get(`/api/v1/admin/timetable/${createdPeriodId}`)
          .set('Authorization', `Bearer ${managementToken}`);
        expect(checkRes.status).toBe(404);
      });
    });
  });

  describe('Subjects Management Integration Tests', () => {
    let createdSubjectId: string;
    const testCode = `TEST-SUB-${Date.now().toString().slice(-4)}`;
    const testName = `Test Subject ${Date.now().toString().slice(-4)}`;

    afterAll(async () => {
      if (createdSubjectId) {
        await SubjectModel.findByIdAndDelete(createdSubjectId);
      }
      await SubjectModel.deleteMany({ code: testCode });
    });

    it('GET /api/v1/admin/subjects/summary returns summary stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/subjects/summary')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSubjects');
      expect(res.body.data).toHaveProperty('activeSubjects');
      expect(res.body.data).toHaveProperty('assignedSubjects');
      expect(res.body.data).toHaveProperty('unassignedSubjects');
      expect(typeof res.body.data.totalSubjects).toBe('number');
    });

    it('POST /api/v1/admin/subjects with Parent token returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/admin/subjects')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          name: 'Unauthorized Subject',
          code: 'UNAUTH-101',
          category: 'CORE',
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/admin/subjects creates a new subject', async () => {
      const res = await request(app)
        .post('/api/v1/admin/subjects')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          name: testName,
          code: testCode,
          category: 'SCIENCE',
          description: 'A test subject for integration tests',
          applicableClasses: [],
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testName);
      expect(res.body.data.code).toBe(testCode.toUpperCase());
      expect(res.body.data.category).toBe('SCIENCE');
      createdSubjectId = res.body.data.id;
    });

    it('POST /api/v1/admin/subjects with duplicate code returns 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/admin/subjects')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          name: 'Another Subject With Same Code',
          code: testCode,
          category: 'CORE',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_SUBJECT_CODE');
    });

    it('GET /api/v1/admin/subjects lists subjects including the newly created one', async () => {
      const res = await request(app)
        .get('/api/v1/admin/subjects')
        .query({ search: testCode })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('subjects');
      const found = res.body.data.subjects.find((s: any) => s.id === createdSubjectId);
      expect(found).toBeDefined();
      expect(found.code).toBe(testCode.toUpperCase());
    });

    it('GET /api/v1/admin/subjects/:id returns full subject details', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdSubjectId);
      expect(res.body.data.name).toBe(testName);
      expect(Array.isArray(res.body.data.assignedTeachers)).toBe(true);
    });

    it('PUT /api/v1/admin/subjects/:id updates subject details', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          description: 'Updated test description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated test description');
    });

    it('PATCH /api/v1/admin/subjects/:id/status updates status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/subjects/${createdSubjectId}/status`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('GET /api/v1/admin/subjects/:id/references returns reference counts', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/subjects/${createdSubjectId}/references`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalReferences');
      expect(res.body.data.totalReferences).toBe(0);
    });

    it('DELETE /api/v1/admin/subjects/:id removes the test subject', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/api/v1/admin/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${managementToken}`);
      expect(checkRes.status).toBe(404);
    });
  });

  describe('School Attendance Management Integration Tests', () => {
    const testDate = '2026-10-20';
    let testAttendanceId: string;
    let testStudentId: string;

    beforeAll(async () => {
      // Find or create a test student
      let student = await StudentModel.findOne({ status: 'ACTIVE' });
      if (!student) {
        student = await StudentModel.create({
          parentId: new mongoose.Types.ObjectId(),
          fullName: 'Attendance Test Student',
          studentId: `TEST-ATT-${Date.now().toString().slice(-4)}`,
          grade: 'Grade 8',
          section: 'A',
          status: 'ACTIVE',
        });
      }
      testStudentId = student._id.toString();

      // Create a test attendance record for testDate
      const record = await AttendanceModel.create({
        studentId: student._id,
        className: student.grade,
        section: student.section,
        academicYear: '2026-2027',
        date: testDate,
        status: 'ABSENT',
        remarks: 'Initial absent record',
        markedBy: new mongoose.Types.ObjectId('65f1234567890abcdef12345'),
      });
      testAttendanceId = record._id.toString();
    });

    afterAll(async () => {
      if (testAttendanceId) {
        await AttendanceModel.findByIdAndDelete(testAttendanceId);
      }
    });

    it('GET /api/v1/admin/attendance/summary without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/attendance/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/admin/attendance/summary with Parent token returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/summary')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/admin/attendance/summary returns school metrics for date', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/summary')
        .query({ date: testDate })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalEnrolled');
      expect(res.body.data).toHaveProperty('presentCount');
      expect(res.body.data).toHaveProperty('absentCount');
      expect(res.body.data).toHaveProperty('lateCount');
      expect(res.body.data).toHaveProperty('unmarkedCount');
      expect(res.body.data).toHaveProperty('attendancePercentage');
      expect(res.body.data.date).toBe(testDate);
    });

    it('GET /api/v1/admin/attendance/register returns paginated student register', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/register')
        .query({ date: testDate, limit: 10 })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('records');
      expect(res.body.data).toHaveProperty('summary');
      expect(Array.isArray(res.body.data.records)).toBe(true);
    });

    it('GET /api/v1/admin/attendance/classes-overview returns class breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/classes-overview')
        .query({ date: testDate })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('className');
        expect(res.body.data[0]).toHaveProperty('section');
        expect(res.body.data[0]).toHaveProperty('submissionStatus');
      }
    });

    it('GET /api/v1/admin/attendance/submissions returns submission monitoring status', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/submissions')
        .query({ date: testDate })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/attendance/reports/monthly returns month breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/reports/monthly')
        .query({ month: '2026-10' })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('month');
      expect(res.body.data).toHaveProperty('days');
      expect(Array.isArray(res.body.data.days)).toBe(true);
      expect(res.body.data.days.length).toBe(31);
    });

    it('GET /api/v1/admin/attendance/reports/low-attendance returns low attendance list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/reports/low-attendance')
        .query({ threshold: 85 })
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/attendance/reports/student/:studentId returns student history', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/attendance/reports/student/${testStudentId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('student');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('history');
    });

    it('PUT /api/v1/admin/attendance/record/:id allows Management to correct attendance with audit note', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/attendance/record/${testAttendanceId}`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          status: 'PRESENT',
          reason: 'Parent provided verified doctor note',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PRESENT');
      expect(res.body.data.remarks).toContain('[Admin correction]');
    });

    it('GET /api/v1/admin/attendance/metadata returns attendance filters metadata', async () => {
      const res = await request(app)
        .get('/api/v1/admin/attendance/metadata')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.academicYears)).toBe(true);
      expect(Array.isArray(res.body.data.classes)).toBe(true);
      expect(res.body.data).toHaveProperty('defaultAcademicYear');
      expect(res.body.data).toHaveProperty('defaultClass');
      expect(res.body.data).toHaveProperty('defaultSection');
    });
  });
});

