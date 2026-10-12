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
  });
});
