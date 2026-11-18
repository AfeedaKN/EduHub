import mongoose from 'mongoose';
import { IAdminFeeRepository } from '../repositories/AdminFeeRepository';
import {
  FeeCategoryDTO,
  CreateFeeCategoryDTO,
  UpdateFeeCategoryDTO,
  FeeConcessionDTO,
  CreateFeeConcessionDTO,
  UpdateFeeConcessionDTO,
  FeeStructureDTO,
  CreateFeeStructureDTO,
  UpdateFeeStructureDTO,
  FeeStructureUsageDTO,
  StudentFeeAssignmentDTO,
  AssignFeeDTO,
  FeeInvoiceDTO,
  GenerateInvoicesDTO,
  CollectFeeDTO,
  ReversePaymentDTO,
  FeePaymentDTO,
  DefaulterItemDTO,
  FeeDashboardSummaryDTO,
  FeeReportDTO,
  FeeReportType,
} from '../dtos/adminFee.dto';
import { IFeeCategoryDoc } from '../models/FeeCategory.model';
import { IFeeConcessionDoc } from '../models/FeeConcession.model';
import { IFeeStructureDoc } from '../models/FeeStructure.model';
import {
  IStudentFeeAssignmentDoc,
  IAssignedInstallment,
  AssignmentInstallmentStatus,
} from '../models/StudentFeeAssignment.model';
import { IFeeInvoiceDoc } from '../models/FeeInvoice.model';
import { IFeePaymentDoc } from '../models/FeePayment.model';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../../../shared/domain/errors/AppError';

export class AdminFeeService {
  constructor(private readonly feeRepo: IAdminFeeRepository) {}

  // ---------------------------------------------------------------------------
  // 1. Fee Categories
  // ---------------------------------------------------------------------------
  private toCategoryDTO(doc: IFeeCategoryDoc): FeeCategoryDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      name: doc.name,
      code: doc.code,
      description: doc.description || '',
      categoryType: doc.categoryType,
      feeNature: doc.feeNature,
      isMandatory: doc.isMandatory !== undefined ? doc.isMandatory : true,
      isRefundable: doc.isRefundable !== undefined ? doc.isRefundable : false,
      status: doc.status,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getCategories(status?: string): Promise<FeeCategoryDTO[]> {
    const docs = await this.feeRepo.findCategories(status);
    return docs.map((d) => this.toCategoryDTO(d));
  }

