import mongoose from 'mongoose';
import { SubmissionModel, ISubmissionDoc } from '../models/Submission.model';

export interface ISubmissionRepository {
  findByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): Promise<ISubmissionDoc | null>;
  findByStudentAndAssignmentIds(
    studentId: string,
    assignmentIds: string[]
  ): Promise<ISubmissionDoc[]>;
  findByStudentIdsAndAssignmentIds?(
    studentIds: string[],
    assignmentIds: string[]
  ): Promise<ISubmissionDoc[]>;
  findByAssignmentId(assignmentId: string): Promise<ISubmissionDoc[]>;
  findByAssignmentAndId(assignmentId: string, submissionId: string): Promise<ISubmissionDoc | null>;
  findById(id: string): Promise<ISubmissionDoc | null>;
  create(data: Partial<ISubmissionDoc>): Promise<ISubmissionDoc>;
  update(id: string, data: Partial<ISubmissionDoc>): Promise<ISubmissionDoc | null>;
  countByAssignmentId(assignmentId: string): Promise<{ total: number; graded: number; pending: number }>;
  getSubmissionStatsByAssignmentIds(
    assignmentIds: string[]
  ): Promise<Record<string, { total: number; graded: number; pending: number }>>;
}

export class SubmissionRepository implements ISubmissionRepository {
  async findByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): Promise<ISubmissionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return null;
    }
    return await SubmissionModel.findOne({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      studentId: new mongoose.Types.ObjectId(studentId),
    }).exec();
  }

  async findByStudentAndAssignmentIds(
    studentId: string,
    assignmentIds: string[]
  ): Promise<ISubmissionDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(studentId) || !assignmentIds || assignmentIds.length === 0) {
      return [];
    }

    const validIds = assignmentIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) return [];

    return await SubmissionModel.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      assignmentId: { $in: validIds },
    }).exec();
  }

  async findByStudentIdsAndAssignmentIds(
    studentIds: string[],
    assignmentIds: string[]
  ): Promise<ISubmissionDoc[]> {
    if (!studentIds || studentIds.length === 0 || !assignmentIds || assignmentIds.length === 0) {
      return [];
    }

    const validStudentIds = studentIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const validAssignmentIds = assignmentIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validStudentIds.length === 0 || validAssignmentIds.length === 0) return [];

    return await SubmissionModel.find({
      studentId: { $in: validStudentIds },
      assignmentId: { $in: validAssignmentIds },
    }).exec();
  }

  async findByAssignmentId(assignmentId: string): Promise<ISubmissionDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) return [];
    return await SubmissionModel.find({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    })
      .populate('studentId', 'fullName studentId rollNumber avatarUrl')
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<ISubmissionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SubmissionModel.findById(id).exec();
  }

  async create(data: Partial<ISubmissionDoc>): Promise<ISubmissionDoc> {
    const submission = new SubmissionModel(data);
    return await submission.save();
  }

  async update(id: string, data: Partial<ISubmissionDoc>): Promise<ISubmissionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SubmissionModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async findByAssignmentAndId(assignmentId: string, submissionId: string): Promise<ISubmissionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId) || !mongoose.Types.ObjectId.isValid(submissionId)) {
      return null;
    }
    return await SubmissionModel.findOne({
      _id: new mongoose.Types.ObjectId(submissionId),
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    })
      .populate('studentId', 'fullName studentId rollNumber avatarUrl')
      .exec();
  }

  async countByAssignmentId(assignmentId: string): Promise<{ total: number; graded: number; pending: number }> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return { total: 0, graded: 0, pending: 0 };
    }
    const [total, graded] = await Promise.all([
      SubmissionModel.countDocuments({ assignmentId: new mongoose.Types.ObjectId(assignmentId) }),
      SubmissionModel.countDocuments({
        assignmentId: new mongoose.Types.ObjectId(assignmentId),
        gradingStatus: 'GRADED',
      }),
    ]);
    return {
      total,
      graded,
      pending: total - graded,
    };
  }

  async getSubmissionStatsByAssignmentIds(
    assignmentIds: string[]
  ): Promise<Record<string, { total: number; graded: number; pending: number }>> {
    if (!assignmentIds || assignmentIds.length === 0) return {};
    const validIds = assignmentIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) return {};

    const results = await SubmissionModel.aggregate([
      { $match: { assignmentId: { $in: validIds } } },
      {
        $group: {
          _id: '$assignmentId',
          total: { $sum: 1 },
          graded: {
            $sum: {
              $cond: [{ $eq: ['$gradingStatus', 'GRADED'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const statsMap: Record<string, { total: number; graded: number; pending: number }> = {};
    for (const r of results) {
      const aid = r._id.toString();
      const total = r.total || 0;
      const graded = r.graded || 0;
      statsMap[aid] = {
        total,
        graded,
        pending: Math.max(0, total - graded),
      };
    }

    return statsMap;
  }
}
