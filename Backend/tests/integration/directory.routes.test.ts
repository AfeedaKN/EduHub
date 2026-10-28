import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { StudentRegistrationRequestModel } from '../../src/modules/parent/models/StudentRegistrationRequest.model';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';

describe('Admin Student and Parent Directory Integration Tests', () => {
  const app = createApp();
  const tokenService = new TokenService(
    'eduhub_dev_access_secret_key_change_in_production_2026',
    '15m',
    'eduhub_dev_refresh_secret_key_change_in_production_2026',
    7
  );

  let managementToken: string;
  let parentToken: string;
  let testStudentId: string;
  let testParentId: string;

  beforeAll(async () => {
    await connectDatabase();

    // Create test management user
    managementToken = tokenService.generateAccessToken({
      sub: new mongoose.Types.ObjectId().toString(),
      email: 'admin.dir.test@eduhub.school',
      role: UserRole.MANAGEMENT,
      fullName: 'Directory Admin Tester',
    });

    // Create test parent user
    const parentUser = await UserModel.create({
      fullName: 'Dir Test Parent',
      email: `dir.parent.${Date.now()}@eduhub.school`,
      phone: '+1 555-8822',
      passwordHash: 'dummy_hash',
      role: UserRole.PARENT,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });
    testParentId = parentUser._id.toString();

    parentToken = tokenService.generateAccessToken({
      sub: testParentId,
      email: parentUser.email,
      role: UserRole.PARENT,
      fullName: parentUser.fullName,
    });

    // Create test enrolled student
    const student = await StudentModel.create({
      parentId: parentUser._id,
      fullName: 'Dir Test Student',
      studentId: `STU-TEST-${Date.now().toString().slice(-4)}`,
      grade: 'Grade 3',
      section: 'B',
      rollNumber: '305',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    testStudentId = student._id.toString();
  });

  afterAll(async () => {
    if (testStudentId) {
      await StudentModel.findByIdAndDelete(testStudentId);
    }
    if (testParentId) {
      await UserModel.findByIdAndDelete(testParentId);
    }
    await disconnectDatabase();
  });

  describe('Authorization Checks', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/admin/students/summary');
      expect(res.status).toBe(401);
    });

    it('rejects non-management role (PARENT) with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/students/summary')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects parent accessing parent directory summary with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parents/summary')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Students Directory Endpoints', () => {
    it('GET /api/v1/admin/students/summary returns accurate counts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/students/summary')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.totalStudents).toBe('number');
      expect(typeof res.body.data.activeStudents).toBe('number');
      expect(typeof res.body.data.pendingAdmissions).toBe('number');
      expect(typeof res.body.data.classesWithStudents).toBe('number');
      expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/admin/students returns paginated list and filters by search', async () => {
      const res = await request(app)
        .get('/api/v1/admin/students?search=Dir Test Student')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.students)).toBe(true);
      expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.students.find((s: any) => s.id === testStudentId);
      expect(found).toBeDefined();
      expect(found.fullName).toBe('Dir Test Student');
      expect(found.grade).toBe('Grade 3');
      expect(found.section).toBe('B');
      expect(found.parent.fullName).toBe('Dir Test Parent');
    });

    it('GET /api/v1/admin/students/:id returns single student details', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/students/${testStudentId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testStudentId);
      expect(res.body.data.fullName).toBe('Dir Test Student');
      expect(res.body.data.parent).toBeDefined();
      expect(res.body.data.parent.id).toBe(testParentId);
    });

    it('PUT /api/v1/admin/students/:id updates student record', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/students/${testStudentId}`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          rollNumber: '399',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rollNumber).toBe('399');
    });
  });

  describe('Parents Directory Endpoints', () => {
    it('GET /api/v1/admin/parents/summary returns stats on parent accounts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parents/summary')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.totalParents).toBe('number');
      expect(typeof res.body.data.parentsWithChildren).toBe('number');
      expect(typeof res.body.data.parentsWithoutChildren).toBe('number');
      expect(typeof res.body.data.multipleChildrenFamilies).toBe('number');
      expect(res.body.data.totalParents).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/admin/parents returns paginated parent accounts with search', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parents?search=Dir Test Parent')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.parents)).toBe(true);
      expect(res.body.data.parents.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.parents.find((p: any) => p.id === testParentId);
      expect(found).toBeDefined();
      expect(found.fullName).toBe('Dir Test Parent');
      expect(found.linkedChildrenCount).toBe(1);
      expect(found.linkedChildren[0].fullName).toBe('Dir Test Student');
    });

    it('GET /api/v1/admin/parents/:id returns parent details and linked students', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/parents/${testParentId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parent.id).toBe(testParentId);
      expect(res.body.data.linkedChildren).toHaveLength(1);
      expect(res.body.data.linkedChildren[0].id).toBe(testStudentId);
    });

    it('PATCH /api/v1/admin/parents/:id/status updates account status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/parents/${testParentId}/status`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ status: 'DISABLED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parent.status).toBe('DISABLED');

      // Revert back to ACTIVE
      await request(app)
        .patch(`/api/v1/admin/parents/${testParentId}/status`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ status: 'ACTIVE' });
    });
  });
});
