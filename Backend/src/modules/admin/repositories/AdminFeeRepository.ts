import mongoose from 'mongoose';
import { FeeCategoryModel, IFeeCategoryDoc } from '../models/FeeCategory.model';
import { FeeConcessionModel, IFeeConcessionDoc } from '../models/FeeConcession.model';
import { FeeStructureModel, IFeeStructureDoc } from '../models/FeeStructure.model';
import {
  StudentFeeAssignmentModel,
  IStudentFeeAssignmentDoc,
} from '../models/StudentFeeAssignment.model';
import { FeeInvoiceModel, IFeeInvoiceDoc } from '../models/FeeInvoice.model';
import { FeePaymentModel, IFeePaymentDoc } from '../models/FeePayment.model';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';

export interface IAdminFeeRepository {
  // Categories
  createCategory(data: Partial<IFeeCategoryDoc>): Promise<IFeeCategoryDoc>;
  updateCategory(id: string, data: Partial<IFeeCategoryDoc>): Promise<IFeeCategoryDoc | null>;
  findCategories(status?: string): Promise<IFeeCategoryDoc[]>;
  findCategoryById(id: string): Promise<IFeeCategoryDoc | null>;
  findCategoryByName(name: string): Promise<IFeeCategoryDoc | null>;
  findCategoryByCode(code: string): Promise<IFeeCategoryDoc | null>;

  // Concessions
  createConcession(data: Partial<IFeeConcessionDoc>): Promise<IFeeConcessionDoc>;
  updateConcession(id: string, data: Partial<IFeeConcessionDoc>): Promise<IFeeConcessionDoc | null>;
  findConcessions(status?: string): Promise<IFeeConcessionDoc[]>;
  findConcessionById(id: string): Promise<IFeeConcessionDoc | null>;

  // Structures
  createStructure(data: Partial<IFeeStructureDoc>): Promise<IFeeStructureDoc>;
  updateStructure(id: string, data: Partial<IFeeStructureDoc>): Promise<IFeeStructureDoc | null>;
  findStructures(filter?: {
    academicYear?: string;
    className?: string;
    status?: string;
  }): Promise<IFeeStructureDoc[]>;
  findStructureById(id: string): Promise<IFeeStructureDoc | null>;
  findStructureByNameAndYear(name: string, academicYear: string): Promise<IFeeStructureDoc | null>;
  findStructuresByCategoryId(categoryId: string): Promise<IFeeStructureDoc[]>;
  countInvoicesByStructureId(structureId: string): Promise<number>;
  countAssignmentsByStructureId(structureId: string): Promise<number>;

