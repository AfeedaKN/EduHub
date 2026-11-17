import mongoose from 'mongoose';
import { AssignmentModel, IAssignmentDoc } from '../../teacher/models/Assignment.model';
import { SubmissionModel, ISubmissionDoc } from '../../teacher/models/Submission.model';
import { StudentModel } from '../../parent/models/Student.model';
import { TeacherModel } from '../models/Teacher.model';
import { ClassModel } from '../models/Class.model';
import { SectionModel } from '../models/Section.model';
import { SubjectModel } from '../models/Subject.model';
import {
  AdminAssignmentFilterDTO,
  AdminAssignmentSummaryStatsDTO,
  AdminAssignmentListItemDTO,
  AdminAssignmentFilterMetadataDTO,
  AdminAssignmentDetailsDTO,
  AdminStudentSubmissionItemDTO,
  AdminTeacherMonitoringItemDTO,
} from '../dtos/adminAssignment.dto';

export interface IAdminAssignmentRepository {
  getSummaryStats(academicYear?: string): Promise<AdminAssignmentSummaryStatsDTO>;
  getFilterMetadata(): Promise<AdminAssignmentFilterMetadataDTO>;
  findAssignments(filter: AdminAssignmentFilterDTO): Promise<{
    assignments: AdminAssignmentListItemDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findAssignmentDetails(id: string): Promise<AdminAssignmentDetailsDTO | null>;
  getTeacherMonitoring(academicYear?: string, search?: string): Promise<AdminTeacherMonitoringItemDTO[]>;
}

export class AdminAssignmentRepository implements IAdminAssignmentRepository {
  /**
   * Helper to normalize class/grade and section key for O(1) student count matching
   */
  private normalizeKey(className: string, section: string): string {
    const cleanClass = (className || '').replace(/^(class|grade)\s*/i, '').trim().toLowerCase();
    const cleanSection = (section || '').trim().toLowerCase();
    return `${cleanClass}_${cleanSection}`;
  }

  /**
   * Helper to get student counts grouped by class and section
   */
  private async getStudentCountsByClassSection(): Promise<Map<string, number>> {
    const counts = await StudentModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: {
            grade: '$grade',
            section: '$section',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>();
    for (const item of counts) {
      if (item._id?.grade && item._id?.section) {
        const key = this.normalizeKey(item._id.grade, item._id.section);
        const current = countMap.get(key) || 0;
        countMap.set(key, current + (item.count || 0));
      }
    }
    return countMap;
  }

  /**
   * Dashboard Summary Statistics
   */
  async getSummaryStats(academicYear?: string): Promise<AdminAssignmentSummaryStatsDTO> {
    const matchQuery: Record<string, any> = {};
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      matchQuery.academicYear = academicYear.trim();
    }

    // 1. Assignment counts
    const [totalAssignments, publishedAssignmentsDocs] = await Promise.all([
      AssignmentModel.countDocuments(matchQuery),
      AssignmentModel.find({ ...matchQuery, status: 'PUBLISHED' }).select('_id className section').lean().exec(),
    ]);

    const publishedAssignments = publishedAssignmentsDocs.length;
    const publishedAssignmentIds = publishedAssignmentsDocs.map((doc) => doc._id);

    // 2. Submissions counts
    let totalSubmissions = 0;
    let evaluatedSubmissions = 0;
    let resultsPublished = 0;
    let pendingEvaluations = 0;
    let pendingSubmissions = 0;

    if (publishedAssignmentIds.length > 0) {
      const submissionStats = await SubmissionModel.aggregate([
        { $match: { assignmentId: { $in: publishedAssignmentIds } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            evaluated: {
              $sum: {
                $cond: [{ $eq: ['$gradingStatus', 'GRADED'] }, 1, 0],
              },
            },
            publishedResults: {
              $sum: {
                $cond: [{ $eq: ['$isPublished', true] }, 1, 0],
              },
            },
          },
        },
      ]);

      if (submissionStats.length > 0) {
        totalSubmissions = submissionStats[0].total || 0;
        evaluatedSubmissions = submissionStats[0].evaluated || 0;
        resultsPublished = submissionStats[0].publishedResults || 0;
        pendingEvaluations = Math.max(0, totalSubmissions - evaluatedSubmissions);
      }

      // 3. Calculate pending submissions across published assignments
      const studentCountMap = await this.getStudentCountsByClassSection();

      // Aggregate submission count per assignment
      const submissionPerAssignment = await SubmissionModel.aggregate([
        { $match: { assignmentId: { $in: publishedAssignmentIds } } },
        {
          $group: {
            _id: '$assignmentId',
            count: { $sum: 1 },
          },
        },
      ]);

      const subCountMap = new Map<string, number>();
      for (const item of submissionPerAssignment) {
        subCountMap.set(item._id.toString(), item.count);
      }

      for (const assign of publishedAssignmentsDocs) {
        const key = this.normalizeKey(assign.className, assign.section);
        const enrolled = studentCountMap.get(key) || 0;
        const submitted = subCountMap.get(assign._id.toString()) || 0;
        const pending = Math.max(0, enrolled - submitted);
        pendingSubmissions += pending;
      }
    }

    return {
      totalAssignments,
      publishedAssignments,
      totalSubmissions,
      pendingSubmissions,
      evaluatedSubmissions,
      resultsPublished,
      pendingEvaluations,
    };
  }