  async getCategoryById(id: string): Promise<FeeCategoryDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid category ID.');
    }
    const doc = await this.feeRepo.findCategoryById(id);
    if (!doc) {
      throw new NotFoundError('Fee category not found.');
    }
    return this.toCategoryDTO(doc);
  }

  async getCategoryUsage(id: string): Promise<{
    isUsed: boolean;
    activeStructuresCount: number;
    structures: { id: string; name: string; academicYear: string; className: string; status: string }[];
  }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid category ID.');
    }
    const structures = await this.feeRepo.findStructuresByCategoryId(id);
    const activeCount = structures.filter((s) => s.status === 'ACTIVE').length;
    return {
      isUsed: structures.length > 0,
      activeStructuresCount: activeCount,
      structures: structures.map((s) => ({
        id: s._id ? s._id.toString() : '',
        name: s.name,
        academicYear: s.academicYear,
        className: s.className,
        status: s.status,
      })),
    };
  }

  async createCategory(dto: CreateFeeCategoryDTO): Promise<FeeCategoryDTO> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Fee category name is required.');
    }
    if (!dto.code || !dto.code.trim()) {
      throw new ValidationError('Fee category code is required.');
    }

    const existingName = await this.feeRepo.findCategoryByName(dto.name);
    if (existingName) {
      throw new ConflictError(`Fee category '${dto.name}' already exists.`);
    }

    const existingCode = await this.feeRepo.findCategoryByCode(dto.code);
    if (existingCode) {
      throw new ConflictError(`Fee category with code '${dto.code}' already exists.`);
    }

    const created = await this.feeRepo.createCategory({
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      description: dto.description ? dto.description.trim() : '',
      categoryType: dto.categoryType || 'ACADEMIC',
      feeNature: dto.feeNature || 'RECURRING',
      isMandatory: dto.isMandatory !== undefined ? dto.isMandatory : true,
      isRefundable: dto.isRefundable !== undefined ? dto.isRefundable : false,
      status: dto.status || 'ACTIVE',
    });

    return this.toCategoryDTO(created);
  }

  async updateCategory(id: string, dto: UpdateFeeCategoryDTO): Promise<FeeCategoryDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid category ID.');
    }

    const existing = await this.feeRepo.findCategoryById(id);
    if (!existing) {
      throw new NotFoundError('Fee category not found.');
    }

    if (dto.name && dto.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.feeRepo.findCategoryByName(dto.name);
      if (duplicate) {
        throw new ConflictError(`Fee category '${dto.name}' already exists.`);
      }
    }

    // Safety check: Prevent unsafe deactivation when category is used by active fee structures
    if (dto.status === 'INACTIVE' && existing.status === 'ACTIVE') {
      const structuresUsing = await this.feeRepo.findStructuresByCategoryId(id);
      const activeUsing = structuresUsing.filter((s) => s.status === 'ACTIVE');
      if (activeUsing.length > 0) {
        const structureList = activeUsing.map((s) => `'${s.name}' (${s.className})`).join(', ');
        throw new ValidationError(
          `Cannot deactivate fee category '${existing.name}'. It is currently referenced in ${activeUsing.length} active fee structure(s): ${structureList}. Please remove or replace this category in those fee structures before deactivating it.`
        );
      }
    }

    const payload: Partial<IFeeCategoryDoc> = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description.trim();
    if (dto.categoryType !== undefined) payload.categoryType = dto.categoryType;
    if (dto.feeNature !== undefined) payload.feeNature = dto.feeNature;
    if (dto.isMandatory !== undefined) payload.isMandatory = dto.isMandatory;
    if (dto.isRefundable !== undefined) payload.isRefundable = dto.isRefundable;
    if (dto.status !== undefined) payload.status = dto.status;

    const updated = await this.feeRepo.updateCategory(id, payload);
    if (!updated) {
      throw new NotFoundError('Fee category not found after update.');
    }

    return this.toCategoryDTO(updated);
  }

  // ---------------------------------------------------------------------------
  // 2. Fee Concessions
  // ---------------------------------------------------------------------------
  private toConcessionDTO(doc: IFeeConcessionDoc): FeeConcessionDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      name: doc.name,
      code: doc.code,
      discountType: doc.discountType,
      value: doc.value,
      applicableCategories: doc.applicableCategories || ['ALL'],
      description: doc.description || '',
      status: doc.status,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getConcessions(status?: string): Promise<FeeConcessionDTO[]> {
    const docs = await this.feeRepo.findConcessions(status);
    return docs.map((d) => this.toConcessionDTO(d));
  }

  async createConcession(dto: CreateFeeConcessionDTO): Promise<FeeConcessionDTO> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Concession name is required.');
    }
    if (!dto.code || !dto.code.trim()) {
      throw new ValidationError('Concession code is required.');
    }
    if (dto.value === undefined || dto.value < 0) {
      throw new ValidationError('Concession value must be non-negative.');
    }
    if (dto.discountType === 'PERCENTAGE' && dto.value > 100) {
      throw new ValidationError('Percentage discount cannot exceed 100%.');
    }

    const created = await this.feeRepo.createConcession({
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      discountType: dto.discountType,
      value: Number(dto.value),
      applicableCategories:
        dto.applicableCategories && dto.applicableCategories.length > 0
          ? dto.applicableCategories
          : ['ALL'],
      description: dto.description ? dto.description.trim() : '',
      status: 'ACTIVE',
    });

    return this.toConcessionDTO(created);
  }

  async updateConcession(id: string, dto: UpdateFeeConcessionDTO): Promise<FeeConcessionDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid concession ID.');
    }

    const existing = await this.feeRepo.findConcessionById(id);
    if (!existing) {
      throw new NotFoundError('Fee concession not found.');
    }

    const payload: Partial<IFeeConcessionDoc> = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.discountType !== undefined) payload.discountType = dto.discountType;
    if (dto.value !== undefined) {
      if (dto.value < 0) throw new ValidationError('Discount value cannot be negative.');
      const dt = dto.discountType || existing.discountType;
      if (dt === 'PERCENTAGE' && dto.value > 100) {
        throw new ValidationError('Percentage discount cannot exceed 100%.');
      }
      payload.value = Number(dto.value);
    }
    if (dto.applicableCategories !== undefined) {
      payload.applicableCategories = dto.applicableCategories;
    }
    if (dto.description !== undefined) payload.description = dto.description.trim();
    if (dto.status !== undefined) payload.status = dto.status;

    const updated = await this.feeRepo.updateConcession(id, payload);
    if (!updated) {
      throw new NotFoundError('Fee concession not found after update.');
    }

    return this.toConcessionDTO(updated);
  }

  // ---------------------------------------------------------------------------
  // 3. Fee Structures
  // ---------------------------------------------------------------------------
  private toStructureDTO(doc: IFeeStructureDoc): FeeStructureDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      name: doc.name,
      description: doc.description || '',
      academicYear: doc.academicYear,
      className: doc.className,
      section: doc.section,
      categories: (doc.categories || []).map((c) => ({
        categoryId: c.categoryId ? c.categoryId.toString() : '',
        categoryName: c.categoryName,
        amount: c.amount,
        isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
      })),
      totalAmount: doc.totalAmount,
      paymentFrequency: doc.paymentFrequency,
      installments: (doc.installments || []).map((inst) => ({
        installmentNumber: inst.installmentNumber,
        name: inst.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
      })),
      lateFeeRule: doc.lateFeeRule || {
        enabled: false,
        gracePeriodDays: 0,
        feeType: 'FIXED',
        amount: 0,
      },
      status: doc.status,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getStructures(filter?: {
    academicYear?: string;
    className?: string;
    status?: string;
  }): Promise<FeeStructureDTO[]> {
    const docs = await this.feeRepo.findStructures(filter);
    return docs.map((d) => this.toStructureDTO(d));
  }

  async getStructureById(id: string): Promise<FeeStructureDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid fee structure ID.');
    }
    const doc = await this.feeRepo.findStructureById(id);
    if (!doc) {
      throw new NotFoundError('Fee structure not found.');
    }
    return this.toStructureDTO(doc);
  }

  async getStructureUsage(id: string): Promise<FeeStructureUsageDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid fee structure ID.');
    }
    const structure = await this.feeRepo.findStructureById(id);
    if (!structure) {
      throw new NotFoundError('Fee structure not found.');
    }
    const [assignmentsCount, invoicesCount] = await Promise.all([
      this.feeRepo.countAssignmentsByStructureId(id),
      this.feeRepo.countInvoicesByStructureId(id),
    ]);
    return {
      id: structure._id ? structure._id.toString() : (structure as any).id,
      name: structure.name,
      assignmentsCount,
      invoicesCount,
      canEditFinancials: invoicesCount === 0,
    };
  }

  async createStructure(dto: CreateFeeStructureDTO): Promise<FeeStructureDTO> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Fee structure name is required.');
    }
    if (!dto.className || !dto.className.trim()) {
      throw new ValidationError('Class name is required.');
    }
    if (!dto.academicYear || !dto.academicYear.trim()) {
      throw new ValidationError('Academic year is required.');
    }
    if (!dto.categories || dto.categories.length === 0) {
      throw new ValidationError('At least one fee category must be added to the structure.');
    }

    // Check for duplicate category IDs
    const categoryIds = dto.categories.map((c) => c.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
      throw new ValidationError('Duplicate fee categories are not allowed in the same fee structure.');
    }

    // Validate that categories exist, are active, and have positive amounts
    const populatedCategories = [];
    for (const catItem of dto.categories) {
      if (!mongoose.Types.ObjectId.isValid(catItem.categoryId)) {
        throw new ValidationError(`Invalid category ID: ${catItem.categoryId}`);
      }
      const catDoc = await this.feeRepo.findCategoryById(catItem.categoryId);
      if (!catDoc) {
        throw new ValidationError(`Fee category '${catItem.categoryName || catItem.categoryId}' not found.`);
      }
      if (catDoc.status !== 'ACTIVE') {
        throw new ValidationError(
          `Fee category '${catDoc.name}' is inactive and cannot be added to an active fee structure.`
        );
      }
      const amount = Number(catItem.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new ValidationError(`Amount for category '${catDoc.name}' must be greater than zero.`);
      }
      populatedCategories.push({
        categoryId: new mongoose.Types.ObjectId(catItem.categoryId),
        categoryName: catDoc.name,
        amount,
        isMandatory: catItem.isMandatory !== undefined ? catItem.isMandatory : catDoc.isMandatory,
      });
    }

    const calculatedTotal = populatedCategories.reduce((sum, c) => sum + c.amount, 0);
    if (calculatedTotal <= 0) {
      throw new ValidationError('Fee structure total amount must be greater than zero.');
    }

    // Installment allocation check
    if (!dto.installments || dto.installments.length === 0) {
      throw new ValidationError('At least one installment schedule must be configured.');
    }

    const sumInstallments = dto.installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    if (Math.abs(sumInstallments - calculatedTotal) > 0.01) {
      throw new ValidationError(
        `Total installment allocation (₹${sumInstallments}) must exactly equal total fee amount (₹${calculatedTotal}).`
      );
    }

    const existingName = await this.feeRepo.findStructureByNameAndYear(dto.name, dto.academicYear);
    if (existingName) {
      throw new ConflictError(
        `A fee structure named '${dto.name}' already exists for academic year ${dto.academicYear}.`
      );
    }

    const created = await this.feeRepo.createStructure({
      name: dto.name.trim(),
      description: dto.description ? dto.description.trim() : '',
      academicYear: dto.academicYear.trim(),
      className: dto.className.trim(),
      section: dto.section && dto.section.trim() ? dto.section.trim().toUpperCase() : 'ALL',
      categories: populatedCategories,
      totalAmount: calculatedTotal,
      paymentFrequency: dto.paymentFrequency || 'TERM',
      installments: dto.installments.map((inst, index) => ({
        installmentNumber: inst.installmentNumber || index + 1,
        name: inst.name.trim(),
        amount: Number(inst.amount),
        dueDate: inst.dueDate.trim(),
      })),
      lateFeeRule: dto.lateFeeRule || {
        enabled: false,
        gracePeriodDays: 0,
        feeType: 'FIXED',
        amount: 0,
      },
      status: 'ACTIVE',
    });

    return this.toStructureDTO(created);
  }

  async updateStructure(id: string, dto: UpdateFeeStructureDTO): Promise<FeeStructureDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid fee structure ID.');
    }

    const existing = await this.feeRepo.findStructureById(id);
    if (!existing) {
      throw new NotFoundError('Fee structure not found.');
    }

    // Guard: Prevent modifying financial figures if invoices have been issued
    const invoiceCount = await this.feeRepo.countInvoicesByStructureId(id);
    const isModifyingFinancials =
      dto.categories !== undefined ||
      dto.installments !== undefined ||
      (dto.totalAmount !== undefined && dto.totalAmount !== existing.totalAmount) ||
      (dto.paymentFrequency !== undefined && dto.paymentFrequency !== existing.paymentFrequency);

    if (invoiceCount > 0 && isModifyingFinancials) {
      throw new ValidationError(
        `Cannot modify financial terms (categories, amounts, or installments) of fee structure '${existing.name}' because ${invoiceCount} invoice(s) have already been issued. Status and non-financial attributes can still be updated, or you can create a new fee structure.`
      );
    }

    const payload: Partial<IFeeStructureDoc> = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description.trim();

    let newTotal = existing.totalAmount;
    if (dto.categories !== undefined) {
      if (dto.categories.length === 0) {
        throw new ValidationError('At least one fee category must be added to the structure.');
      }
      const categoryIds = dto.categories.map((c) => c.categoryId);
      if (new Set(categoryIds).size !== categoryIds.length) {
        throw new ValidationError('Duplicate fee categories are not allowed in the same fee structure.');
      }

      const populatedCategories = [];
      for (const catItem of dto.categories) {
        if (!mongoose.Types.ObjectId.isValid(catItem.categoryId)) {
          throw new ValidationError(`Invalid category ID: ${catItem.categoryId}`);
        }
        const catDoc = await this.feeRepo.findCategoryById(catItem.categoryId);
        if (!catDoc) {
          throw new ValidationError(`Fee category '${catItem.categoryName || catItem.categoryId}' not found.`);
        }
        if (catDoc.status !== 'ACTIVE') {
          throw new ValidationError(
            `Fee category '${catDoc.name}' is inactive and cannot be added to a fee structure.`
          );
        }
        const amount = Number(catItem.amount);
        if (isNaN(amount) || amount <= 0) {
          throw new ValidationError(`Amount for category '${catDoc.name}' must be greater than zero.`);
        }
        populatedCategories.push({
          categoryId: new mongoose.Types.ObjectId(catItem.categoryId),
          categoryName: catDoc.name,
          amount,
          isMandatory: catItem.isMandatory !== undefined ? catItem.isMandatory : catDoc.isMandatory,
        });
      }

      newTotal = populatedCategories.reduce((sum, c) => sum + c.amount, 0);
      payload.categories = populatedCategories;
      payload.totalAmount = newTotal;
    }

    if (dto.installments !== undefined) {
      if (dto.installments.length === 0) {
        throw new ValidationError('At least one installment schedule must be configured.');
      }
      const sumInst = dto.installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      if (Math.abs(sumInst - newTotal) > 0.01) {
        throw new ValidationError(
          `Total installment allocation (₹${sumInst}) must exactly equal fee total (₹${newTotal}).`
        );
      }
      payload.installments = dto.installments.map((inst, index) => ({
        installmentNumber: inst.installmentNumber || index + 1,
        name: inst.name.trim(),
        amount: Number(inst.amount),
        dueDate: inst.dueDate.trim(),
      }));
    }

    if (dto.paymentFrequency !== undefined) payload.paymentFrequency = dto.paymentFrequency;
    if (dto.lateFeeRule !== undefined) payload.lateFeeRule = dto.lateFeeRule;
    if (dto.status !== undefined) payload.status = dto.status;

    const updated = await this.feeRepo.updateStructure(id, payload);
    if (!updated) {
      throw new NotFoundError('Fee structure not found after update.');
    }

    return this.toStructureDTO(updated);
  }

  async duplicateStructure(id: string, targetAcademicYear: string, newName?: string): Promise<FeeStructureDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid fee structure ID.');
    }
    if (!targetAcademicYear || !targetAcademicYear.trim()) {
      throw new ValidationError('Target academic year is required for duplicating a structure.');
    }
    const existing = await this.feeRepo.findStructureById(id);
    if (!existing) {
      throw new NotFoundError('Fee structure not found.');
    }

    const targetYear = targetAcademicYear.trim();
    const nameToUse =
      newName && newName.trim()
        ? newName.trim()
        : `${existing.className} Standard Fee ${targetYear}`;

    const existingTarget = await this.feeRepo.findStructureByNameAndYear(nameToUse, targetYear);
    if (existingTarget) {
      throw new ConflictError(
        `A fee structure named '${nameToUse}' already exists for academic year ${targetYear}.`
      );
    }

    // Shift due dates to the target academic year if applicable
    const sourceYearStart = parseInt(existing.academicYear.split('-')[0]) || 2026;
    const targetYearStart = parseInt(targetYear.split('-')[0]) || sourceYearStart + 1;
    const yearDiff = targetYearStart - sourceYearStart;

    const shiftedInstallments = existing.installments.map((inst) => {
      let shiftedDate = inst.dueDate;
      if (inst.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(inst.dueDate)) {
        const parts = inst.dueDate.split('-');
        const originalYear = parseInt(parts[0]);
        const newYear = originalYear + yearDiff;
        shiftedDate = `${newYear}-${parts[1]}-${parts[2]}`;
      }
      return {
        installmentNumber: inst.installmentNumber,
        name: inst.name,
        amount: inst.amount,
        dueDate: shiftedDate,
      };
    });

    const created = await this.feeRepo.createStructure({
      name: nameToUse,
      description: existing.description || '',
      academicYear: targetYear,
      className: existing.className,
      section: existing.section,
      categories: existing.categories.map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        amount: c.amount,
        isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
      })),
      totalAmount: existing.totalAmount,
      paymentFrequency: existing.paymentFrequency,
      installments: shiftedInstallments,
      lateFeeRule: existing.lateFeeRule,
      status: 'ACTIVE',
    });

    return this.toStructureDTO(created);
  }

  // ---------------------------------------------------------------------------
  // 4. Student Fee Assignment
  // ---------------------------------------------------------------------------
  private toAssignmentDTO(doc: IStudentFeeAssignmentDoc): StudentFeeAssignmentDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      studentId: doc.studentId ? doc.studentId.toString() : '',
      admissionNumber: doc.admissionNumber,
      studentName: doc.studentName,
      className: doc.className,
      section: doc.section,
      academicYear: doc.academicYear,
      feeStructureId: doc.feeStructureId ? doc.feeStructureId.toString() : '',
      feeStructureName: doc.feeStructureName,
      baseAmount: doc.baseAmount,
      concessionId: doc.concessionId ? doc.concessionId.toString() : undefined,
      concessionName: doc.concessionName,
      concessionAmount: doc.concessionAmount || 0,
      concessionReason: doc.concessionReason,
      netPayable: doc.netPayable,
      installments: (doc.installments || []).map((inst) => ({
        installmentNumber: inst.installmentNumber,
        name: inst.name,
        baseAmount: inst.baseAmount,
        concessionAmount: inst.concessionAmount,
        netAmount: inst.netAmount,
        dueDate: inst.dueDate,
        paidAmount: inst.paidAmount || 0,
        status: inst.status,
      })),
      status: doc.status,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async getFeeAssignments(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    studentId?: string;
  }): Promise<StudentFeeAssignmentDTO[]> {
    const docs = await this.feeRepo.findFeeAssignments(filter);
    return docs.map((d) => this.toAssignmentDTO(d));
  }

  async assignFees(
    userId: string,
    dto: AssignFeeDTO
  ): Promise<{ assignedCount: number; skippedCount: number; assignments: StudentFeeAssignmentDTO[] }> {
    if (!dto.feeStructureId || !mongoose.Types.ObjectId.isValid(dto.feeStructureId)) {
      throw new ValidationError('Valid fee structure reference is required.');
    }

    const structure = await this.feeRepo.findStructureById(dto.feeStructureId);
    if (!structure || structure.status !== 'ACTIVE') {
      throw new NotFoundError('Active fee structure not found.');
    }

    let concession: IFeeConcessionDoc | null = null;
    if (dto.concessionId) {
      if (!mongoose.Types.ObjectId.isValid(dto.concessionId)) {
        throw new ValidationError('Invalid concession ID.');
      }
      concession = await this.feeRepo.findConcessionById(dto.concessionId);
      if (!concession || concession.status !== 'ACTIVE') {
        throw new NotFoundError('Active fee concession not found.');
      }
    }

    // Determine target students
    let targetStudents: any[] = [];
    if (dto.studentIds && dto.studentIds.length > 0) {
      const allActive = await this.feeRepo.findActiveEnrolledStudents(
        dto.className,
        dto.section,
        dto.academicYear
      );
      targetStudents = allActive.filter((s) => dto.studentIds!.includes(s._id.toString()));
    } else {
      targetStudents = await this.feeRepo.findActiveEnrolledStudents(
        dto.className,
        dto.section,
        dto.academicYear
      );
    }

    if (targetStudents.length === 0) {
      throw new ValidationError(
        `No active enrolled students found in ${dto.className} ${dto.section || ''} for academic year ${dto.academicYear}.`
      );
    }

    let assignedCount = 0;
    let skippedCount = 0;
    const createdAssignments: StudentFeeAssignmentDTO[] = [];

    for (const student of targetStudents) {
      // Check if already assigned for this academic year
      const existingAssignment = await this.feeRepo.findAssignmentByStudentAndYear(
        student._id.toString(),
        dto.academicYear
      );

      if (existingAssignment) {
        skippedCount++;
        continue;
      }

      // Calculate concession
      let totalConcession = 0;
      if (concession) {
        if (concession.discountType === 'PERCENTAGE') {
          totalConcession = Math.round(structure.totalAmount * (concession.value / 100));
        } else {
          totalConcession = Math.min(concession.value, structure.totalAmount);
        }
      }

      const netPayable = Math.max(0, structure.totalAmount - totalConcession);

      // Apportion installment schedule
      const numInstallments = structure.installments.length || 1;
      const concessionPerInstallment = Math.floor(totalConcession / numInstallments);
      let remainderConcession = totalConcession - concessionPerInstallment * numInstallments;

      const assignedInstallments: IAssignedInstallment[] = structure.installments.map(
        (inst, idx) => {
          let instConcession = concessionPerInstallment;
          if (idx === numInstallments - 1) {
            instConcession += remainderConcession;
          }
          const net = Math.max(0, inst.amount - instConcession);
          return {
            installmentNumber: inst.installmentNumber,
            name: inst.name,
            baseAmount: inst.amount,
            concessionAmount: instConcession,
            netAmount: net,
            dueDate: inst.dueDate,
            paidAmount: 0,
            status: 'UNPAID',
          };
        }
      );

      const createdDoc = await this.feeRepo.createFeeAssignment({
        studentId: student._id,
        admissionNumber: student.studentId,
        studentName: student.fullName,
        className: student.grade,
        section: student.section,
        academicYear: dto.academicYear.trim(),
        feeStructureId: structure._id,
        feeStructureName: structure.name,
        baseAmount: structure.totalAmount,
        concessionId: concession ? concession._id : undefined,
        concessionName: concession ? concession.name : '',
        concessionAmount: totalConcession,
        concessionReason: dto.concessionReason || '',
        netPayable,
        installments: assignedInstallments,
        assignedBy: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE',
      });

      assignedCount++;
      createdAssignments.push(this.toAssignmentDTO(createdDoc));
    }

    if (assignedCount === 0 && skippedCount > 0) {
      throw new ValidationError(
        `Selected student(s) already have an active fee structure assigned for academic year ${dto.academicYear}.`
      );
    }

    return {
      assignedCount,
      skippedCount,
      assignments: createdAssignments,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Invoices
  // ---------------------------------------------------------------------------
  private toInvoiceDTO(doc: IFeeInvoiceDoc): FeeInvoiceDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      invoiceNumber: doc.invoiceNumber,
      studentId: doc.studentId ? doc.studentId.toString() : '',
      studentAdmissionNumber: doc.studentAdmissionNumber,
      studentName: doc.studentName,
      parentId: doc.parentId ? doc.parentId.toString() : undefined,
      parentName: doc.parentName || '',
      parentContact: doc.parentContact || '',
      className: doc.className,
      section: doc.section,
      academicYear: doc.academicYear,
      feeAssignmentId: doc.feeAssignmentId ? doc.feeAssignmentId.toString() : '',
      feeStructureId: doc.feeStructureId ? doc.feeStructureId.toString() : '',
      installmentNumber: doc.installmentNumber,
      installmentName: doc.installmentName,
      items: doc.items || [],
      subtotal: doc.subtotal,
      concessionAmount: doc.concessionAmount || 0,
      lateFeeAmount: doc.lateFeeAmount || 0,
      totalPayable: doc.totalPayable,
      paidAmount: doc.paidAmount || 0,
      outstandingAmount: doc.outstandingAmount,
      issueDate: doc.issueDate,
      dueDate: doc.dueDate,
      status: doc.status,
      notes: doc.notes || '',
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async getInvoices(filter?: {
    academicYear?: string;
    className?: string;
    section?: string;
    status?: string;
    studentId?: string;
    search?: string;
  }): Promise<FeeInvoiceDTO[]> {
    const docs = await this.feeRepo.findInvoices(filter);
    return docs.map((d) => this.toInvoiceDTO(d));
  }

  async getInvoiceById(id: string): Promise<FeeInvoiceDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid invoice ID.');
    }
    const doc = await this.feeRepo.findInvoiceById(id);
    if (!doc) {
      throw new NotFoundError('Fee invoice not found.');
    }
    return this.toInvoiceDTO(doc);
  }

  async generateInvoices(
    dto: GenerateInvoicesDTO
  ): Promise<{ generatedCount: number; skippedCount: number; invoices: FeeInvoiceDTO[] }> {
    if (!dto.academicYear || !dto.className) {
      throw new ValidationError('Academic year and class are required to generate invoices.');
    }
    if (!dto.installmentNumber || dto.installmentNumber < 1) {
      throw new ValidationError('Valid installment number is required.');
    }

    const assignments = await this.feeRepo.findFeeAssignments({
      academicYear: dto.academicYear,
      className: dto.className,
      section: dto.section,
      studentId: dto.studentId,
    });

    if (assignments.length === 0) {
      throw new ValidationError(
        'No active fee assignments found for the selected class and academic year.'
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let generatedCount = 0;
    let skippedCount = 0;
    const generatedInvoices: FeeInvoiceDTO[] = [];

    for (const assignment of assignments) {
      // Find matching installment plan
      const installment = assignment.installments.find(
        (i) => i.installmentNumber === dto.installmentNumber
      );

      if (!installment) {
        skippedCount++;
        continue;
      }

      // Check duplicate invoice
      const existingInvoice = await this.feeRepo.findInvoiceByAssignmentAndInstallment(
        assignment._id.toString(),
        dto.installmentNumber
      );

      if (existingInvoice) {
        skippedCount++;
        continue;
      }

      // Get student's parent details
      const studentDoc = await this.feeRepo.findActiveEnrolledStudents(
        assignment.className,
        assignment.section,
        assignment.academicYear
      );
      const student = studentDoc.find((s) => s._id.toString() === assignment.studentId.toString());

      const parentName = student?.parentId ? (student.parentId as any).fullName || '' : '';
      const parentContact = student?.parentId ? (student.parentId as any).phone || (student.parentId as any).email || '' : '';

      const invoiceNumber = await this.feeRepo.getNextInvoiceNumber(dto.academicYear);

      const structure = await this.feeRepo.findStructureById(
        assignment.feeStructureId.toString()
      );
      const items = structure ? structure.categories.map((c) => ({ categoryName: c.categoryName, amount: c.amount })) : [];

      const created = await this.feeRepo.createInvoice({
        invoiceNumber,
        studentId: assignment.studentId,
        studentAdmissionNumber: assignment.admissionNumber,
        studentName: assignment.studentName,
        parentId: student?.parentId ? (student.parentId as any)._id : undefined,
        parentName,
        parentContact,
        className: assignment.className,
        section: assignment.section,
        academicYear: assignment.academicYear,
        feeAssignmentId: assignment._id,
        feeStructureId: assignment.feeStructureId,
        installmentNumber: installment.installmentNumber,
        installmentName: installment.name,
        items,
        subtotal: installment.baseAmount,
        concessionAmount: installment.concessionAmount,
        lateFeeAmount: 0,
        totalPayable: installment.netAmount,
        paidAmount: 0,
        outstandingAmount: installment.netAmount,
        issueDate: todayStr,
        dueDate: dto.dueDate || installment.dueDate,
        status: 'UNPAID',
      });

      generatedCount++;
      generatedInvoices.push(this.toInvoiceDTO(created));
    }

    return {
      generatedCount,
      skippedCount,
      invoices: generatedInvoices,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Fee Collection & Payment Recording
  // ---------------------------------------------------------------------------
  private toPaymentDTO(doc: IFeePaymentDoc): FeePaymentDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      receiptNumber: doc.receiptNumber,
      invoiceId: doc.invoiceId ? doc.invoiceId.toString() : '',
      invoiceNumber: doc.invoiceNumber,
      studentId: doc.studentId ? doc.studentId.toString() : '',
      studentAdmissionNumber: doc.studentAdmissionNumber,
      studentName: doc.studentName,
      className: doc.className,
      section: doc.section,
      academicYear: doc.academicYear,
      amount: doc.amount,
      paymentDate: doc.paymentDate,
      paymentMethod: doc.paymentMethod,
      transactionReference: doc.transactionReference,
      bankName: doc.bankName,
      chequeDate: doc.chequeDate,
      chequeStatus: doc.chequeStatus,
      remarks: doc.remarks,
      recordedByName: doc.recordedByName,
      status: doc.status,
      reversalReason: doc.reversalReason,
      reversedAt: doc.reversedAt ? doc.reversedAt.toISOString() : undefined,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async getPayments(filter?: {
    academicYear?: string;
    className?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<FeePaymentDTO[]> {
    const docs = await this.feeRepo.findPayments(filter);
    return docs.map((d) => this.toPaymentDTO(d));
  }

  async collectFee(
    recordedByUserId: string,
    recordedByName: string,
    dto: CollectFeeDTO
  ): Promise<FeePaymentDTO> {
    if (!dto.invoiceId || !mongoose.Types.ObjectId.isValid(dto.invoiceId)) {
      throw new ValidationError('Valid invoice ID is required.');
    }
    if (!dto.amount || dto.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero.');
    }
    if (!dto.paymentMethod) {
      throw new ValidationError('Payment method is required.');
    }

    const invoice = await this.feeRepo.findInvoiceById(dto.invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    if (invoice.status === 'CANCELLED') {
      throw new ValidationError('Cannot record payment for a cancelled invoice.');
    }
    if (invoice.status === 'PAID' || invoice.outstandingAmount <= 0) {
      throw new ValidationError('This invoice is already fully paid.');
    }

    const paymentAmount = Number(dto.amount);
    if (paymentAmount > invoice.outstandingAmount) {
      throw new ValidationError(
        `Payment amount (₹${paymentAmount}) cannot exceed the outstanding balance (₹${invoice.outstandingAmount}).`
      );
    }

    const receiptNumber = await this.feeRepo.getNextReceiptNumber(invoice.academicYear);

    // Create payment transaction
    const payment = await this.feeRepo.createPayment({
      receiptNumber,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      studentAdmissionNumber: invoice.studentAdmissionNumber,
      studentName: invoice.studentName,
      className: invoice.className,
      section: invoice.section,
      academicYear: invoice.academicYear,
      amount: paymentAmount,
      paymentDate: dto.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: dto.paymentMethod,
      transactionReference: dto.transactionReference ? dto.transactionReference.trim() : '',
      bankName: dto.bankName ? dto.bankName.trim() : '',
      chequeDate: dto.chequeDate ? dto.chequeDate.trim() : '',
      chequeStatus: dto.paymentMethod === 'CHEQUE' ? 'PENDING' : 'CLEARED',
      remarks: dto.remarks ? dto.remarks.trim() : '',
      recordedBy: new mongoose.Types.ObjectId(recordedByUserId),
      recordedByName,
      status: 'SUCCESS',
    });

    // Update invoice balance
    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    const newOutstanding = Math.max(0, invoice.totalPayable - newPaidAmount);
    const newStatus = newOutstanding === 0 ? 'PAID' : 'PARTIAL';

    await this.feeRepo.updateInvoice(invoice._id.toString(), {
      paidAmount: newPaidAmount,
      outstandingAmount: newOutstanding,
      status: newStatus,
    });

    // Also update installment in StudentFeeAssignment
    const assignment = await this.feeRepo.findFeeAssignmentById(
      invoice.feeAssignmentId.toString()
    );
    if (assignment) {
      const updatedInstallments = assignment.installments.map((inst) => {
        if (inst.installmentNumber === invoice.installmentNumber) {
          const instPaid = (inst.paidAmount || 0) + paymentAmount;
          const instStatus: AssignmentInstallmentStatus =
            instPaid >= inst.netAmount ? 'PAID' : instPaid > 0 ? 'PARTIAL' : 'UNPAID';
          return {
            ...inst,
            paidAmount: instPaid,
            status: instStatus,
          };
        }
        return inst;
      });

      await this.feeRepo.updateFeeAssignment(assignment._id.toString(), {
        installments: updatedInstallments,
      });
    }

    return this.toPaymentDTO(payment);
  }

  async reversePayment(
    paymentId: string,
    reversedByUserId: string,
    dto: ReversePaymentDTO
  ): Promise<FeePaymentDTO> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new ValidationError('Invalid payment ID.');
    }
    if (!dto.reason || !dto.reason.trim()) {
      throw new ValidationError('Auditable reversal reason is required.');
    }

    const payment = await this.feeRepo.findPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment transaction record not found.');
    }

    if (payment.status === 'REVERSED') {
      throw new ValidationError('This payment has already been reversed.');
    }

    const invoice = await this.feeRepo.findInvoiceById(payment.invoiceId.toString());
    if (invoice) {
      const restoredPaid = Math.max(0, (invoice.paidAmount || 0) - payment.amount);
      const restoredOutstanding = Math.min(invoice.totalPayable, invoice.outstandingAmount + payment.amount);
      const restoredStatus = restoredPaid === 0 ? 'UNPAID' : 'PARTIAL';

      await this.feeRepo.updateInvoice(invoice._id.toString(), {
        paidAmount: restoredPaid,
        outstandingAmount: restoredOutstanding,
        status: restoredStatus,
      });

      // Update assignment installment
      const assignment = await this.feeRepo.findFeeAssignmentById(
        invoice.feeAssignmentId.toString()
      );
      if (assignment) {
        const updatedInsts = assignment.installments.map((inst) => {
          if (inst.installmentNumber === invoice.installmentNumber) {
            const instPaid = Math.max(0, (inst.paidAmount || 0) - payment.amount);
            const instStatus: AssignmentInstallmentStatus =
              instPaid === 0 ? 'UNPAID' : instPaid >= inst.netAmount ? 'PAID' : 'PARTIAL';
            return {
              ...inst,
              paidAmount: instPaid,
              status: instStatus,
            };
          }
          return inst;
        });
        await this.feeRepo.updateFeeAssignment(assignment._id.toString(), {
          installments: updatedInsts,
        });
      }
    }

    const updatedPayment = await this.feeRepo.updatePayment(paymentId, {
      status: 'REVERSED',
      reversalReason: dto.reason.trim(),
      reversedAt: new Date(),
      reversedBy: new mongoose.Types.ObjectId(reversedByUserId),
    });

    return this.toPaymentDTO(updatedPayment!);
  }

  // ---------------------------------------------------------------------------
  // 7. Defaulters
  // ---------------------------------------------------------------------------
  async getDefaulters(filter?: {
    academicYear?: string;
    className?: string;
  }): Promise<DefaulterItemDTO[]> {
    const overdueInvoices = await this.feeRepo.findDefaulterInvoices(filter);
    const today = new Date();

    return overdueInvoices.map((inv) => {
      const due = new Date(inv.dueDate);
      const diffMs = today.getTime() - due.getTime();
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        studentId: inv.studentId ? inv.studentId.toString() : '',
        admissionNumber: inv.studentAdmissionNumber,
        studentName: inv.studentName,
        parentContact: inv.parentContact || 'N/A',
        className: inv.className,
        section: inv.section,
        invoiceId: inv._id ? inv._id.toString() : '',
        invoiceNumber: inv.invoiceNumber,
        installmentName: inv.installmentName,
        outstandingAmount: inv.outstandingAmount,
        dueDate: inv.dueDate,
        daysOverdue,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Dashboard Summary
  // ---------------------------------------------------------------------------
  async getDashboardSummary(academicYear?: string): Promise<FeeDashboardSummaryDTO> {
    const metrics = await this.feeRepo.getDashboardMetrics(academicYear);
    return {
      totalExpected: metrics.totalExpected,
      totalCollected: metrics.totalCollected,
      outstandingFees: metrics.outstandingFees,
      overdueFees: metrics.overdueFees,
      totalTransactions: metrics.totalTransactions,
      collectionPercentage: metrics.collectionPercentage,
      monthlyCollection: metrics.monthlyCollection,
      classWiseCollection: metrics.classWiseCollection,
      paymentMethodBreakdown: metrics.paymentMethodBreakdown,
      recentTransactions: (metrics.recentTransactions || []).map((p: any) =>
        this.toPaymentDTO(p)
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // 9. Fee Reports
  // ---------------------------------------------------------------------------
  async generateReport(
    reportType: FeeReportType,
    filter?: {
      academicYear?: string;
      className?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FeeReportDTO> {
    const generatedAt = new Date().toISOString();

    if (reportType === 'COLLECTION_SUMMARY') {
      const payments = await this.feeRepo.findPayments({
        academicYear: filter?.academicYear,
        className: filter?.className,
        startDate: filter?.startDate,
        endDate: filter?.endDate,
      });

      const rows = payments.map((p) => ({
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate || '',
        studentName: p.studentName,
        admissionNumber: p.studentAdmissionNumber,
        className: p.className,
        section: p.section,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference || '-',
        status: p.status,
      }));

      const totalAmount = rows
        .filter((r) => r.status === 'SUCCESS')
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        reportType,
        generatedAt,
        filters: filter,
        headers: [
          'Receipt No',
          'Date',
          'Student Name',
          'Admission No',
          'Class',
          'Section',
          'Amount',
          'Method',
          'Reference',
          'Status',
        ],
        rows,
        summary: {
          totalTransactions: rows.length,
          completedCount: rows.filter((r) => r.status === 'SUCCESS').length,
          totalAmountCollected: totalAmount,
        },
      };
    }

    if (reportType === 'CLASS_WISE') {
      const metrics = await this.feeRepo.getDashboardMetrics(filter?.academicYear);
      const rows = (metrics.classWiseCollection || []).map((c: any) => ({
        className: c.className,
        expected: c.expected,
        collected: c.collected,
        outstanding: c.outstanding,
        percentage: c.percentage,
      }));

      return {
        reportType,
        generatedAt,
        filters: filter,
        headers: ['Class Name', 'Expected Fees', 'Collected Fees', 'Outstanding Fees', 'Collection %'],
        rows,
        summary: {
          totalClasses: rows.length,
          totalExpected: metrics.totalExpected,
          totalCollected: metrics.totalCollected,
          totalOutstanding: metrics.outstandingFees,
        },
      };
    }

    if (reportType === 'CATEGORY_WISE') {
      const structures = await this.feeRepo.findStructures(
        filter?.academicYear ? { academicYear: filter.academicYear } : undefined
      );

      const categoryMap = new Map<string, { categoryName: string; totalConfigured: number }>();
      for (const s of structures) {
        for (const cat of s.categories) {
          const existing = categoryMap.get(cat.categoryName) || {
            categoryName: cat.categoryName,
            totalConfigured: 0,
          };
          existing.totalConfigured += cat.amount;
          categoryMap.set(cat.categoryName, existing);
        }
      }

      const rows = Array.from(categoryMap.values()).map((c) => ({
        categoryName: c.categoryName,
        totalAmount: c.totalConfigured,
      }));

      return {
        reportType,
        generatedAt,
        filters: filter,
        headers: ['Fee Category', 'Total Configured Amount'],
        rows,
        summary: {
          totalCategories: rows.length,
        },
      };
    }

    if (reportType === 'DEFAULTERS') {
      const defaulters = await this.getDefaulters(filter);
      const rows = defaulters.map((d) => ({
        studentName: d.studentName,
        admissionNumber: d.admissionNumber,
        className: d.className,
        section: d.section,
        invoiceNumber: d.invoiceNumber,
        dueDate: d.dueDate,
        daysOverdue: d.daysOverdue,
        outstandingAmount: d.outstandingAmount,
        parentContact: d.parentContact,
      }));

      const totalOverdue = rows.reduce((sum, r) => sum + r.outstandingAmount, 0);

      return {
        reportType,
        generatedAt,
        filters: filter,
        headers: [
          'Student Name',
          'Admission No',
          'Class',
          'Section',
          'Invoice No',
          'Due Date',
          'Days Overdue',
          'Outstanding Amount',
          'Parent Contact',
        ],
        rows,
        summary: {
          totalDefaulters: rows.length,
          totalOverdueAmount: totalOverdue,
        },
      };
    }

    // Default: PAYMENT_METHODS
    const metrics = await this.feeRepo.getDashboardMetrics(filter?.academicYear);
    const rows = (metrics.paymentMethodBreakdown || []).map((m: any) => ({
      method: m.method,
      amount: m.amount,
      count: m.count,
    }));

    return {
      reportType,
      generatedAt,
      filters: filter,
      headers: ['Payment Method', 'Amount Collected', 'Transaction Count'],
      rows,
      summary: {
        totalMethods: rows.length,
        totalAmount: metrics.totalCollected,
      },
    };
  }
}
