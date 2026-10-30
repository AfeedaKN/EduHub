import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { AssignmentModel } from '../../src/modules/teacher/models/Assignment.model';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';

describe('Student & Parent Assignment Visibility Workflow Verification (Step 6)', () => {
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
  const parent1UserId = new mongoose.Types.ObjectId().toString();
  const parent2UserId = new mongoose.Types.ObjectId().toString();

  const teacherToken = tokenService.generateAccessToken({
    sub: teacherUserId,
    email: 'teacher.workflow@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Teacher Alice',
  });

  const parent1Token = tokenService.generateAccessToken({
    sub: parent1UserId,
    email: 'parent1.workflow@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent One',
  });

  const parent2Token = tokenService.generateAccessToken({
    sub: parent2UserId,
    email: 'parent2.workflow@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent Two',
  });

  let studentGrade7AId: string;
  let studentGrade7BId: string;
  let studentGrade6AId: string;

  let publishedAssignmentId: string;
  let draftAssignmentId: string;
  let withdrawnAssignmentId: string;

  beforeAll(async () => {
    // Clean up potential leftovers from interrupted previous runs
    await UserModel.deleteMany({
      email: {
        $in: [
          'teacher.workflow@eduhub.school',
          'parent1.workflow@eduhub.school',
          'parent2.workflow@eduhub.school',
        ],
      },
    });
    await StudentModel.deleteMany({
      studentId: { $in: ['STU-7A-01', 'STU-7B-01', 'STU-6A-01'] },
    });
    await TeacherModel.deleteMany({ employeeId: 'TCH-WF-01' });

    // Teacher user and teacher profile
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(teacherUserId),
      fullName: 'Teacher Alice',
      email: 'teacher.workflow@eduhub.school',
      phone: '+1 555-7000',
      passwordHash: 'dummy',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(teacherUserId),
      employeeId: 'TCH-WF-01',
      fullName: 'Teacher Alice',
      email: 'teacher.workflow@eduhub.school',
      phone: '+1 555-7000',
      department: 'Computer Science',
      designation: 'Senior Faculty',
      status: 'ACTIVE',
      assignedClasses: [
        {
          className: 'Grade 7',
          section: 'A',
          subject: 'Computer',
        },
      ],
    });

    // Parent 1 has a child in Grade 7 Section A
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parent1UserId),
      fullName: 'Parent One',
      email: 'parent1.workflow@eduhub.school',
      phone: '+1 555-7001',
      passwordHash: 'dummy',
      role: UserRole.PARENT,
      status: 'ACTIVE',
    });

    const stu7A = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parent1UserId),
      fullName: 'Chottu 7A',
      studentId: 'STU-7A-01',
      grade: 'Grade 7',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    studentGrade7AId = stu7A._id.toString();

    // Parent 2 has a child in Grade 7 Section B, and another in Grade 6 Section A
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parent2UserId),
      fullName: 'Parent Two',
      email: 'parent2.workflow@eduhub.school',
      phone: '+1 555-7002',
      passwordHash: 'dummy',
      role: UserRole.PARENT,
      status: 'ACTIVE',
    });

    const stu7B = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parent2UserId),
      fullName: 'Student 7B',
      studentId: 'STU-7B-01',
      grade: 'Grade 7',
      section: 'B',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    studentGrade7BId = stu7B._id.toString();

    const stu6A = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parent2UserId),
      fullName: 'Student 6A',
      studentId: 'STU-6A-01',
      grade: 'Grade 6',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    studentGrade6AId = stu6A._id.toString();
  });

  afterAll(async () => {
    await StudentModel.deleteMany({
      _id: { $in: [studentGrade7AId, studentGrade7BId, studentGrade6AId] },
    });
    await TeacherModel.deleteMany({
      userId: teacherUserId,
    });
    await UserModel.deleteMany({
      _id: { $in: [parent1UserId, parent2UserId, teacherUserId] },
    });
    await AssignmentModel.deleteMany({
      _id: { $in: [publishedAssignmentId, draftAssignmentId, withdrawnAssignmentId] },
    });
  });

  // Case 1 & 10: Teacher assignment creation, editing, and publishing
  it('Case 1 & 10: Teacher creates, edits, and publishes assignment for Grade 7 Section A', async () => {
    // 1. Teacher creates draft
    const createRes = await request(app)
      .post('/api/v1/teacher/assignments')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'cs',
        description: 'Introduction to Computer Science & Python syntax',
        className: 'Grade 7',
        section: 'A',
        subject: 'Computer',
        academicYear: '2026-2027',
        assignedDate: '2026-10-30',
        dueDate: '2026-11-05',
        maxMarks: 50,
        status: 'DRAFT',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    publishedAssignmentId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('DRAFT');

    // 2. Teacher edits assignment
    const editRes = await request(app)
      .put(`/api/v1/teacher/assignments/${publishedAssignmentId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'cs',
        description: 'Introduction to Computer Science & Python syntax (Updated)',
        className: 'Grade 7',
        section: 'A',
        subject: 'Computer',
        academicYear: '2026-2027',
        assignedDate: '2026-10-30',
        dueDate: '2026-11-05',
        maxMarks: 50,
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.data.description).toContain('(Updated)');

    // 3. Teacher publishes assignment
    const pubRes = await request(app)
      .patch(`/api/v1/teacher/assignments/${publishedAssignmentId}/status`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'PUBLISHED' });

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.status).toBe('PUBLISHED');

    // Also create a DRAFT assignment
    const draftRes = await request(app)
      .post('/api/v1/teacher/assignments')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Draft Exam Prep',
        description: 'Not ready yet',
        className: 'Grade 7',
        section: 'A',
        subject: 'Computer',
        academicYear: '2026-2027',
        assignedDate: '2026-10-30',
        dueDate: '2026-11-10',
        maxMarks: 20,
        status: 'DRAFT',
      });
    draftAssignmentId = draftRes.body.data.id;

    // And a custom ARCHIVED / UNPUBLISHED assignment
    const w = await AssignmentModel.create({
      title: 'Archived Task',
      description: 'Archived by teacher',
      teacherId: new mongoose.Types.ObjectId(),
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
      teacherName: 'Teacher Alice',
      className: 'Grade 7',
      section: 'A',
      subject: 'Computer',
      academicYear: '2026-2027',
      assignedDate: '2026-10-30',
      dueDate: '2026-11-10',
      maxMarks: 20,
      status: 'ARCHIVED',
    });
    withdrawnAssignmentId = w._id.toString();
  });

  // Case 2: Student enrolled in Grade 7, Section A can see it
  it('Case 2: Student enrolled in Grade 7, Section A can see the published assignment', async () => {
    // Via parent/assignments
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade7AId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const assignment = res.body.data.assignments.find((a: any) => a.id === publishedAssignmentId);
    expect(assignment).toBeDefined();
    expect(assignment.title).toBe('cs');
    expect(assignment.subject).toBe('Computer');
    expect(assignment.className).toBe('Grade 7');
    expect(assignment.section).toBe('A');
    expect(assignment.status).toBe('PUBLISHED');
    expect(assignment.remainingText).toBeDefined();

    // Via student/assignments alias
    const studentRes = await request(app)
      .get(`/api/v1/student/assignments?studentId=${studentGrade7AId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(studentRes.status).toBe(200);
    expect(studentRes.body.data.assignments.some((a: any) => a.id === publishedAssignmentId)).toBe(true);
  });

  // Case 3: Student in another section cannot see it
  it('Case 3: Student in another section (Grade 7, Section B) cannot see it', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade7BId}`)
      .set('Authorization', `Bearer ${parent2Token}`);

    expect(res.status).toBe(200);
    const assignmentIds = res.body.data.assignments.map((a: any) => a.id);
    expect(assignmentIds).not.toContain(publishedAssignmentId);
  });

  // Case 4: Student in another class cannot see it
  it('Case 4: Student in another class (Grade 6, Section A) cannot see it', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade6AId}`)
      .set('Authorization', `Bearer ${parent2Token}`);

    expect(res.status).toBe(200);
    const assignmentIds = res.body.data.assignments.map((a: any) => a.id);
    expect(assignmentIds).not.toContain(publishedAssignmentId);
  });

  // Case 5: Draft assignment is not visible
  it('Case 5: Draft assignment is not visible to students or parents', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade7AId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    const assignmentIds = res.body.data.assignments.map((a: any) => a.id);
    expect(assignmentIds).not.toContain(draftAssignmentId);
  });

  // Case 6: Unpublished or withdrawn assignment is not visible
  it('Case 6: Withdrawn or unpublished assignment is not visible', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade7AId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    const assignmentIds = res.body.data.assignments.map((a: any) => a.id);
    expect(assignmentIds).not.toContain(withdrawnAssignmentId);
  });

  // Case 7: Authorized student can open assignment details
  it('Case 7: Authorized student/parent can open assignment details', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments/${publishedAssignmentId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(publishedAssignmentId);
    expect(res.body.data.title).toBe('cs');
    expect(res.body.data.className).toBe('Grade 7');
    expect(res.body.data.section).toBe('A');
    expect(res.body.data.subject).toBe('Computer');
    expect(res.body.data.maxMarks).toBe(50);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  // Case 8: Unauthorized student cannot access assignment details
  it('Case 8: Unauthorized student receives 403 Forbidden on direct assignment details request', async () => {
    // Parent 2 has children in Grade 7-B and Grade 6-A, but NOT Grade 7-A
    const res = await request(app)
      .get(`/api/v1/parent/assignments/${publishedAssignmentId}`)
      .set('Authorization', `Bearer ${parent2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Case 8b: Direct detail access to draft assignment returns 404
  it('Case 8b: Direct detail access to a draft assignment returns 404 Not Found', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments/${draftAssignmentId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(404);
  });

  // Case 9: Refreshing the student page loads assignments from backend with correct KPIs
  it('Case 9: Refreshing student assignments page loads data idempotently from backend', async () => {
    const res1 = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade7AId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    const res2 = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${studentGrade7AId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.data.assignments.length).toBe(res2.body.data.assignments.length);
    expect(res2.body.data.summary.total).toBeGreaterThanOrEqual(1);
    expect(res2.body.data.summary.pending).toBeGreaterThanOrEqual(1);
  });
});