  /**
   * Filter Metadata for Dropdowns
   */
  async getFilterMetadata(): Promise<AdminAssignmentFilterMetadataDTO> {
    const [yearsFromAssignments, classDocs, sectionDocs, subjectDocs, teacherDocs] = await Promise.all([
      AssignmentModel.distinct('academicYear').exec(),
      ClassModel.find({ status: 'ACTIVE' }).select('_id name').lean().exec(),
      SectionModel.find({ status: 'ACTIVE' }).select('classId name').lean().exec(),
      SubjectModel.find({ status: 'ACTIVE' }).select('name code').lean().exec(),
      TeacherModel.find({ status: 'ACTIVE' }).select('_id userId fullName employeeId').sort({ fullName: 1 }).lean().exec(),
    ]);

    const academicYearsSet = new Set<string>(['2026-2027']);
    for (const yr of yearsFromAssignments) {
      if (yr && typeof yr === 'string') academicYearsSet.add(yr.trim());
    }

    // Map sections to classes
    const sectionsByClassId = new Map<string, string[]>();
    for (const sec of sectionDocs) {
      const cid = sec.classId.toString();
      const existing = sectionsByClassId.get(cid) || [];
      if (!existing.includes(sec.name)) {
        existing.push(sec.name);
      }
      sectionsByClassId.set(cid, existing);
    }

    const classes = classDocs.map((c) => ({
      className: c.name,
      sections: (sectionsByClassId.get(c._id.toString()) || ['A', 'B']).sort(),
    }));

    const subjects = Array.from(new Set(subjectDocs.map((s) => s.name))).sort();

    const teachers = teacherDocs.map((t) => ({
      id: t._id.toString(),
      userId: t.userId ? t.userId.toString() : undefined,
      name: t.fullName,
      employeeId: t.employeeId,
    }));

    return {
      academicYears: Array.from(academicYearsSet).sort().reverse(),
      classes,
      subjects,
      teachers,
    };
  }

  /**
   * List Assignments with Filters, Submission Metrics, and Pagination
   */
  async findAssignments(filter: AdminAssignmentFilterDTO): Promise<{
    assignments: AdminAssignmentListItemDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const matchStage: Record<string, any> = {};

    if (filter.academicYear && filter.academicYear.trim() && filter.academicYear !== 'ALL') {
      matchStage.academicYear = filter.academicYear.trim();
    }

    if (filter.teacherId && filter.teacherId.trim() && filter.teacherId !== 'ALL') {
      const tid = filter.teacherId.trim();
      if (mongoose.Types.ObjectId.isValid(tid)) {
        matchStage.$or = [
          { teacherId: new mongoose.Types.ObjectId(tid) },
          { teacherUserId: new mongoose.Types.ObjectId(tid) },
        ];
      }
    }

    if (filter.className && filter.className.trim() && filter.className !== 'ALL') {
      matchStage.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }

    if (filter.section && filter.section.trim() && filter.section !== 'ALL') {
      matchStage.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }

    if (filter.subject && filter.subject.trim() && filter.subject !== 'ALL') {
      matchStage.subject = { $regex: new RegExp(`^${filter.subject.trim()}$`, 'i') };
    }

    if (filter.status && filter.status.trim() && filter.status !== 'ALL') {
      matchStage.status = filter.status.trim().toUpperCase();
    }

    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      const searchOr = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { teacherName: { $regex: term, $options: 'i' } },
        { subject: { $regex: term, $options: 'i' } },
      ];
      if (matchStage.$or) {
        matchStage.$and = [{ $or: matchStage.$or }, { $or: searchOr }];
        delete matchStage.$or;
      } else {
        matchStage.$or = searchOr;
      }
    }

