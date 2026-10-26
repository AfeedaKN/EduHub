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
import { ExamModel } from '../../src/modules/admin/models/Exam.model';
import { ExamScheduleModel } from '../../src/modules/admin/models/ExamSchedule.model';
import { ExamMarksModel } from '../../src/modules/admin/models/ExamMarks.model';

describe('Parent Routes Integration Tests — Assignments', () => {
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

  const parent1UserId = new mongoose.Types.ObjectId().toString();
  const parent2UserId = new mongoose.Types.ObjectId().toString();
  const teacherUserId = new mongoose.Types.ObjectId().toString();

  const parent1Token = tokenService.generateAccessToken({
    sub: parent1UserId,
    email: 'parent1.assignments@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Robert Jenkins',
  });

  const parent2Token = tokenService.generateAccessToken({
    sub: parent2UserId,
    email: 'parent2.assignments@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Maria Garcia',
  });

  const teacherToken = tokenService.generateAccessToken({
    sub: teacherUserId,
    email: 'teacher.parenttest@eduhub.school',
    role: UserRole.TEACHER,
    fullName: 'Prof. Test Teacher',
  });

  let child1Id: string;
  let child2Id: string;
  let strangerChildId: string;
  let publishedAssignmentGrade5Id: string;
  let draftAssignmentGrade5Id: string;
  let assignmentGrade10Id: string;

  beforeAll(async () => {
    // 1. Create parent 1 user and their 2 children (Child 1 in Grade 5-A, Child 2 in Grade 8-B)
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parent1UserId),
      fullName: 'Robert Jenkins',
      email: 'parent1.assignments@eduhub.school',
      phone: '+1 555-1111',
      passwordHash: 'dummy',
      role: UserRole.PARENT,
      status: 'ACTIVE',
    });

    const c1 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parent1UserId),
      fullName: 'Emily Jenkins',
      studentId: 'STU-P-01',
      grade: 'Grade 5',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    child1Id = c1._id.toString();

    const c2 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parent1UserId),
      fullName: 'Lucas Jenkins',
      studentId: 'STU-P-02',
      grade: 'Grade 8',
      section: 'B',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    child2Id = c2._id.toString();

    // 2. Create parent 2 user with child in Grade 11-A
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parent2UserId),
      fullName: 'Maria Garcia',
      email: 'parent2.assignments@eduhub.school',
      phone: '+1 555-2222',
      passwordHash: 'dummy',
      role: UserRole.PARENT,
      status: 'ACTIVE',
    });

    const c3 = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parent2UserId),
      fullName: 'Mateo Garcia',
      studentId: 'STU-P-03',
      grade: 'Grade 11',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    strangerChildId = c3._id.toString();

    // 3. Create assignments:
    // a) Published assignment for Grade 5-A
    const a1 = await AssignmentModel.create({
      title: 'Grade 5 Science Nature Journal',
      description: 'Observe 3 plants in your local garden.',
      teacherId: new mongoose.Types.ObjectId(),
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
      teacherName: 'Prof. Test Teacher',
      className: 'Grade 5',
      section: 'A',
      subject: 'Science',
      academicYear: '2026-2027',
      assignedDate: '2026-10-10',
      dueDate: '2026-11-25',
      maxMarks: 40,
      status: 'PUBLISHED',
      attachmentUrl: 'https://example.com/journal.pdf',
      attachmentName: 'journal_instructions.pdf',
    });
    publishedAssignmentGrade5Id = a1._id.toString();

    // b) DRAFT assignment for Grade 5-A (must remain invisible to parents)
    const a2 = await AssignmentModel.create({
      title: 'Secret Draft Science Test',
      description: 'Do not show to parents yet.',
      teacherId: new mongoose.Types.ObjectId(),
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
      teacherName: 'Prof. Test Teacher',
      className: 'Grade 5',
      section: 'A',
      subject: 'Science',
      academicYear: '2026-2027',
      assignedDate: '2026-10-10',
      dueDate: '2026-10-25',
      maxMarks: 100,
      status: 'DRAFT',
    });
    draftAssignmentGrade5Id = a2._id.toString();

    // c) Published assignment for Grade 11-A (for Mateo Garcia, not for Emily or Lucas)
    const a3 = await AssignmentModel.create({
      title: 'Grade 11 Calculus Matrix Equations',
      description: 'Solve system of linear equations using Gaussian elimination.',
      teacherId: new mongoose.Types.ObjectId(),
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
      teacherName: 'Prof. Test Teacher',
      className: 'Grade 11',
      section: 'A',
      subject: 'Calculus',
      academicYear: '2026-2027',
      assignedDate: '2026-10-12',
      dueDate: '2026-10-20',
      maxMarks: 50,
      status: 'PUBLISHED',
    });
    assignmentGrade10Id = a3._id.toString();
  });

  afterAll(async () => {
    await StudentModel.deleteMany({
      _id: { $in: [child1Id, child2Id, strangerChildId] },
    });
    await UserModel.deleteMany({
      _id: { $in: [parent1UserId, parent2UserId] },
    });
    await AssignmentModel.deleteMany({
      _id: {
        $in: [
          publishedAssignmentGrade5Id,
          draftAssignmentGrade5Id,
          assignmentGrade10Id,
        ],
      },
    });
  });

  it('GET /api/v1/parent/assignments without auth token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/parent/assignments');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/parent/assignments with Teacher token returns 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/parent/assignments')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/parent/assignments returns published assignments matching enrolled child Grade 5-A', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${child1Id}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.selectedChild.fullName).toBe('Emily Jenkins');
    expect(res.body.data.selectedChild.grade).toBe('Grade 5');

    // Published assignment should be present
    const titles = res.body.data.assignments.map((a: any) => a.title);
    expect(titles).toContain('Grade 5 Science Nature Journal');

    // DRAFT assignment must NOT be exposed
    expect(titles).not.toContain('Secret Draft Science Test');

    // Unrelated class (Grade 11 Calculus) must NOT be exposed to Grade 5
    expect(titles).not.toContain('Grade 11 Calculus Matrix Equations');

    // Summary metrics
    expect(res.body.data.summary.total).toBe(1);
    expect(res.body.data.summary.upcoming).toBe(1);
  });

  it('GET /api/v1/parent/assignments switching to second child returns empty when no assignments scheduled', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${child2Id}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.selectedChild.fullName).toBe('Lucas Jenkins');
    expect(res.body.data.selectedChild.grade).toBe('Grade 8');
    expect(res.body.data.assignments).toHaveLength(0);
    expect(res.body.data.summary.total).toBe(0);
  });

  it('GET /api/v1/parent/assignments fails with 403 when trying to access stranger child', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments?studentId=${strangerChildId}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/parent/assignments/:id returns assignment details if matching child class', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/assignments/${publishedAssignmentGrade5Id}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(publishedAssignmentGrade5Id);
    expect(res.body.data.title).toBe('Grade 5 Science Nature Journal');
    expect(res.body.data.submissionStatus).toBe('NOT_SUBMITTED');
    expect(res.body.data.submissionTrackingAvailable).toBe(true);
  });

  it('GET /api/v1/parent/assignments/:id fails with 403 when parent has no child in that class', async () => {
    // Parent 1 has children in Grade 5 and 8, assignment is for Grade 11
    const res = await request(app)
      .get(`/api/v1/parent/assignments/${assignmentGrade10Id}`)
      .set('Authorization', `Bearer ${parent1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  describe('POST /api/v1/parent/assignments/:id/submit', () => {
    it('successfully submits coursework with text and attachment', async () => {
      const res = await request(app)
        .post(`/api/v1/parent/assignments/${publishedAssignmentGrade5Id}/submit`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          studentId: child1Id,
          answerText: 'My nature observation journal report.',
          attachmentUrl: 'https://storage.eduhub.local/submissions/journal.pdf',
          attachmentName: 'nature_journal.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.answerText).toBe('My nature observation journal report.');
      expect(res.body.data.canResubmit).toBe(true);
    });

    it('GET /api/v1/parent/assignments now reflects SUBMITTED status', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/assignments?studentId=${child1Id}`)
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(res.status).toBe(200);
      const subAssignment = res.body.data.assignments.find((a: any) => a.id === publishedAssignmentGrade5Id);
      expect(subAssignment).toBeDefined();
      expect(subAssignment.submissionStatus).toBe('SUBMITTED');
      expect(subAssignment.submission).toBeDefined();
      expect(subAssignment.submission.version).toBe(1);
    });

    it('allows resubmission and increments version while preserving history', async () => {
      const res = await request(app)
        .post(`/api/v1/parent/assignments/${publishedAssignmentGrade5Id}/submit`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          studentId: child1Id,
          answerText: 'Updated revised report with extra observations.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('RESUBMITTED');
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.answerText).toBe('Updated revised report with extra observations.');
    });

    it('fails with 403 when trying to submit for another parent child', async () => {
      const res = await request(app)
        .post(`/api/v1/parent/assignments/${publishedAssignmentGrade5Id}/submit`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          studentId: strangerChildId,
          answerText: 'Unauthorized submission attempt.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('fails with 400 when neither answer text nor attachment is provided', async () => {
      const res = await request(app)
        .post(`/api/v1/parent/assignments/${publishedAssignmentGrade5Id}/submit`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          studentId: child1Id,
          answerText: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Teacher can view the submitted coursework via GET /assignments/:id/submissions', async () => {
      const res = await request(app)
        .get(`/api/v1/teacher/assignments/${publishedAssignmentGrade5Id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].studentName).toBe('Emily Jenkins');
      expect(res.body.data[0].version).toBe(2);
      expect(res.body.data[0].answerText).toBe('Updated revised report with extra observations.');
    });
  });

  describe('GET /api/v1/parent/exams — Examination Results and Report Cards', () => {
    let testExamMidtermId: string;
    let testExamAnnualId: string;
    let schMathId: string;
    let schScienceId: string;
    let schEnglishId: string;

    beforeAll(async () => {
      // Create test exams
      const exam1 = await ExamModel.create({
        name: 'Mid-Term Institutional Examination',
        examType: 'MID_TERM',
        academicYear: '2026-2027',
        status: 'ONGOING',
        applicableClasses: [{ classId: new mongoose.Types.ObjectId(), className: 'Grade 5' }],
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-10-25'),
        createdBy: new mongoose.Types.ObjectId(),
      });
      testExamMidtermId = exam1._id.toString();

      const exam2 = await ExamModel.create({
        name: 'Annual Examination 2026',
        examType: 'ANNUAL_EXAM',
        academicYear: '2026-2027',
        status: 'SCHEDULED',
        applicableClasses: [{ classId: new mongoose.Types.ObjectId(), className: 'Grade 5' }],
        startDate: new Date('2026-12-01'),
        endDate: new Date('2026-12-15'),
        createdBy: new mongoose.Types.ObjectId(),
      });
      testExamAnnualId = exam2._id.toString();

      // Create schedules
      const sMath = await ExamScheduleModel.create({
        examId: exam1._id,
        classId: new mongoose.Types.ObjectId(),
        className: 'Grade 5',
        section: 'A',
        subject: 'Mathematics',
        examDate: new Date('2026-10-18'),
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 40,
        academicYear: '2026-2027',
      });
      schMathId = sMath._id.toString();

      const sSci = await ExamScheduleModel.create({
        examId: exam1._id,
        classId: new mongoose.Types.ObjectId(),
        className: 'Grade 5',
        section: 'A',
        subject: 'Science',
        examDate: new Date('2026-10-20'),
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 40,
        academicYear: '2026-2027',
      });
      schScienceId = sSci._id.toString();

      const sEng = await ExamScheduleModel.create({
        examId: exam1._id,
        classId: new mongoose.Types.ObjectId(),
        className: 'Grade 8',
        section: 'B',
        subject: 'English',
        examDate: new Date('2026-10-22'),
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 40,
        academicYear: '2026-2027',
      });
      schEnglishId = sEng._id.toString();

      // Create Marks Documents
      // 1. Published Marks for Math (Emily scored 92 -> Passed, Grade A+)
      await ExamMarksModel.create({
        examScheduleId: sMath._id,
        examId: exam1._id,
        academicYear: '2026-2027',
        classId: sMath.classId,
        className: 'Grade 5',
        section: 'A',
        subject: 'Mathematics',
        maxMarks: 100,
        passingMarks: 40,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-10-25T14:00:00Z'),
        publishedByName: 'Admin',
        teacherUserId: new mongoose.Types.ObjectId(),
        teacherId: new mongoose.Types.ObjectId(),
        teacherName: 'Prof. Math',
        totalStudents: 1,
        enteredCount: 1,
        students: [
          {
            studentId: new mongoose.Types.ObjectId(child1Id),
            studentName: 'Emily Jenkins',
            admissionNumber: 'STU-P-01',
            marksObtained: 92,
            isAbsent: false,
            remarks: 'Superb problem-solving skills!',
          },
        ],
      });

      // 2. Published Marks for Science (Emily was Absent -> isAbsent: true, grade: AB)
      await ExamMarksModel.create({
        examScheduleId: sSci._id,
        examId: exam1._id,
        academicYear: '2026-2027',
        classId: sSci.classId,
        className: 'Grade 5',
        section: 'A',
        subject: 'Science',
        maxMarks: 100,
        passingMarks: 40,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-10-25T14:30:00Z'),
        publishedByName: 'Admin',
        teacherUserId: new mongoose.Types.ObjectId(),
        teacherId: new mongoose.Types.ObjectId(),
        teacherName: 'Prof. Science',
        totalStudents: 1,
        enteredCount: 1,
        students: [
          {
            studentId: new mongoose.Types.ObjectId(child1Id),
            studentName: 'Emily Jenkins',
            admissionNumber: 'STU-P-01',
            marksObtained: null,
            isAbsent: true,
            remarks: 'Excused medical absence',
          },
        ],
      });

      // 3. Draft/Unpublished Marks for Annual Exam (Must remain hidden from parents!)
      await ExamMarksModel.create({
        examScheduleId: new mongoose.Types.ObjectId(),
        examId: exam2._id,
        academicYear: '2026-2027',
        classId: sMath.classId,
        className: 'Grade 5',
        section: 'A',
        subject: 'Social Studies',
        maxMarks: 100,
        passingMarks: 40,
        status: 'DRAFT',
        teacherUserId: new mongoose.Types.ObjectId(),
        teacherId: new mongoose.Types.ObjectId(),
        teacherName: 'Prof. History',
        totalStudents: 1,
        enteredCount: 1,
        students: [
          {
            studentId: new mongoose.Types.ObjectId(child1Id),
            studentName: 'Emily Jenkins',
            admissionNumber: 'STU-P-01',
            marksObtained: 75,
            isAbsent: false,
          },
        ],
      });

      // 4. Published Marks for Child 2 (Lucas Jenkins in Grade 8-B)
      await ExamMarksModel.create({
        examScheduleId: sEng._id,
        examId: exam1._id,
        academicYear: '2026-2027',
        classId: sEng.classId,
        className: 'Grade 8',
        section: 'B',
        subject: 'English',
        maxMarks: 100,
        passingMarks: 40,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-10-25T15:00:00Z'),
        publishedByName: 'Admin',
        teacherUserId: new mongoose.Types.ObjectId(),
        teacherId: new mongoose.Types.ObjectId(),
        teacherName: 'Prof. English',
        totalStudents: 1,
        enteredCount: 1,
        students: [
          {
            studentId: new mongoose.Types.ObjectId(child2Id),
            studentName: 'Lucas Jenkins',
            admissionNumber: 'STU-P-02',
            marksObtained: 84,
            isAbsent: false,
            remarks: 'Strong vocabulary and comprehension.',
          },
        ],
      });
    });

    afterAll(async () => {
      await ExamMarksModel.deleteMany({ examId: { $in: [testExamMidtermId, testExamAnnualId] } });
      await ExamScheduleModel.deleteMany({ examId: { $in: [testExamMidtermId, testExamAnnualId] } });
      await ExamModel.deleteMany({ _id: { $in: [testExamMidtermId, testExamAnnualId] } });
    });

    it('requires authentication: returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/parent/exams');
      expect(res.status).toBe(401);
    });

    it('requires PARENT role: returns 403 when accessed by TEACHER role', async () => {
      const res = await request(app)
        .get('/api/v1/parent/exams')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    it('returns published exam results for default child (Child 1 - Emily)', async () => {
      const res = await request(app)
        .get('/api/v1/parent/exams')
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.selectedChild.fullName).toBe('Emily Jenkins');
      expect(res.body.data.children).toHaveLength(2);

      // Verify that ONLY published exams are returned (Annual Exam draft is excluded)
      expect(res.body.data.exams).toHaveLength(1);
      const midterm = res.body.data.exams[0];
      expect(midterm.examName).toBe('Mid-Term Institutional Examination');
      expect(midterm.subjects).toHaveLength(2); // Math and Science

      // Verify Mathematics published result
      const mathSub = midterm.subjects.find((s: any) => s.subject === 'Mathematics');
      expect(mathSub).toBeDefined();
      expect(mathSub.marksObtained).toBe(92);
      expect(mathSub.maxMarks).toBe(100);
      expect(mathSub.percentage).toBe(92);
      expect(mathSub.grade).toBe('A+');
      expect(mathSub.isPassed).toBe(true);
      expect(mathSub.isAbsent).toBe(false);

      // Verify Science published result (Absent student handling)
      const sciSub = midterm.subjects.find((s: any) => s.subject === 'Science');
      expect(sciSub).toBeDefined();
      expect(sciSub.isAbsent).toBe(true);
      expect(sciSub.marksObtained).toBeNull();
      expect(sciSub.grade).toBe('AB');
      expect(sciSub.isPassed).toBe(false);

      // Verify totals: obtained is 92, max is 200, overall percentage is 46%
      expect(midterm.totalObtainedMarks).toBe(92);
      expect(midterm.totalMaxMarks).toBe(200);
      expect(midterm.overallPercentage).toBe(46);
      expect(midterm.overallGrade).toBe('D');
      expect(midterm.isPassed).toBe(false); // Because Science was absent/not passed
      expect(midterm.publishedAt).toBeDefined();
    });

    it('returns results for explicitly selected Child 2 (Lucas) when studentId query is passed', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/exams?studentId=${child2Id}`)
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.selectedChild.fullName).toBe('Lucas Jenkins');
      expect(res.body.data.exams).toHaveLength(1);
      const exam = res.body.data.exams[0];
      expect(exam.subjects).toHaveLength(1);
      expect(exam.subjects[0].subject).toBe('English');
      expect(exam.subjects[0].marksObtained).toBe(84);
      expect(exam.subjects[0].grade).toBe('A');
      expect(exam.subjects[0].isPassed).toBe(true);
      expect(exam.overallPercentage).toBe(84);
      expect(exam.overallGrade).toBe('A');
      expect(exam.isPassed).toBe(true);
    });

    it('rejects unauthorized access with 403 Forbidden when requesting another parent child', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/exams?studentId=${strangerChildId}`)
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('filters results by academicYear properly', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/exams?studentId=${child1Id}&academicYear=2025-2026`)
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.exams).toHaveLength(0);
      expect(res.body.data.summary.totalExams).toBe(0);
    });

    it('filters results by search keyword properly', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/exams?studentId=${child1Id}&search=Mathematics`)
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.exams).toHaveLength(1);
      expect(res.body.data.exams[0].examName).toContain('Mid-Term');
    });
  });
});
