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
import { SubmissionModel } from '../../src/modules/teacher/models/Submission.model';
import { TeacherModel } from '../../src/modules/admin/models/Teacher.model';
import { ClassModel } from '../../src/modules/admin/models/Class.model';
import { SectionModel } from '../../src/modules/admin/models/Section.model';

describe('Admin Assignment Management Integration Tests', () => {
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
    email: 'admin.assignment.test@eduhub.school',
    role: UserRole.MANAGEMENT,
    fullName: 'Admin Principal',
  });

  const teacherToken = tokenService.generateAccessToken({
    sub: teacher1UserId,
    email: 'teacher1.assign.test@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Teacher Robert',
  });

  const parentToken = tokenService.generateAccessToken({
    sub: parentUserId,
    email: 'parent.assign.test@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent Peter',
  });

  let teacher1ProfileId: string;
  let teacher2ProfileId: string;
  let student1Id: string;
  let student2Id: string;
  let student3Id: string;
  let student4Id: string;
  let assignmentPublishedId: string;
  let assignmentDraftId: string;
  let submission1Id: string;
  let submission3Id: string;
  let submission4Id: string;

  beforeAll(async () => {
    // 1. Cleanup test fixtures
    await UserModel.deleteMany({
      email: {
        $in: [
          'admin.assignment.test@eduhub.school',
          'teacher1.assign.test@eduhub.school',
          'teacher2.assign.test@eduhub.school',
          'parent.assign.test@eduhub.school',
        ],
      },
    });
    await TeacherModel.deleteMany({ employeeId: { $in: ['TCH-ADM-TEST-01', 'TCH-ADM-TEST-02'] } });
    await StudentModel.deleteMany({
      studentId: { $in: ['STU-ADM-TEST-01', 'STU-ADM-TEST-02', 'STU-ADM-TEST-03', 'STU-ADM-TEST-04'] },
    });
    await ClassModel.deleteMany({ name: 'Class 9' });

    // 2. Create Admin User
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(adminUserId),
      fullName: 'Admin Principal',
      email: 'admin.assignment.test@eduhub.school',
      phone: '+1 555-9000',
      passwordHash: 'dummy',
      role: UserRole.MANAGEMENT,
      status: 'ACTIVE',
    });

    // 3. Create Teachers
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(teacher1UserId),
      fullName: 'Teacher Robert',
      email: 'teacher1.assign.test@eduhub.school',
      phone: '+1 555-9001',
      passwordHash: 'dummy',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    const t1 = await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(teacher1UserId),
      employeeId: 'TCH-ADM-TEST-01',
      fullName: 'Teacher Robert',
      email: 'teacher1.assign.test@eduhub.school',
      phone: '+1 555-9001',
      department: 'Mathematics',
      designation: 'Senior Faculty',
      status: 'ACTIVE',
      assignedClasses: [
        {
          className: 'Class 9',
          section: 'A',
          subject: 'Algebra',
          academicYear: '2026-2027',
        },
      ],
    });
    teacher1ProfileId = t1._id.toString();

    await UserModel.create({
      _id: new mongoose.Types.ObjectId(teacher2UserId),
      fullName: 'Teacher Sarah',
      email: 'teacher2.assign.test@eduhub.school',
      phone: '+1 555-9002',
      passwordHash: 'dummy',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
    });

    const t2 = await TeacherModel.create({
      userId: new mongoose.Types.ObjectId(teacher2UserId),
      employeeId: 'TCH-ADM-TEST-02',
      fullName: 'Teacher Sarah',
      email: 'teacher2.assign.test@eduhub.school',
      phone: '+1 555-9002',
      department: 'Science',
      designation: 'Faculty',
      status: 'ACTIVE',
      assignedClasses: [
        {
          className: 'Class 9',
          section: 'A',
          subject: 'Physics',
          academicYear: '2026-2027',
        },
      ],
    });
    teacher2ProfileId = t2._id.toString();

    // 4. Create Class & Section
    const cls = await ClassModel.create({
      name: 'Class 9',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    await SectionModel.create({
      classId: cls._id,
      name: 'A',
      academicYear: '2026-2027',
      capacity: 40,
      status: 'ACTIVE',
    });

    // 5. Create Parent and Enrolled Students
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Parent Peter',
      email: 'parent.assign.test@eduhub.school',
      phone: '+1 555-9003',
      passwordHash: 'dummy',
      role: UserRole.PARENT,
      status: 'ACTIVE',
    });

    const stu1 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Alice Student',
      studentId: 'STU-ADM-TEST-01',
      rollNumber: '01',
      grade: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    student1Id = stu1._id.toString();

    const stu2 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Bob Student',
      studentId: 'STU-ADM-TEST-02',
      rollNumber: '02',
      grade: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    student2Id = stu2._id.toString();

    const stu3 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Charlie Student',
      studentId: 'STU-ADM-TEST-03',
      rollNumber: '03',
      grade: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    student3Id = stu3._id.toString();

    const stu4 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Diana Student',
      studentId: 'STU-ADM-TEST-04',
      rollNumber: '04',
      grade: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    student4Id = stu4._id.toString();

    // 6. Create Assignments
    const pubAssign = await AssignmentModel.create({
      title: 'Quadratic Equations Homework',
      description: 'Solve problems 1 through 10 from textbook page 45.',
      teacherId: new mongoose.Types.ObjectId(teacher1ProfileId),
      teacherUserId: new mongoose.Types.ObjectId(teacher1UserId),
      teacherName: 'Teacher Robert',
      className: 'Class 9',
      section: 'A',
      subject: 'Algebra',
      academicYear: '2026-2027',
      assignedDate: '2026-11-01',
      dueDate: '2026-11-10',
      maxMarks: 50,
      status: 'PUBLISHED',
      attachmentUrl: 'https://storage.eduhub.school/assignments/quadratics.pdf',
      attachmentName: 'quadratics.pdf',
    });
    assignmentPublishedId = pubAssign._id.toString();

    const draftAssign = await AssignmentModel.create({
      title: 'Polynomials Practice Draft',
      description: 'Draft assignment for upcoming week.',
      teacherId: new mongoose.Types.ObjectId(teacher1ProfileId),
      teacherUserId: new mongoose.Types.ObjectId(teacher1UserId),
      teacherName: 'Teacher Robert',
      className: 'Class 9',
      section: 'A',
      subject: 'Algebra',
      academicYear: '2026-2027',
      assignedDate: '2026-11-15',
      dueDate: '2026-11-20',
      maxMarks: 25,
      status: 'DRAFT',
    });
    assignmentDraftId = draftAssign._id.toString();

    // 7. Create Submission for Student 1 (Graded and Published)
    const sub = await SubmissionModel.create({
      assignmentId: pubAssign._id,
      studentId: stu1._id,
      parentId: new mongoose.Types.ObjectId(parentUserId),
      teacherUserId: new mongoose.Types.ObjectId(teacher1UserId),
      className: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      subject: 'Algebra',
      answerText: 'Step 1: x^2 + 5x + 6 = 0 => (x+2)(x+3) = 0 => x = -2, -3',
      submittedAt: new Date('2026-11-05T10:00:00Z'),
      status: 'SUBMITTED',
      isLate: false,
      version: 1,
      gradingStatus: 'GRADED',
      marksObtained: 48,
      maxMarks: 50,
      feedback: 'Excellent step-by-step working!',
      isPublished: true,
      publishedAt: new Date('2026-11-06T14:00:00Z'),
      gradedAt: new Date('2026-11-06T14:00:00Z'),
      gradedBy: new mongoose.Types.ObjectId(teacher1UserId),
    });
    submission1Id = sub.superId ? sub.superId.toString() : sub._id.toString();

    // 8. Create Submission for Student 3 (Submitted only, PENDING review, not evaluated)
    const sub3 = await SubmissionModel.create({
      assignmentId: pubAssign._id,
      studentId: stu3._id,
      parentId: new mongoose.Types.ObjectId(parentUserId),
      teacherUserId: new mongoose.Types.ObjectId(teacher1UserId),
      className: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      subject: 'Algebra',
      answerText: 'Step 1: x^2 + 7x + 12 = 0 => (x+3)(x+4) = 0',
      submittedAt: new Date('2026-11-06T11:00:00Z'),
      status: 'SUBMITTED',
      maxMarks: 50,
      isLate: false,
      version: 1,
      gradingStatus: 'PENDING',
      isPublished: false,
    });
    submission3Id = sub3._id.toString();

    // 9. Create Submission for Student 4 (Submitted and Graded, but UNPUBLISHED / draft marks)
    const sub4 = await SubmissionModel.create({
      assignmentId: pubAssign._id,
      studentId: stu4._id,
      parentId: new mongoose.Types.ObjectId(parentUserId),
      teacherUserId: new mongoose.Types.ObjectId(teacher1UserId),
      className: 'Class 9',
      section: 'A',
      academicYear: '2026-2027',
      subject: 'Algebra',
      answerText: 'Step 1: 2x^2 + 8x = 0 => 2x(x+4) = 0 => x = 0, -4',
      submittedAt: new Date('2026-11-07T09:00:00Z'),
      status: 'GRADED',
      isLate: false,
      version: 1,
      gradingStatus: 'GRADED',
      marksObtained: 42,
      maxMarks: 50,
      feedback: 'Good attempt, minor calculation note.',
      isPublished: false,
      gradedAt: new Date('2026-11-08T10:00:00Z'),
      gradedBy: new mongoose.Types.ObjectId(teacher1UserId),
    });
    submission4Id = sub4._id.toString();
  });

  afterAll(async () => {
    // Cleanup created records
    await UserModel.deleteMany({
      email: {
        $in: [
          'admin.assignment.test@eduhub.school',
          'teacher1.assign.test@eduhub.school',
          'teacher2.assign.test@eduhub.school',
          'parent.assign.test@eduhub.school',
        ],
      },
    });
    await TeacherModel.deleteMany({ employeeId: { $in: ['TCH-ADM-TEST-01', 'TCH-ADM-TEST-02'] } });
    await StudentModel.deleteMany({ studentId: { $in: ['STU-ADM-TEST-01', 'STU-ADM-TEST-02'] } });
    await AssignmentModel.deleteMany({
      _id: { $in: [assignmentPublishedId, assignmentDraftId] },
    });
    await SubmissionModel.deleteMany({ _id: { $in: [submission1Id, submission3Id, submission4Id] } });
    await StudentModel.deleteMany({
      _id: { $in: [student1Id, student2Id, student3Id, student4Id] },
    });
    await ClassModel.deleteMany({ name: 'Class 9' });
  });

  describe('Authorization Controls', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/assignments');
      expect(res.status).toBe(401);
    });

    it('should reject teacher role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject parent role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow MANAGEMENT role with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/assignments/summary', () => {
    it('should return aggregated counts matching DB records', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments/summary?academicYear=2026-2027')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.totalAssignments).toBeGreaterThanOrEqual(2);
      expect(data.publishedAssignments).toBeGreaterThanOrEqual(1);
      expect(data.totalSubmissions).toBeGreaterThanOrEqual(1);
      expect(data.evaluatedSubmissions).toBeGreaterThanOrEqual(1);
      expect(data.resultsPublished).toBeGreaterThanOrEqual(1);
      expect(data.pendingSubmissions).toBeGreaterThanOrEqual(1); // Student 2 has not submitted yet
    });
  });

  describe('GET /api/v1/admin/assignments/metadata', () => {
    it('should return filter dropdown metadata', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments/metadata')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(Array.isArray(data.academicYears)).toBe(true);
      expect(Array.isArray(data.classes)).toBe(true);
      expect(Array.isArray(data.subjects)).toBe(true);
      expect(Array.isArray(data.teachers)).toBe(true);

      const foundTeacher = data.teachers.find((t: any) => t.employeeId === 'TCH-ADM-TEST-01');
      expect(foundTeacher).toBeDefined();
      expect(foundTeacher.name).toBe('Teacher Robert');
    });
  });

  describe('GET /api/v1/admin/assignments (Listing & Filtering)', () => {
    it('should list all assignments across teachers and classes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments?academicYear=2026-2027')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { assignments, pagination, summary } = res.body.data;

      expect(Array.isArray(assignments)).toBe(true);
      expect(pagination.total).toBeGreaterThanOrEqual(2);
      expect(summary).toBeDefined();

      const pubItem = assignments.find((a: any) => a.id === assignmentPublishedId);
      expect(pubItem).toBeDefined();
      expect(pubItem.title).toBe('Quadratic Equations Homework');
      expect(pubItem.teacherName).toBe('Teacher Robert');
      expect(pubItem.className).toBe('Class 9');
      expect(pubItem.section).toBe('A');
      expect(pubItem.subject).toBe('Algebra');
      expect(pubItem.maxMarks).toBe(50);
      expect(pubItem.status).toBe('PUBLISHED');
      expect(pubItem.totalStudents).toBe(4);
      expect(pubItem.submittedCount).toBe(3);
      expect(pubItem.pendingCount).toBe(1);
      expect(pubItem.evaluatedCount).toBe(2);
      expect(pubItem.resultsPublishedCount).toBe(1);
      expect(pubItem.resultPublicationStatus).toBe('PARTIALLY_PUBLISHED');
    });

    it('should filter assignments by search term in title', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments?search=Quadratic')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { assignments } = res.body.data;
      expect(assignments.some((a: any) => a.id === assignmentPublishedId)).toBe(true);
      expect(assignments.every((a: any) => a.title.toLowerCase().includes('quadratic'))).toBe(true);
    });

    it('should filter assignments by teacherId', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/assignments?teacherId=${teacher1ProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { assignments } = res.body.data;
      expect(assignments.length).toBeGreaterThanOrEqual(1);
      expect(assignments.every((a: any) => a.teacherId === teacher1ProfileId)).toBe(true);
    });

    it('should filter assignments by status (DRAFT vs PUBLISHED)', async () => {
      const resDraft = await request(app)
        .get('/api/v1/admin/assignments?status=DRAFT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resDraft.status).toBe(200);
      const draftItems = resDraft.body.data.assignments;
      expect(draftItems.some((a: any) => a.id === assignmentDraftId)).toBe(true);
      expect(draftItems.every((a: any) => a.status === 'DRAFT')).toBe(true);

      const resPub = await request(app)
        .get('/api/v1/admin/assignments?status=PUBLISHED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resPub.status).toBe(200);
      const pubItems = resPub.body.data.assignments;
      expect(pubItems.some((a: any) => a.id === assignmentPublishedId)).toBe(true);
      expect(pubItems.every((a: any) => a.status === 'PUBLISHED')).toBe(true);
    });
  });

  describe('GET /api/v1/admin/assignments/:id (Details & Submission Roster)', () => {
    it('should return 400 for invalid mongo ObjectId', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments/invalid-id-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent assignment', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/admin/assignments/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return complete assignment details, overview metrics, and student roster', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/assignments/${assignmentPublishedId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { assignment, overview, students } = res.body.data;

      // 1. Assignment Information
      expect(assignment.id).toBe(assignmentPublishedId);
      expect(assignment.title).toBe('Quadratic Equations Homework');
      expect(assignment.description).toContain('textbook page 45');
      expect(assignment.teacherName).toBe('Teacher Robert');
      expect(assignment.className).toBe('Class 9');
      expect(assignment.section).toBe('A');
      expect(assignment.subject).toBe('Algebra');
      expect(assignment.maxMarks).toBe(50);
      expect(assignment.attachmentUrl).toBe('https://storage.eduhub.school/assignments/quadratics.pdf');
      expect(assignment.attachmentName).toBe('quadratics.pdf');

      // 2. Submission Overview Metrics
      expect(overview.totalEnrolled).toBe(4);
      expect(overview.submitted).toBe(3);
      expect(overview.pending).toBe(1);
      expect(overview.evaluated).toBe(2);
      expect(overview.resultsPublished).toBe(1);
      expect(overview.submissionRatePercentage).toBe(75);
      expect(overview.evaluationRatePercentage).toBe(67);

      // 3. Student Submission Roster
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBe(4);

      // Student 1 (Submitted, Evaluated, Published)
      const s1Row = students.find((s: any) => s.studentId === student1Id);
      expect(s1Row).toBeDefined();
      expect(s1Row.studentName).toBe('Alice Student');
      expect(s1Row.admissionId).toBe('STU-ADM-TEST-01');
      expect(s1Row.submissionStatus).toBe('SUBMITTED');
      expect(s1Row.evaluationStatus).toBe('GRADED');
      expect(s1Row.marksObtained).toBe(48);
      expect(s1Row.maxMarks).toBe(50);
      expect(s1Row.resultPublicationStatus).toBe('PUBLISHED');
      expect(s1Row.answerText).toContain('(x+2)(x+3) = 0');
      expect(s1Row.feedback).toBe('Excellent step-by-step working!');

      // Student 2 (Case 1: No submission -> Not Submitted)
      const s2Row = students.find((s: any) => s.studentId === student2Id);
      expect(s2Row).toBeDefined();
      expect(s2Row.studentName).toBe('Bob Student');
      expect(s2Row.admissionId).toBe('STU-ADM-TEST-02');
      expect(s2Row.submissionStatus).toBe('NOT_SUBMITTED');
      expect(s2Row.evaluationStatus).toBe('NOT_SUBMITTED');
      expect(s2Row.marksObtained).toBeNull();
      expect(s2Row.resultPublicationStatus).toBe('NOT_SUBMITTED');

      // Student 3 (Case 2: Submitted work only, pending review)
      const s3Row = students.find((s: any) => s.studentId === student3Id);
      expect(s3Row).toBeDefined();
      expect(s3Row.studentName).toBe('Charlie Student');
      expect(s3Row.admissionId).toBe('STU-ADM-TEST-03');
      expect(s3Row.submissionStatus).toBe('SUBMITTED');
      expect(s3Row.evaluationStatus).toBe('PENDING');
      expect(s3Row.marksObtained).toBeNull(); // Do not expose marks before evaluation
      expect(s3Row.resultPublicationStatus).toBe('NOT_SUBMITTED');

      // Student 4 (Case 3: Submitted and evaluated, but unpublished)
      const s4Row = students.find((s: any) => s.studentId === student4Id);
      expect(s4Row).toBeDefined();
      expect(s4Row.studentName).toBe('Diana Student');
      expect(s4Row.admissionId).toBe('STU-ADM-TEST-04');
      expect(s4Row.submissionStatus).toBe('SUBMITTED');
      expect(s4Row.evaluationStatus).toBe('GRADED');
      expect(s4Row.marksObtained).toBe(42);
      expect(s4Row.resultPublicationStatus).toBe('UNPUBLISHED');
    });
  });

  describe('GET /api/v1/admin/assignments/monitoring/teachers', () => {
    it('should return teacher-wise assignment and evaluation statistics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assignments/monitoring/teachers?academicYear=2026-2027')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(Array.isArray(data)).toBe(true);
      const t1Data = data.find((t: any) => t.employeeId === 'TCH-ADM-TEST-01');
      expect(t1Data).toBeDefined();
      expect(t1Data.teacherName).toBe('Teacher Robert');
      expect(t1Data.assignmentsCreated).toBeGreaterThanOrEqual(2);
      expect(t1Data.publishedAssignments).toBeGreaterThanOrEqual(1);
      expect(t1Data.totalSubmissionsReceived).toBeGreaterThanOrEqual(3);
      expect(t1Data.pendingEvaluations).toBe(1); // sub3 is pending review
      expect(t1Data.publishedResults).toBeGreaterThanOrEqual(1);
    });
  });
});