    // Build Aggregation Pipeline
    const pipeline: any[] = [{ $match: matchStage }];

    // Lookup submissions to compute submission stats per assignment
    pipeline.push(
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'assignmentId',
          as: 'submissionDocs',
        },
      },
      {
        $addFields: {
          submittedCount: { $size: '$submissionDocs' },
          evaluatedCount: {
            $size: {
              $filter: {
                input: '$submissionDocs',
                as: 'sub',
                cond: { $eq: ['$$sub.gradingStatus', 'GRADED'] },
              },
            },
          },
          resultsPublishedCount: {
            $size: {
              $filter: {
                input: '$submissionDocs',
                as: 'sub',
                cond: { $eq: ['$$sub.isPublished', true] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          resultPublicationStatus: {
            $cond: [
              { $eq: ['$evaluatedCount', 0] },
              'UNPUBLISHED',
              {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$resultsPublishedCount', 0] },
                      { $eq: ['$resultsPublishedCount', '$evaluatedCount'] },
                    ],
                  },
                  'PUBLISHED',
                  {
                    $cond: [
                      { $gt: ['$resultsPublishedCount', 0] },
                      'PARTIALLY_PUBLISHED',
                      'UNPUBLISHED',
                    ],
                  },
                ],
              },
            ],
          },
        },
      }
    );

    // Apply filters based on calculated submission / result status
    if (filter.resultPublicationStatus && filter.resultPublicationStatus !== 'ALL') {
      const statusFilter = filter.resultPublicationStatus.toUpperCase();
      pipeline.push({
        $match: { resultPublicationStatus: statusFilter },
      });
    }

    if (filter.submissionStatus && filter.submissionStatus !== 'ALL') {
      const subStatus = filter.submissionStatus.toUpperCase();
      if (subStatus === 'NO_SUBMISSIONS' || subStatus === 'PENDING') {
        pipeline.push({ $match: { submittedCount: 0 } });
      } else if (subStatus === 'IN_PROGRESS') {
        pipeline.push({ $match: { submittedCount: { $gt: 0 } } });
      }
    }

    // Sorting
    const sortField = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortField]: sortOrder, _id: -1 },
    });

    // Count Facet & Pagination
    pipeline.push({
      $facet: {
        totalData: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [facetResult] = await AssignmentModel.aggregate(pipeline);
    const total = facetResult?.totalCount?.[0]?.count || 0;
    const rawAssignments = facetResult?.totalData || [];

    // Lookup student counts map
    const studentCountMap = await this.getStudentCountsByClassSection();

    const assignments: AdminAssignmentListItemDTO[] = rawAssignments.map((a: any) => {
      const key = this.normalizeKey(a.className, a.section);
      const totalStudents = studentCountMap.get(key) || 0;
      const submittedCount = a.submittedCount || 0;
      const pendingCount = Math.max(0, totalStudents - submittedCount);
      const evaluatedCount = a.evaluatedCount || 0;
      const resultsPublishedCount = a.resultsPublishedCount || 0;

      return {
        id: a._id.toString(),
        title: a.title,
        description: a.description,
        teacherName: a.teacherName,
        teacherId: a.teacherId ? a.teacherId.toString() : '',
        teacherUserId: a.teacherUserId ? a.teacherUserId.toString() : '',
        className: a.className,
        section: a.section,
        subject: a.subject,
        academicYear: a.academicYear,
        assignedDate: a.assignedDate,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        status: a.status,
        attachmentUrl: a.attachmentUrl || '',
        attachmentName: a.attachmentName || '',
        totalStudents,
        submittedCount,
        pendingCount,
        evaluatedCount,
        resultsPublishedCount,
        resultPublicationStatus: a.resultPublicationStatus,
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      assignments,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Single Assignment Details with Student Submissions Roster
   */
  async findAssignmentDetails(id: string): Promise<AdminAssignmentDetailsDTO | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const assignment = await AssignmentModel.findById(id).lean().exec();
    if (!assignment) return null;

    // Fetch enrolled students for this class and section
    const cleanGrade = (assignment.className || '').replace(/^(class|grade)\s*/i, '').trim();
    const gradePattern = `^(class|grade)?\\s*${cleanGrade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;

    const enrolledStudents = await StudentModel.find({
      grade: { $regex: new RegExp(gradePattern, 'i') },
      section: { $regex: new RegExp(`^${(assignment.section || '').trim()}$`, 'i') },
      status: 'ACTIVE',
    })
      .sort({ rollNumber: 1, studentId: 1, fullName: 1 })
      .lean()
      .exec();

    // Fetch all submissions for this assignment
    const submissions = await SubmissionModel.find({
      assignmentId: assignment._id,
    })
      .populate('studentId', 'fullName studentId rollNumber avatarUrl grade section')
      .lean()
      .exec();

    // Map submissions by studentId string
    const submissionByStudentId = new Map<string, any>();
    for (const sub of submissions) {
      if (sub.studentId) {
        const studentDoc = sub.studentId as any;
        const sid = studentDoc._id ? studentDoc._id.toString() : sub.studentId.toString();
        submissionByStudentId.set(sid, sub);
        if (studentDoc.studentId) {
          submissionByStudentId.set(studentDoc.studentId, sub);
        }
      }
    }

    const processedStudentIds = new Set<string>();
    const studentRows: AdminStudentSubmissionItemDTO[] = [];

    // Map officially enrolled students
    for (const student of enrolledStudents) {
      const sid = student._id.toString();
      processedStudentIds.add(sid);
      if (student.studentId) {
        processedStudentIds.add(student.studentId);
      }
      const sub =
        submissionByStudentId.get(sid) ||
        (student.studentId ? submissionByStudentId.get(student.studentId) : undefined);

      if (sub && sub._id) {
        const isGraded = sub.gradingStatus === 'GRADED';
        const isPublished = isGraded && Boolean(sub.isPublished);

        studentRows.push({
          studentId: sid,
          studentName: student.fullName,
          admissionId: student.studentId,
          rollNumber: student.rollNumber || '',
          avatarUrl: student.avatarUrl || '',
          submissionId: sub._id.toString(),
          submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : undefined,
          submissionStatus: 'SUBMITTED',
          evaluationStatus: isGraded ? 'GRADED' : sub.gradingStatus === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : 'PENDING',
          marksObtained: isGraded && sub.marksObtained !== undefined && sub.marksObtained !== null ? sub.marksObtained : null,
          maxMarks: sub.maxMarks || assignment.maxMarks,
          resultPublicationStatus: isPublished ? 'PUBLISHED' : isGraded ? 'UNPUBLISHED' : 'NOT_SUBMITTED',
          answerText: sub.answerText || '',
          attachmentUrl: sub.attachmentUrl || '',
          attachmentName: sub.attachmentName || '',
          attachmentSize: sub.attachmentSize || 0,
          attachmentType: sub.attachmentType || '',
          feedback: sub.feedback || '',
          gradedAt: sub.gradedAt ? new Date(sub.gradedAt).toISOString() : undefined,
          gradedBy: sub.gradedBy ? sub.gradedBy.toString() : undefined,
          isLate: !!sub.isLate,
          version: sub.version || 1,
          gradingHistory: (sub.gradingHistory || []).map((h: any) => ({
            marksObtained: h.marksObtained,
            maxMarks: h.maxMarks,
            feedback: h.feedback || '',
            gradedAt: h.gradedAt ? new Date(h.gradedAt).toISOString() : '',
            isPublished: !!h.isPublished,
            action: h.action,
          })),
        });
      } else {
        studentRows.push({
          studentId: sid,
          studentName: student.fullName,
          admissionId: student.studentId,
          rollNumber: student.rollNumber || '',
          avatarUrl: student.avatarUrl || '',
          submissionStatus: 'NOT_SUBMITTED',
          evaluationStatus: 'NOT_SUBMITTED',
          marksObtained: null,
          maxMarks: assignment.maxMarks,
          resultPublicationStatus: 'NOT_SUBMITTED',
        });
      }
    }

    // Also include any submissions whose student record was not in the active enrolled list
    for (const sub of submissions) {
      const studentObj = sub.studentId as any;
      const sid = studentObj?._id ? studentObj._id.toString() : sub.studentId?.toString();
      const admId = studentObj?.studentId;
      const alreadyProcessed =
        (sid && processedStudentIds.has(sid)) || (admId && processedStudentIds.has(admId));

      if (!alreadyProcessed) {
        if (sid) processedStudentIds.add(sid);
        if (admId) processedStudentIds.add(admId);
        const isGraded = sub.gradingStatus === 'GRADED';
        const isPublished = isGraded && Boolean(sub.isPublished);

        studentRows.push({
          studentId: sid || sub._id.toString(),
          studentName: studentObj?.fullName || 'Enrolled Student',
          admissionId: studentObj?.studentId || 'N/A',
          rollNumber: studentObj?.rollNumber || '',
          avatarUrl: studentObj?.avatarUrl || '',
          submissionId: sub._id.toString(),
          submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : undefined,
          submissionStatus: 'SUBMITTED',
          evaluationStatus: isGraded ? 'GRADED' : sub.gradingStatus === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : 'PENDING',
          marksObtained: isGraded && sub.marksObtained !== undefined && sub.marksObtained !== null ? sub.marksObtained : null,
          maxMarks: sub.maxMarks || assignment.maxMarks,
          resultPublicationStatus: isPublished ? 'PUBLISHED' : isGraded ? 'UNPUBLISHED' : 'NOT_SUBMITTED',
          answerText: sub.answerText || '',
          attachmentUrl: sub.attachmentUrl || '',
          attachmentName: sub.attachmentName || '',
          attachmentSize: sub.attachmentSize || 0,
          attachmentType: sub.attachmentType || '',
          feedback: sub.feedback || '',
          gradedAt: sub.gradedAt ? new Date(sub.gradedAt).toISOString() : undefined,
          gradedBy: sub.gradedBy ? sub.gradedBy.toString() : undefined,
          isLate: !!sub.isLate,
          version: sub.version || 1,
          gradingHistory: (sub.gradingHistory || []).map((h: any) => ({
            marksObtained: h.marksObtained,
            maxMarks: h.maxMarks,
            feedback: h.feedback || '',
            gradedAt: h.gradedAt ? new Date(h.gradedAt).toISOString() : '',
            isPublished: !!h.isPublished,
            action: h.action,
          })),
        });
      }
    }

    // Compute overview statistics
    const totalEnrolled = Math.max(enrolledStudents.length, studentRows.length);
    const submitted = studentRows.filter((s) => s.submissionStatus === 'SUBMITTED').length;
    const pending = Math.max(0, totalEnrolled - submitted);
    const evaluated = studentRows.filter((s) => s.evaluationStatus === 'GRADED').length;
    const resultsPublished = studentRows.filter((s) => s.resultPublicationStatus === 'PUBLISHED').length;
    const submissionRatePercentage = totalEnrolled > 0 ? Math.round((submitted / totalEnrolled) * 100) : 0;
    const evaluationRatePercentage = submitted > 0 ? Math.round((evaluated / submitted) * 100) : 0;

    let resultPublicationStatus: 'PUBLISHED' | 'PARTIALLY_PUBLISHED' | 'UNPUBLISHED' = 'UNPUBLISHED';
    if (evaluated > 0 && resultsPublished === evaluated) {
      resultPublicationStatus = 'PUBLISHED';
    } else if (resultsPublished > 0) {
      resultPublicationStatus = 'PARTIALLY_PUBLISHED';
    }

    const assignmentItem: AdminAssignmentListItemDTO = {
      id: assignment._id.toString(),
      title: assignment.title,
      description: assignment.description,
      teacherName: assignment.teacherName,
      teacherId: assignment.teacherId ? assignment.teacherId.toString() : '',
      teacherUserId: assignment.teacherUserId ? assignment.teacherUserId.toString() : '',
      className: assignment.className,
      section: assignment.section,
      subject: assignment.subject,
      academicYear: assignment.academicYear,
      assignedDate: assignment.assignedDate,
      dueDate: assignment.dueDate,
      maxMarks: assignment.maxMarks,
      status: assignment.status,
      attachmentUrl: assignment.attachmentUrl || '',
      attachmentName: assignment.attachmentName || '',
      totalStudents: totalEnrolled,
      submittedCount: submitted,
      pendingCount: pending,
      evaluatedCount: evaluated,
      resultsPublishedCount: resultsPublished,
      resultPublicationStatus,
      createdAt: assignment.createdAt ? new Date(assignment.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt).toISOString() : new Date().toISOString(),
    };

    return {
      assignment: assignmentItem,
      overview: {
        totalEnrolled,
        submitted,
        pending,
        evaluated,
        resultsPublished,
        submissionRatePercentage,
        evaluationRatePercentage,
      },
      students: studentRows,
    };
  }

  /**
   * Teacher-wise Assignment Monitoring
   */
  async getTeacherMonitoring(
    academicYear?: string,
    search?: string
  ): Promise<AdminTeacherMonitoringItemDTO[]> {
    const teacherQuery: Record<string, any> = {};
    if (search && search.trim()) {
      const term = search.trim();
      teacherQuery.$or = [
        { fullName: { $regex: term, $options: 'i' } },
        { employeeId: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { department: { $regex: term, $options: 'i' } },
      ];
    }

    const teachers = await TeacherModel.find(teacherQuery).sort({ fullName: 1 }).lean().exec();

    // Assignment filter by academic year
    const assignMatch: Record<string, any> = {};
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      assignMatch.academicYear = academicYear.trim();
    }

    // Aggregate assignments by teacherUserId and teacherId
    const assignmentStats = await AssignmentModel.aggregate([
      { $match: assignMatch },
      {
        $group: {
          _id: '$teacherUserId',
          teacherProfileId: { $first: '$teacherId' },
          totalAssignments: { $sum: 1 },
          publishedAssignments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0],
            },
          },
          assignmentIds: { $push: '$_id' },
        },
      },
    ]);

    const assignStatsMap = new Map<string, any>();
    const allAssignmentIds: mongoose.Types.ObjectId[] = [];
    for (const stat of assignmentStats) {
      if (stat._id) {
        assignStatsMap.set(stat._id.toString(), stat);
      }
      if (stat.teacherProfileId) {
        assignStatsMap.set(stat.teacherProfileId.toString(), stat);
      }
      if (Array.isArray(stat.assignmentIds)) {
        allAssignmentIds.push(...stat.assignmentIds);
      }
    }

    // Aggregate submissions by teacher
    const submissionStats = await SubmissionModel.aggregate([
      { $match: { assignmentId: { $in: allAssignmentIds } } },
      {
        $group: {
          _id: '$teacherUserId',
          totalSubmissions: { $sum: 1 },
          evaluatedSubmissions: {
            $sum: {
              $cond: [{ $eq: ['$gradingStatus', 'GRADED'] }, 1, 0],
            },
          },
          publishedResults: {
            $sum: {
              $cond: [{ $eq: ['$isPublished', true] }, 1, 0],
            },
          },
        },
      },
    ]);

    const subStatsMap = new Map<string, any>();
    for (const sub of submissionStats) {
      if (sub._id) {
        subStatsMap.set(sub._id.toString(), sub);
      }
    }

    return teachers.map((t) => {
      const userIdStr = t.userId ? t.userId.toString() : '';
      const teacherIdStr = t._id.toString();

      const aStat = assignStatsMap.get(userIdStr) || assignStatsMap.get(teacherIdStr) || {};
      const sStat = subStatsMap.get(userIdStr) || subStatsMap.get(teacherIdStr) || {};

      const assignmentsCreated = aStat.totalAssignments || 0;
      const publishedAssignments = aStat.publishedAssignments || 0;
      const totalSubmissionsReceived = sStat.totalSubmissions || 0;
      const evaluated = sStat.evaluatedSubmissions || 0;
      const pendingEvaluations = Math.max(0, totalSubmissionsReceived - evaluated);
      const publishedResults = sStat.publishedResults || 0;

      const classesTaught = Array.from(
        new Set((t.assignedClasses || []).map((ac: any) => `${ac.className} - ${ac.section}`))
      );
      const subjectsTaught = Array.from(
        new Set((t.assignedClasses || []).map((ac: any) => ac.subject).filter(Boolean))
      );

      return {
        teacherId: teacherIdStr,
        teacherUserId: userIdStr,
        teacherName: t.fullName,
        employeeId: t.employeeId,
        email: t.email,
        department: t.department || '',
        assignmentsCreated,
        publishedAssignments,
        totalSubmissionsReceived,
        pendingEvaluations,
        publishedResults,
        classesTaught,
        subjectsTaught,
      };
    });
  }
}