  // Student Enrollment & Assignments
  findActiveEnrolledStudents(
    className?: string,
    section?: string,
    academicYear?: string
  ): Promise<IStudentDoc[]>;
  createFeeAssignment(data: Partial<IStudentFeeAssignmentDoc>): Promise<IStudentFeeAssignmentDoc>;
  findFeeAssignments(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    studentId?: string;
  }): Promise<IStudentFeeAssignmentDoc[]>;
  findFeeAssignmentById(id: string): Promise<IStudentFeeAssignmentDoc | null>;
  findAssignmentByStudentAndYear(
    studentId: string,
    academicYear: string
  ): Promise<IStudentFeeAssignmentDoc | null>;
  updateFeeAssignment(
    id: string,
    data: Partial<IStudentFeeAssignmentDoc>
  ): Promise<IStudentFeeAssignmentDoc | null>;

  // Invoices
  createInvoice(data: Partial<IFeeInvoiceDoc>): Promise<IFeeInvoiceDoc>;
  findInvoices(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    status?: string;
    studentId?: string;
    search?: string;
  }): Promise<IFeeInvoiceDoc[]>;
  findInvoiceById(id: string): Promise<IFeeInvoiceDoc | null>;
  findInvoiceByNumber(invoiceNumber: string): Promise<IFeeInvoiceDoc | null>;
  findInvoiceByAssignmentAndInstallment(
    assignmentId: string,
    installmentNumber: number
  ): Promise<IFeeInvoiceDoc | null>;
  updateInvoice(id: string, data: Partial<IFeeInvoiceDoc>): Promise<IFeeInvoiceDoc | null>;
  getNextInvoiceNumber(academicYear: string): Promise<string>;

  // Payments
  createPayment(data: Partial<IFeePaymentDoc>): Promise<IFeePaymentDoc>;
  findPayments(filter?: {
    academicYear?: string;
    className?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<IFeePaymentDoc[]>;
  findPaymentById(id: string): Promise<IFeePaymentDoc | null>;
  findPaymentsByInvoiceId(invoiceId: string): Promise<IFeePaymentDoc[]>;
  updatePayment(id: string, data: Partial<IFeePaymentDoc>): Promise<IFeePaymentDoc | null>;
  getNextReceiptNumber(academicYear: string): Promise<string>;

  // Defaulters
  findDefaulterInvoices(filter?: {
    academicYear?: string;
    className?: string;
  }): Promise<IFeeInvoiceDoc[]>;

  // Dashboard Summary & Analytics
  getDashboardMetrics(academicYear?: string): Promise<any>;
}

export class AdminFeeRepository implements IAdminFeeRepository {
  // Categories
  async createCategory(data: Partial<IFeeCategoryDoc>): Promise<IFeeCategoryDoc> {
    return await FeeCategoryModel.create(data);
  }

  async updateCategory(
    id: string,
    data: Partial<IFeeCategoryDoc>
  ): Promise<IFeeCategoryDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeCategoryModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async findCategories(status?: string): Promise<IFeeCategoryDoc[]> {
    const query: Record<string, any> = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    return await FeeCategoryModel.find(query).sort({ name: 1 }).exec();
  }

  async findCategoryById(id: string): Promise<IFeeCategoryDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeCategoryModel.findById(id).exec();
  }

  async findCategoryByName(name: string): Promise<IFeeCategoryDoc | null> {
    return await FeeCategoryModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    }).exec();
  }

  async findCategoryByCode(code: string): Promise<IFeeCategoryDoc | null> {
    return await FeeCategoryModel.findOne({
      code: { $regex: new RegExp(`^${code.trim()}$`, 'i') },
    }).exec();
  }

  // Concessions
  async createConcession(data: Partial<IFeeConcessionDoc>): Promise<IFeeConcessionDoc> {
    return await FeeConcessionModel.create(data);
  }

  async updateConcession(
    id: string,
    data: Partial<IFeeConcessionDoc>
  ): Promise<IFeeConcessionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeConcessionModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async findConcessions(status?: string): Promise<IFeeConcessionDoc[]> {
    const query: Record<string, any> = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    return await FeeConcessionModel.find(query).sort({ name: 1 }).exec();
  }

  async findConcessionById(id: string): Promise<IFeeConcessionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeConcessionModel.findById(id).exec();
  }

  // Structures
  async createStructure(data: Partial<IFeeStructureDoc>): Promise<IFeeStructureDoc> {
    return await FeeStructureModel.create(data);
  }

  async updateStructure(
    id: string,
    data: Partial<IFeeStructureDoc>
  ): Promise<IFeeStructureDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeStructureModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async findStructures(filter?: {
    academicYear?: string;
    className?: string;
    status?: string;
  }): Promise<IFeeStructureDoc[]> {
    const query: Record<string, any> = {};
    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear;
    }
    if (filter?.className && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter?.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    return await FeeStructureModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findStructureById(id: string): Promise<IFeeStructureDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeStructureModel.findById(id).exec();
  }

  async findStructureByNameAndYear(
    name: string,
    academicYear: string
  ): Promise<IFeeStructureDoc | null> {
    return await FeeStructureModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      academicYear: academicYear.trim(),
    }).exec();
  }

  async findStructuresByCategoryId(categoryId: string): Promise<IFeeStructureDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return [];
    return await FeeStructureModel.find({
      'categories.categoryId': new mongoose.Types.ObjectId(categoryId),
    }).exec();
  }

  async countInvoicesByStructureId(structureId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(structureId)) return 0;
    return await FeeInvoiceModel.countDocuments({
      feeStructureId: new mongoose.Types.ObjectId(structureId),
    }).exec();
  }

  async countAssignmentsByStructureId(structureId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(structureId)) return 0;
    return await StudentFeeAssignmentModel.countDocuments({
      feeStructureId: new mongoose.Types.ObjectId(structureId),
    }).exec();
  }

  // Student Enrollment & Assignments
  async findActiveEnrolledStudents(
    className?: string,
    section?: string,
    academicYear?: string
  ): Promise<IStudentDoc[]> {
    const query: Record<string, any> = { status: 'ACTIVE' };
    if (className && className !== 'ALL') {
      query.grade = { $regex: new RegExp(`^${className.trim()}$`, 'i') };
    }
    if (section && section !== 'ALL') {
      query.section = { $regex: new RegExp(`^${section.trim()}$`, 'i') };
    }
    if (academicYear && academicYear !== 'ALL') {
      query.academicYear = academicYear.trim();
    }
    return await StudentModel.find(query).populate('parentId').sort({ fullName: 1 }).exec();
  }

  async createFeeAssignment(
    data: Partial<IStudentFeeAssignmentDoc>
  ): Promise<IStudentFeeAssignmentDoc> {
    return await StudentFeeAssignmentModel.create(data);
  }

  async findFeeAssignments(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    studentId?: string;
  }): Promise<IStudentFeeAssignmentDoc[]> {
    const query: Record<string, any> = { status: 'ACTIVE' };
    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear;
    }
    if (filter?.className && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter?.section && filter.section !== 'ALL') {
      query.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }
    if (filter?.studentId && filter.studentId !== 'ALL') {
      query.studentId = new mongoose.Types.ObjectId(filter.studentId);
    }
    return await StudentFeeAssignmentModel.find(query).sort({ studentName: 1 }).exec();
  }

  async findFeeAssignmentById(id: string): Promise<IStudentFeeAssignmentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await StudentFeeAssignmentModel.findById(id).exec();
  }

  async findAssignmentByStudentAndYear(
    studentId: string,
    academicYear: string
  ): Promise<IStudentFeeAssignmentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(studentId)) return null;
    return await StudentFeeAssignmentModel.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      academicYear: academicYear.trim(),
      status: 'ACTIVE',
    }).exec();
  }

  async updateFeeAssignment(
    id: string,
    data: Partial<IStudentFeeAssignmentDoc>
  ): Promise<IStudentFeeAssignmentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await StudentFeeAssignmentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  // Invoices
  async createInvoice(data: Partial<IFeeInvoiceDoc>): Promise<IFeeInvoiceDoc> {
    return await FeeInvoiceModel.create(data);
  }

  async findInvoices(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    status?: string;
    studentId?: string;
    search?: string;
  }): Promise<IFeeInvoiceDoc[]> {
    const query: Record<string, any> = {};
    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear;
    }
    if (filter?.className && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter?.section && filter.section !== 'ALL') {
      query.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }
    if (filter?.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter?.studentId && filter.studentId !== 'ALL') {
      query.studentId = new mongoose.Types.ObjectId(filter.studentId);
    }
    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [
        { invoiceNumber: { $regex: searchRegex } },
        { studentName: { $regex: searchRegex } },
        { studentAdmissionNumber: { $regex: searchRegex } },
        { parentName: { $regex: searchRegex } },
      ];
    }
    return await FeeInvoiceModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findInvoiceById(id: string): Promise<IFeeInvoiceDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeInvoiceModel.findById(id).exec();
  }

  async findInvoiceByNumber(invoiceNumber: string): Promise<IFeeInvoiceDoc | null> {
    return await FeeInvoiceModel.findOne({
      invoiceNumber: invoiceNumber.trim().toUpperCase(),
    }).exec();
  }

  async findInvoiceByAssignmentAndInstallment(
    assignmentId: string,
    installmentNumber: number
  ): Promise<IFeeInvoiceDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) return null;
    return await FeeInvoiceModel.findOne({
      feeAssignmentId: new mongoose.Types.ObjectId(assignmentId),
      installmentNumber,
      status: { $ne: 'CANCELLED' },
    }).exec();
  }

  async updateInvoice(
    id: string,
    data: Partial<IFeeInvoiceDoc>
  ): Promise<IFeeInvoiceDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeInvoiceModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async getNextInvoiceNumber(academicYear: string): Promise<string> {
    const yearPrefix = academicYear.split('-')[0] || new Date().getFullYear().toString();
    const count = await FeeInvoiceModel.countDocuments({
      academicYear: academicYear.trim(),
    }).exec();
    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `INV-${yearPrefix}-${nextSeq}`;
  }

  // Payments
  async createPayment(data: Partial<IFeePaymentDoc>): Promise<IFeePaymentDoc> {
    return await FeePaymentModel.create(data);
  }

  async findPayments(filter?: {
    academicYear?: string;
    className?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<IFeePaymentDoc[]> {
    const query: Record<string, any> = {};
    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear;
    }
    if (filter?.className && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
      query.paymentMethod = filter.paymentMethod;
    }
    if (filter?.startDate || filter?.endDate) {
      query.paymentDate = {};
      if (filter.startDate) query.paymentDate.$gte = filter.startDate;
      if (filter.endDate) query.paymentDate.$lte = filter.endDate;
    }
    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [
        { receiptNumber: { $regex: searchRegex } },
        { invoiceNumber: { $regex: searchRegex } },
        { studentName: { $regex: searchRegex } },
        { studentAdmissionNumber: { $regex: searchRegex } },
        { transactionReference: { $regex: searchRegex } },
      ];
    }
    return await FeePaymentModel.find(query).sort({ paymentDate: -1, createdAt: -1 }).exec();
  }

  async findPaymentById(id: string): Promise<IFeePaymentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeePaymentModel.findById(id).exec();
  }

  async findPaymentsByInvoiceId(invoiceId: string): Promise<IFeePaymentDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) return [];
    return await FeePaymentModel.find({
      invoiceId: new mongoose.Types.ObjectId(invoiceId),
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updatePayment(
    id: string,
    data: Partial<IFeePaymentDoc>
  ): Promise<IFeePaymentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeePaymentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async getNextReceiptNumber(academicYear: string): Promise<string> {
    const yearPrefix = academicYear.split('-')[0] || new Date().getFullYear().toString();
    const count = await FeePaymentModel.countDocuments({
      academicYear: academicYear.trim(),
    }).exec();
    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `REC-${yearPrefix}-${nextSeq}`;
  }

  // Defaulters
  async findDefaulterInvoices(filter?: {
    academicYear?: string;
    className?: string;
  }): Promise<IFeeInvoiceDoc[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const query: Record<string, any> = {
      dueDate: { $lt: todayStr },
      outstandingAmount: { $gt: 0 },
      status: { $in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
    };
    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear;
    }
    if (filter?.className && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    return await FeeInvoiceModel.find(query).sort({ dueDate: 1 }).exec();
  }

  // Dashboard Metrics & Analytics
  async getDashboardMetrics(academicYear?: string): Promise<any> {
    const baseFilter: Record<string, any> = {};
    if (academicYear && academicYear !== 'ALL') {
      baseFilter.academicYear = academicYear.trim();
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [
      invoices,
      successfulPayments,
    ] = await Promise.all([
      FeeInvoiceModel.find({ ...baseFilter, status: { $ne: 'CANCELLED' } }).exec(),
      FeePaymentModel.find({ ...baseFilter, status: 'SUCCESS' }).exec(),
    ]);

    let totalExpected = 0;
    let outstandingFees = 0;
    let overdueFees = 0;

    const classStatsMap: Record<
      string,
      { className: string; expected: number; collected: number; outstanding: number }
    > = {};

    invoices.forEach((inv) => {
      totalExpected += inv.totalPayable || 0;
      outstandingFees += inv.outstandingAmount || 0;

      if (inv.dueDate < todayStr && inv.outstandingAmount > 0) {
        overdueFees += inv.outstandingAmount;
      }

      if (!classStatsMap[inv.className]) {
        classStatsMap[inv.className] = {
          className: inv.className,
          expected: 0,
          collected: 0,
          outstanding: 0,
        };
      }
      classStatsMap[inv.className].expected += inv.totalPayable || 0;
      classStatsMap[inv.className].outstanding += inv.outstandingAmount || 0;
      classStatsMap[inv.className].collected += inv.paidAmount || 0;
    });

    let totalCollected = 0;
    const monthlyMap: Record<string, { month: string; amount: number; count: number }> = {};
    const methodMap: Record<string, { method: string; amount: number; count: number }> = {};

    successfulPayments.forEach((p) => {
      totalCollected += p.amount || 0;

      // Month: YYYY-MM
      const mStr = p.paymentDate ? p.paymentDate.substring(0, 7) : 'Unknown';
      if (!monthlyMap[mStr]) {
        monthlyMap[mStr] = { month: mStr, amount: 0, count: 0 };
      }
      monthlyMap[mStr].amount += p.amount;
      monthlyMap[mStr].count += 1;

      // Method
      const method = p.paymentMethod || 'OTHER';
      if (!methodMap[method]) {
        methodMap[method] = { method, amount: 0, count: 0 };
      }
      methodMap[method].amount += p.amount;
      methodMap[method].count += 1;
    });

    const collectionPercentage =
      totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const monthlyCollection = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const classWiseCollection = Object.values(classStatsMap)
      .map((c) => ({
        ...c,
        percentage: c.expected > 0 ? Math.round((c.collected / c.expected) * 100) : 0,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));

    const paymentMethodBreakdown = Object.values(methodMap).sort(
      (a, b) => b.amount - a.amount
    );

    const recentTransactions = await FeePaymentModel.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return {
      totalExpected,
      totalCollected,
      outstandingFees,
      overdueFees,
      totalTransactions: successfulPayments.length,
      collectionPercentage,
      monthlyCollection,
      classWiseCollection,
      paymentMethodBreakdown,
      recentTransactions,
    };
  }
}
