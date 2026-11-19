import mongoose from 'mongoose';
import '../../auth/models/User.model';
import { FeeCategoryModel, IFeeCategoryDoc } from '../models/FeeCategory.model';
import { FeeConcessionModel, IFeeConcessionDoc } from '../models/FeeConcession.model';
import { FeeStructureModel, IFeeStructureDoc } from '../models/FeeStructure.model';
import {
  StudentFeeAssignmentModel,
  IStudentFeeAssignmentDoc,
} from '../models/StudentFeeAssignment.model';
import { FeeInvoiceModel, IFeeInvoiceDoc } from '../models/FeeInvoice.model';
import { FeePaymentModel, IFeePaymentDoc } from '../models/FeePayment.model';
import { FeeLedgerModel, IFeeLedgerDoc } from '../models/FeeLedger.model';
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
  deleteStructure(id: string): Promise<boolean>;

  // Student Enrollment & Assignments
  findStudentById(studentId: string): Promise<IStudentDoc | null>;
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
    installmentNumber: number,
    includeCancelled?: boolean
  ): Promise<IFeeInvoiceDoc | null>;
  updateInvoice(id: string, data: Partial<IFeeInvoiceDoc>): Promise<IFeeInvoiceDoc | null>;
  findInvoicesByAssignmentId(assignmentId: string): Promise<IFeeInvoiceDoc[]>;
  getNextInvoiceNumber(academicYear: string): Promise<string>;

  // Payments
  createPayment(data: Partial<IFeePaymentDoc>): Promise<IFeePaymentDoc>;
  findPayments(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    invoiceNumber?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<IFeePaymentDoc[]>;
  findPaymentById(id: string): Promise<IFeePaymentDoc | null>;
  findPaymentByReceiptNumber(receiptNumber: string): Promise<IFeePaymentDoc | null>;
  findPaymentByTransactionRef(ref: string): Promise<IFeePaymentDoc | null>;
  findRecentDuplicatePayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    secondsWindow?: number
  ): Promise<IFeePaymentDoc | null>;
  findPaymentsByInvoiceId(invoiceId: string): Promise<IFeePaymentDoc[]>;
  updatePayment(id: string, data: Partial<IFeePaymentDoc>): Promise<IFeePaymentDoc | null>;
  getNextReceiptNumber(academicYear: string): Promise<string>;
  getCollectionMetrics(academicYear?: string): Promise<{
    totalCollected: number;
    todayCollected: number;
    pendingPaymentsCount: number;
    totalOutstanding: number;
  }>;

  // Ledger
  createLedgerEntry(data: Partial<IFeeLedgerDoc>): Promise<IFeeLedgerDoc>;
  findLedgerEntries(filter?: {
    academicYear?: string;
    studentId?: string;
    transactionType?: string;
    status?: string;
  }): Promise<IFeeLedgerDoc[]>;
  findLedgerByPaymentId(paymentId: string): Promise<IFeeLedgerDoc | null>;
  updateLedgerEntry(id: string, data: Partial<IFeeLedgerDoc>): Promise<IFeeLedgerDoc | null>;
  getNextLedgerNumber(academicYear: string): Promise<string>;

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

  async deleteStructure(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await FeeStructureModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  // Student Enrollment & Assignments
  async findStudentById(studentId: string): Promise<IStudentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(studentId)) return null;
    return await StudentModel.findById(studentId).populate('parentId').exec();
  }

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
    installmentNumber: number,
    includeCancelled: boolean = true
  ): Promise<IFeeInvoiceDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) return null;
    const query: Record<string, any> = {
      feeAssignmentId: new mongoose.Types.ObjectId(assignmentId),
      installmentNumber,
    };
    if (!includeCancelled) {
      query.status = { $ne: 'CANCELLED' };
    }
    return await FeeInvoiceModel.findOne(query).exec();
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

  async findInvoicesByAssignmentId(assignmentId: string): Promise<IFeeInvoiceDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) return [];
    return await FeeInvoiceModel.find({
      feeAssignmentId: new mongoose.Types.ObjectId(assignmentId),
    }).exec();
  }

  async getNextInvoiceNumber(academicYear: string): Promise<string> {
    const yearPrefix = academicYear.split('-')[0] || new Date().getFullYear().toString();
    let count = await FeeInvoiceModel.countDocuments({
      academicYear: academicYear.trim(),
    }).exec();
    let candidate = `INV-${yearPrefix}-${(count + 1).toString().padStart(4, '0')}`;
    let exists = await FeeInvoiceModel.findOne({ invoiceNumber: candidate }).exec();
    while (exists) {
      count++;
      candidate = `INV-${yearPrefix}-${(count + 1).toString().padStart(4, '0')}`;
      exists = await FeeInvoiceModel.findOne({ invoiceNumber: candidate }).exec();
    }
    return candidate;
  }

  // Payments
  async createPayment(data: Partial<IFeePaymentDoc>): Promise<IFeePaymentDoc> {
    return await FeePaymentModel.create(data);
  }

  async findPayments(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    invoiceNumber?: string;
    paymentMethod?: string;
    status?: string;
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
    if (filter?.section && filter.section !== 'ALL') {
      query.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }
    if (filter?.invoiceNumber && filter.invoiceNumber !== 'ALL') {
      query.invoiceNumber = { $regex: new RegExp(`^${filter.invoiceNumber.trim()}$`, 'i') };
    }
    if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
      query.paymentMethod = filter.paymentMethod;
    }
    if (filter?.status && filter.status !== 'ALL') {
      query.status = filter.status;
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

  async findPaymentByReceiptNumber(receiptNumber: string): Promise<IFeePaymentDoc | null> {
    if (!receiptNumber) return null;
    return await FeePaymentModel.findOne({
      receiptNumber: receiptNumber.trim().toUpperCase(),
    }).exec();
  }

  async findPaymentByTransactionRef(ref: string): Promise<IFeePaymentDoc | null> {
    if (!ref || !ref.trim()) return null;
    return await FeePaymentModel.findOne({
      transactionReference: { $regex: new RegExp(`^${ref.trim()}$`, 'i') },
      status: 'SUCCESS',
    }).exec();
  }

  async findRecentDuplicatePayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    secondsWindow: number = 10
  ): Promise<IFeePaymentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) return null;
    const since = new Date(Date.now() - secondsWindow * 1000);
    return await FeePaymentModel.findOne({
      invoiceId: new mongoose.Types.ObjectId(invoiceId),
      amount,
      paymentMethod,
      status: 'SUCCESS',
      createdAt: { $gte: since },
    }).exec();
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
    let nextNum = count + 1;
    let candidate = `REC-${yearPrefix}-${nextNum.toString().padStart(4, '0')}`;
    let exists = await FeePaymentModel.findOne({ receiptNumber: candidate }).exec();
    while (exists) {
      nextNum++;
      candidate = `REC-${yearPrefix}-${nextNum.toString().padStart(4, '0')}`;
      exists = await FeePaymentModel.findOne({ receiptNumber: candidate }).exec();
    }
    return candidate;
  }

  async getCollectionMetrics(academicYear?: string): Promise<{
    totalCollected: number;
    todayCollected: number;
    pendingPaymentsCount: number;
    totalOutstanding: number;
  }> {
    const todayStr = new Date().toISOString().split('T')[0];
    const paymentQuery: Record<string, any> = { status: 'SUCCESS' };
    const invoiceQuery: Record<string, any> = { status: { $ne: 'CANCELLED' } };

    if (academicYear && academicYear !== 'ALL') {
      paymentQuery.academicYear = academicYear;
      invoiceQuery.academicYear = academicYear;
    }

    const [payments, invoices] = await Promise.all([
      FeePaymentModel.find(paymentQuery).select('amount paymentDate').lean().exec(),
      FeeInvoiceModel.find(invoiceQuery).select('outstandingAmount status').lean().exec(),
    ]);

    let totalCollected = 0;
    let todayCollected = 0;
    payments.forEach((p) => {
      totalCollected += p.amount || 0;
      if (p.paymentDate === todayStr) {
        todayCollected += p.amount || 0;
      }
    });

    let pendingPaymentsCount = 0;
    let totalOutstanding = 0;
    invoices.forEach((inv) => {
      if (inv.status === 'UNPAID' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') {
        pendingPaymentsCount++;
      }
      totalOutstanding += inv.outstandingAmount || 0;
    });

    return {
      totalCollected: Math.round(totalCollected * 100) / 100,
      todayCollected: Math.round(todayCollected * 100) / 100,
      pendingPaymentsCount,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    };
  }

  // Ledger
  async createLedgerEntry(data: Partial<IFeeLedgerDoc>): Promise<IFeeLedgerDoc> {
    return await FeeLedgerModel.create(data);
  }

  async findLedgerEntries(filter?: {
    academicYear?: string;
    studentId?: string;
    transactionType?: string;
    status?: string;
  }): Promise<IFeeLedgerDoc[]> {
    const query: Record<string, any> = {};
    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear;
    }
    if (filter?.studentId && mongoose.Types.ObjectId.isValid(filter.studentId)) {
      query.studentId = new mongoose.Types.ObjectId(filter.studentId);
    }
    if (filter?.transactionType && filter.transactionType !== 'ALL') {
      query.transactionType = filter.transactionType;
    }
    if (filter?.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    return await FeeLedgerModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findLedgerByPaymentId(paymentId: string): Promise<IFeeLedgerDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;
    return await FeeLedgerModel.findOne({
      paymentId: new mongoose.Types.ObjectId(paymentId),
      transactionType: 'FEE_PAYMENT',
    }).exec();
  }

  async updateLedgerEntry(
    id: string,
    data: Partial<IFeeLedgerDoc>
  ): Promise<IFeeLedgerDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await FeeLedgerModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async getNextLedgerNumber(academicYear: string): Promise<string> {
    const yearPrefix = academicYear.split('-')[0] || new Date().getFullYear().toString();
    const count = await FeeLedgerModel.countDocuments({
      academicYear: academicYear.trim(),
    }).exec();
    let nextNum = count + 1;
    let candidate = `LED-${yearPrefix}-${nextNum.toString().padStart(4, '0')}`;
    let exists = await FeeLedgerModel.findOne({ entryNumber: candidate }).exec();
    while (exists) {
      nextNum++;
      candidate = `LED-${yearPrefix}-${nextNum.toString().padStart(4, '0')}`;
      exists = await FeeLedgerModel.findOne({ entryNumber: candidate }).exec();
    }
    return candidate;
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
