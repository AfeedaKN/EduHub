import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';
import { StudyMaterialModel } from '../../src/modules/teacher/models/StudyMaterial.model';

describe('Study Materials Management Integration Tests', () => {
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

  const adminUserId = new mongoose.Types.ObjectId().toString();
  const teacher1UserId = new mongoose.Types.ObjectId().toString();
  const teacher2UserId = new mongoose.Types.ObjectId().toString();
  const parentUserId = new mongoose.Types.ObjectId().toString();

  const adminToken = tokenService.generateAccessToken({
    sub: adminUserId,
    email: 'admin.mat.test@eduhub.school',
    role: UserRole.MANAGEMENT,
    fullName: 'Admin Director',
  });

  const teacher1Token = tokenService.generateAccessToken({
    sub: teacher1UserId,
    email: 'teacher1.mat.test@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Teacher Alice',
  });

  const teacher2Token = tokenService.generateAccessToken({
    sub: teacher2UserId,
    email: 'teacher2.mat.test@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Teacher Bob',
  });

  const parentToken = tokenService.generateAccessToken({
    sub: parentUserId,
    email: 'parent.mat.test@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent Sarah',
  });

  let teacher1ProfileId: string;
  let teacher2ProfileId: string;
  let student1Id: string;
  let publishedMaterialId: string;
  let draftMaterialId: string;

  beforeAll(async () => {
    // 1. Cleanup fixtures
    await UserModel.deleteMany({
      email: {
        $in: [
          'admin.mat.test@eduhub.school',
          'teacher1.mat.test@eduhub.school',
          'teacher2.mat.test@eduhub.school',
          'parent.mat.test@eduhub.school',
        ],
      },
    });
    await TeacherModel.deleteMany({
      employeeId: { $in: ['TCH-MAT-TEST-01', 'TCH-MAT-TEST-02'] },
    });
    await StudentModel.deleteMany({ studentId: 'STU-MAT-TEST-01' });
    await StudyMaterialModel.deleteMany({
      className: { $in: ['Class 9', 'Class 10'] },
      subject: { $in: ['Mathematics', 'Physics'] },
    });

    // 2. Users
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(adminUserId),
      fullName: 'Admin Director',
      email: 'admin.mat.test@eduhub.school',
      phone: '+1 555-8000',
      passwordHash: 'dummy',
      role: UserRole.MANAGEMENT,
      status: 'ACTIVE',
    });

    await UserModel.create({
      _id: new mongoose.Types.ObjectId(teacher1UserId),
      fullName: 'Teacher Alice',
      email: 'teacher1.mat.test@eduhub.school',
      phone: '+1 555-8001',
      passwordHash: 'dummy',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    await UserModel.create({
      _id: new mongoose.Types.ObjectId(teacher2UserId),
      fullName: 'Teacher Bob',
      email: 'teacher2.mat.test@eduhub.school',
      phone: '+1 555-8002',
      passwordHash: 'dummy',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Parent Sarah',
      email: 'parent.mat.test@eduhub.school',
      phone: '+1 555-8003',
      passwordHash: 'dummy',
      role: UserRole.PARENT,
      status: 'ACTIVE',
    });

    // 3. Teacher Profiles
    const t1 = await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(teacher1UserId),
      fullName: 'Teacher Alice',
      email: 'teacher1.mat.test@eduhub.school',
      phone: '+1 555-8001',
      employeeId: 'TCH-MAT-TEST-01',
      department: 'Mathematics',
      designation: 'Senior Faculty',
      qualification: 'M.Sc. Mathematics',
      experienceYears: 6,
      joiningDate: new Date('2022-01-01'),
      status: 'ACTIVE',
      assignedClasses: [
        {
          className: 'Class 9',
          section: 'A',
          subject: 'Mathematics',
          academicYear: '2026-2027',
        },
      ],
    });
    teacher1ProfileId = t1._id.toString();

    const t2 = await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(teacher2UserId),
      fullName: 'Teacher Bob',
      email: 'teacher2.mat.test@eduhub.school',
      phone: '+1 555-8002',
      employeeId: 'TCH-MAT-TEST-02',
      department: 'Science',
      designation: 'Faculty',
      qualification: 'M.Sc. Physics',
      experienceYears: 4,
      joiningDate: new Date('2023-01-01'),
      status: 'ACTIVE',
      assignedClasses: [
        {
          className: 'Class 10',
          section: 'B',
          subject: 'Physics',
          academicYear: '2026-2027',
        },
      ],
    });
    teacher2ProfileId = t2._id.toString();

    // 4. Student enrolled under parent in Class 9 Section A
    const s1 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Emma Student',
      studentId: 'STU-MAT-TEST-01',
      dateOfBirth: new Date('2012-05-15'),
      gender: 'FEMALE',
      grade: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      classTeacher: 'Teacher Alice',
      status: 'ACTIVE',
    });
    student1Id = s1._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: {
        $in: [
          'admin.mat.test@eduhub.school',
          'teacher1.mat.test@eduhub.school',
          'teacher2.mat.test@eduhub.school',
          'parent.mat.test@eduhub.school',
        ],
      },
    });
    await TeacherModel.deleteMany({
      employeeId: { $in: ['TCH-MAT-TEST-01', 'TCH-MAT-TEST-02'] },
    });
    await StudentModel.deleteMany({ studentId: 'STU-MAT-TEST-01' });
    await StudyMaterialModel.deleteMany({
      className: { $in: ['Class 9', 'Class 10'] },
    });
  });

  describe('1. Teacher Study Materials Management', () => {
    it('should create a published study material when teacher is authorized for class and subject', async () => {
      const res = await request(app)
        .post('/api/v1/teacher/study-materials')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          title: 'Algebra Polynomials Notes',
          description: 'Comprehensive notes covering chapter 3 polynomials with examples',
          className: 'Class 9',
          section: 'A',
          subject: 'Mathematics',
          academicYear: '2026-2027',
          materialType: 'DOCUMENT',
          fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
          fileName: 'polynomials_chapter3.pdf',
          fileSize: 102400,
          fileType: 'application/pdf',
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Algebra Polynomials Notes');
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.teacherName).toBe('Teacher Alice');
      publishedMaterialId = res.body.data.id;
    });

    it('should create a draft study material with educational link', async () => {
      const res = await request(app)
        .post('/api/v1/teacher/study-materials')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          title: 'Khan Academy Polynomials Video',
          description: 'Watch video lessons 1 through 4',
          className: 'Class 9',
          section: 'A',
          subject: 'Mathematics',
          academicYear: '2026-2027',
          materialType: 'VIDEO',
          externalUrl: 'https://www.youtube.com/watch?v=example123',
          status: 'DRAFT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.materialType).toBe('VIDEO');
      draftMaterialId = res.body.data.id;
    });

    it('should reject study material upload if teacher is not authorized for that class or subject', async () => {
      const res = await request(app)
        .post('/api/v1/teacher/study-materials')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          title: 'Unauthorized Physics Note',
          className: 'Class 10',
          section: 'B',
          subject: 'Physics',
          academicYear: '2026-2027',
          materialType: 'DOCUMENT',
          fileUrl: 'https://example.com/physics.pdf',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should list study materials for teacher with summary counts', async () => {
      const res = await request(app)
        .get('/api/v1/teacher/study-materials')
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.materials.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.summary.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.summary.published).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.draft).toBeGreaterThanOrEqual(1);
    });

    it('should update own study material successfully', async () => {
      const res = await request(app)
        .put(`/api/v1/teacher/study-materials/${publishedMaterialId}`)
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          title: 'Algebra Polynomials Notes - Updated Edition',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Algebra Polynomials Notes - Updated Edition');
    });

    it('should prevent teacher from updating another teacher’s study material', async () => {
      const res = await request(app)
        .put(`/api/v1/teacher/study-materials/${publishedMaterialId}`)
        .set('Authorization', `Bearer ${teacher2Token}`)
        .send({
          title: 'Malicious Update',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow teacher to delete their own study material', async () => {
      const res = await request(app)
        .delete(`/api/v1/teacher/study-materials/${draftMaterialId}`)
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await StudyMaterialModel.findById(draftMaterialId);
      expect(check).toBeNull();
    });
  });

  describe('2. Parent / Student Study Materials Access', () => {
    it('should allow parent to view published study materials for their enrolled child', async () => {
      const res = await request(app)
        .get('/api/v1/parent/study-materials')
        .set('Authorization', `Bearer ${parentToken}`)
        .query({ studentId: student1Id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.materials).toBeDefined();

      const found = res.body.data.materials.find((m: any) => m.id === publishedMaterialId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Algebra Polynomials Notes - Updated Edition');
      expect(found.teacherName).toBe('Teacher Alice');
      expect(found.subject).toBe('Mathematics');
    });

    it('should never show draft study materials to parent or student', async () => {
      // Create a draft material for Class 9 Section A
      const draft = await StudyMaterialModel.create({
        title: 'Secret Draft Notes',
        teacherId: new mongoose.Types.ObjectId(teacher1ProfileId),
        teacherUserId: new mongoose.Types.ObjectId(teacher1UserId),
        teacherName: 'Teacher Alice',
        className: 'Class 9',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2026-2027',
        materialType: 'DOCUMENT',
        status: 'DRAFT',
      });

      const res = await request(app)
        .get('/api/v1/parent/study-materials')
        .set('Authorization', `Bearer ${parentToken}`)
        .query({ studentId: student1Id });

      expect(res.status).toBe(200);
      const found = res.body.data.materials.find((m: any) => m.id === draft._id.toString());
      expect(found).toBeUndefined();

      await StudyMaterialModel.findByIdAndDelete(draft._id);
    });

    it('should reject parent requesting materials for an unauthorized student ID', async () => {
      const randomStudentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get('/api/v1/parent/study-materials')
        .set('Authorization', `Bearer ${parentToken}`)
        .query({ studentId: randomStudentId });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Admin Study Materials Management & Monitoring', () => {
    it('should return aggregated KPI summary for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/study-materials/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalMaterials).toBeGreaterThanOrEqual(1);
      expect(res.body.data.publishedMaterials).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalTeachersUploading).toBeGreaterThanOrEqual(1);
    });

    it('should list all study materials school-wide with filters and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/study-materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          className: 'Class 9',
          subject: 'Mathematics',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.materials).toBeDefined();
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);

      const item = res.body.data.materials.find((m: any) => m.id === publishedMaterialId);
      expect(item).toBeDefined();
      expect(item.teacherName).toBe('Teacher Alice');
    });

    it('should return study material details for admin to inspect', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/study-materials/${publishedMaterialId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(publishedMaterialId);
      expect(res.body.data.title).toBe('Algebra Polynomials Notes - Updated Edition');
    });

    it('should return dropdown filter metadata for admin page', async () => {
      const res = await request(app)
        .get('/api/v1/admin/study-materials/metadata')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teachers).toBeDefined();
      expect(res.body.data.academicYears).toBeDefined();
      expect(res.body.data.subjects).toBeDefined();
    });
  });
});
