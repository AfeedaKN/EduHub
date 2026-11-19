import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.config';
import { TokenService } from '../../src/modules/auth/services/TokenService';
import { UserRole } from '../../src/modules/auth/dtos/auth.dto';
import { UserModel } from '../../src/modules/auth/models/User.model';
import { StudentModel } from '../../src/modules/parent/models/Student.model';
import { FeeCategoryModel } from '../../src/modules/admin/models/FeeCategory.model';
import { FeeConcessionModel } from '../../src/modules/admin/models/FeeConcession.model';
import { FeeStructureModel } from '../../src/modules/admin/models/FeeStructure.model';
import { StudentFeeAssignmentModel } from '../../src/modules/admin/models/StudentFeeAssignment.model';
import { FeeInvoiceModel } from '../../src/modules/admin/models/FeeInvoice.model';
import { FeePaymentModel } from '../../src/modules/admin/models/FeePayment.model';

describe('Admin Fees & Payments Management Integration Tests', () => {
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
  const parentUserId = new mongoose.Types.ObjectId().toString();

  const adminToken = tokenService.generateAccessToken({
    sub: adminUserId,
    email: 'admin.fees.test@eduhub.school',
    role: UserRole.MANAGEMENT,
    fullName: 'Fee Admin Director',
  });

  const parentToken = tokenService.generateAccessToken({
    sub: parentUserId,
    email: 'parent.fees.test@eduhub.school',
    role: UserRole.PARENT,
    fullName: 'Parent Fee Tester',
  });

  let studentId: string;
  let categoryId: string;
  let concessionId: string;
  let structureId: string;
  let assignmentId: string;
  let invoiceId: string;
  let paymentId: string;

  beforeAll(async () => {
    // Clean up any test fixtures
    await UserModel.deleteMany({
      email: { $in: ['admin.fees.test@eduhub.school', 'parent.fees.test@eduhub.school'] },
    });
    await FeeCategoryModel.deleteMany({ code: { $in: ['TUIT_TEST', 'LAB_TEST', 'DUP_TEST', 'TEMP_LAB'] } });
    await FeeConcessionModel.deleteMany({ code: { $in: ['SIBLING10_TEST', 'SCHOLAR_TEST'] } });
    await FeeStructureModel.deleteMany({
      name: {
        $in: [
          'Class 10 Standard Fee 2026',
          'Invalid Structure Test',
          'Class 10 Standard Fee 2027-2028',
        ],
      },
    });
    await StudentFeeAssignmentModel.deleteMany({ admissionNumber: 'FEE-STU-001' });
    await FeeInvoiceModel.deleteMany({
      $or: [{ studentAdmissionNumber: 'FEE-STU-001' }, { admissionNumber: 'FEE-STU-001' }],
    });
    await FeePaymentModel.deleteMany({ studentId: { $exists: true } });
    await StudentModel.deleteMany({ studentId: 'FEE-STU-001' });

    // Seed admin user
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(adminUserId),
      email: 'admin.fees.test@eduhub.school',
      phone: '+91 98765 00001',
      passwordHash: 'dummyhash',
      role: UserRole.MANAGEMENT,
      fullName: 'Fee Admin Director',
      status: 'ACTIVE',
    });

    // Seed parent & active enrolled student
    await UserModel.create({
      _id: new mongoose.Types.ObjectId(parentUserId),
      email: 'parent.fees.test@eduhub.school',
      phone: '+91 98765 00002',
      passwordHash: 'dummyhash',
      role: UserRole.PARENT,
      fullName: 'Parent Fee Tester',
      status: 'ACTIVE',
    });

    const studentDoc = await StudentModel.create({
      parentId: new mongoose.Types.ObjectId(parentUserId),
      fullName: 'Aarav Sharma',
      studentId: 'FEE-STU-001',
      rollNumber: '10',
      grade: 'Class 10',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    });
    studentId = studentDoc._id.toString();
  });

  afterAll(async () => {
    // Cleanup
    await UserModel.deleteMany({
      email: { $in: ['admin.fees.test@eduhub.school', 'parent.fees.test@eduhub.school'] },
    });
    await FeeCategoryModel.deleteMany({ code: { $in: ['TUIT_TEST', 'LAB_TEST', 'DUP_TEST', 'TEMP_LAB'] } });
    await FeeConcessionModel.deleteMany({ code: { $in: ['SIBLING10_TEST', 'SCHOLAR_TEST'] } });
    await FeeStructureModel.deleteMany({
      name: {
        $in: [
          'Class 10 Standard Fee 2026',
          'Invalid Structure Test',
          'Class 10 Standard Fee 2027-2028',
        ],
      },
    });
    await StudentFeeAssignmentModel.deleteMany({ admissionNumber: 'FEE-STU-001' });
    await FeeInvoiceModel.deleteMany({
      $or: [{ studentAdmissionNumber: 'FEE-STU-001' }, { admissionNumber: 'FEE-STU-001' }],
    });
    await StudentModel.deleteMany({ studentId: 'FEE-STU-001' });
  });

  describe('1. Access Control', () => {
    it('should reject unauthorized access without token', async () => {
      const res = await request(app).get('/api/v1/admin/fees/dashboard');
      expect(res.status).toBe(401);
    });

    it('should reject access for non-admin roles', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/dashboard')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Fee Category Management', () => {
    it('should create a valid fee category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tuition Fee Test',
          code: 'TUIT_TEST',
          categoryType: 'ACADEMIC',
          feeNature: 'RECURRING',
          description: 'Standard academic tuition fee',
          isMandatory: true,
          isRefundable: false,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Tuition Fee Test');
      expect(res.body.data.code).toBe('TUIT_TEST');
      expect(res.body.data.isMandatory).toBe(true);
      expect(res.body.data.isRefundable).toBe(false);
      categoryId = res.body.data.id;
    });

    it('should reject duplicate category name or code', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tuition Fee Test',
          code: 'TUIT_TEST',
          categoryType: 'ACADEMIC',
          feeNature: 'RECURRING',
        });

      expect(res.status).toBe(409);
    });

    it('should list all fee categories', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.code === 'TUIT_TEST')).toBe(true);
    });

    it('should get a category by id', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/fees/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(categoryId);
      expect(res.body.data.name).toBe('Tuition Fee Test');
    });

    it('should check category usage when no structure references it', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/fees/categories/${categoryId}/usage`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isUsed).toBe(false);
      expect(res.body.data.activeStructuresCount).toBe(0);
      expect(res.body.data.structures).toHaveLength(0);
    });

    it('should allow updating and deactivating an unused category', async () => {
      const tempRes = await request(app)
        .post('/api/v1/admin/fees/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temporary Lab Fee',
          code: 'TEMP_LAB',
          categoryType: 'FACILITY',
          feeNature: 'ONE_TIME',
          isMandatory: false,
          isRefundable: true,
          status: 'ACTIVE',
        });
      expect(tempRes.status).toBe(201);
      const tempId = tempRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/v1/admin/fees/categories/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INACTIVE',
          description: 'Updated temporary lab fee',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.status).toBe('INACTIVE');
      expect(updateRes.body.data.description).toBe('Updated temporary lab fee');
    });
  });

  describe('3. Fee Concession Management', () => {
    it('should create a valid percentage concession', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/concessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sibling Discount Test',
          code: 'SIBLING10_TEST',
          discountType: 'PERCENTAGE',
          value: 10,
          description: '10% discount for second sibling',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('SIBLING10_TEST');
      expect(res.body.data.value).toBe(10);
      concessionId = res.body.data.id;
    });

    it('should reject concession with invalid percentage (> 100)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/concessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Discount',
          code: 'INVALID_TEST',
          discountType: 'PERCENTAGE',
          value: 150,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('4. Fee Structure Management', () => {
    it('should reject structure when category sum does not match totalAmount', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Structure Test',
          academicYear: '2026-2027',
          className: 'Class 10',
          categories: [
            {
              categoryId,
              categoryName: 'Tuition Fee Test',
              amount: 25000,
            },
          ],
          totalAmount: 30000, // mismatch
          paymentFrequency: 'ANNUAL',
          installments: [
            {
              installmentNumber: 1,
              name: 'Full Payment',
              amount: 30000,
              dueDate: '2026-07-31',
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should reject structure when installment sum does not match totalAmount', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Structure Test',
          academicYear: '2026-2027',
          className: 'Class 10',
          categories: [
            {
              categoryId,
              categoryName: 'Tuition Fee Test',
              amount: 30000,
            },
          ],
          totalAmount: 30000,
          paymentFrequency: 'TERMLY',
          installments: [
            {
              installmentNumber: 1,
              name: 'Term 1',
              amount: 10000,
              dueDate: '2026-07-31',
            },
            {
              installmentNumber: 2,
              name: 'Term 2',
              amount: 10000,
              dueDate: '2026-11-30',
            },
            // missing 10,000 to reach 30,000
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should create a valid Fee Structure with matching mathematical totals', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Class 10 Standard Fee 2026',
          academicYear: '2026-2027',
          className: 'Class 10',
          categories: [
            {
              categoryId,
              categoryName: 'Tuition Fee Test',
              amount: 20000,
            },
          ],
          totalAmount: 20000,
          paymentFrequency: 'TERM',
          installments: [
            {
              installmentNumber: 1,
              name: 'Term 1 Fee',
              amount: 10000,
              dueDate: '2026-07-31',
            },
            {
              installmentNumber: 2,
              name: 'Term 2 Fee',
              amount: 10000,
              dueDate: '2026-11-30',
            },
          ],
          lateFeeRule: {
            enabled: true,
            gracePeriodDays: 7,
            feeType: 'DAILY',
            amount: 50,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAmount).toBe(20000);
      expect(res.body.data.installments.length).toBe(2);
      structureId = res.body.data.id;
    });

    it('should prevent deactivating category when referenced by an active fee structure', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/fees/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INACTIVE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorMsg = res.body.error?.message || res.body.message;
      expect(errorMsg).toMatch(/Cannot deactivate (fee )?category/i);

      // Verify category usage endpoint reflects active structure
      const usageRes = await request(app)
        .get(`/api/v1/admin/fees/categories/${categoryId}/usage`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.data.isUsed).toBe(true);
      expect(usageRes.body.data.activeStructuresCount).toBe(1);
      expect(usageRes.body.data.structures[0].name).toBe('Class 10 Standard Fee 2026');
    });

    it('should reject fee structure with duplicate categories', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Categories Structure',
          academicYear: '2026-2027',
          className: 'Class 10',
          categories: [
            { categoryId, categoryName: 'Tuition Fee Test', amount: 10000 },
            { categoryId, categoryName: 'Tuition Fee Test 2', amount: 10000 },
          ],
          totalAmount: 20000,
          paymentFrequency: 'ANNUAL',
          installments: [
            { installmentNumber: 1, name: 'Full Payment', amount: 20000, dueDate: '2026-07-31' },
          ],
        });

      expect(res.status).toBe(400);
      const errorMsg = res.body.error?.message || res.body.message;
      expect(errorMsg).toMatch(/Duplicate fee categories/i);
    });

    it('should get fee structure usage', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/fees/structures/${structureId}/usage`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(structureId);
      expect(res.body.data.canEditFinancials).toBe(true);
    });

    it('should duplicate fee structure for another academic year', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/fees/structures/${structureId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetAcademicYear: '2027-2028',
          name: 'Class 10 Standard Fee 2027-2028',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.academicYear).toBe('2027-2028');
      expect(res.body.data.name).toBe('Class 10 Standard Fee 2027-2028');
      expect(res.body.data.totalAmount).toBe(20000);
    });
    it('should update fee structure className when no financial records exist', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/fees/structures/${structureId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          className: 'Class 10',
          section: 'A',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.className).toBe('Class 10');
      expect(res.body.data.section).toBe('A');
    });

    it('should safely delete a fee structure when no assignments or invoices reference it', async () => {
      // Create a temporary structure with 0 assignments
      const createRes = await request(app)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temporary Deletable Structure',
          academicYear: '2026-2027',
          className: 'Grade 9',
          categories: [
            { categoryId, categoryName: 'Tuition Fee Test', amount: 5000 },
          ],
          totalAmount: 5000,
          paymentFrequency: 'ANNUAL',
          installments: [
            { installmentNumber: 1, name: 'Full Payment', amount: 5000, dueDate: '2026-07-31' },
          ],
        });

      expect(createRes.status).toBe(201);
      const tempId = createRes.body.data.id;

      // Delete the structure
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/fees/structures/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.success).toBe(true);

      // Verify it is gone
      const checkRes = await request(app)
        .get(`/api/v1/admin/fees/structures/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).toBe(404);
    });
  });

  describe('5. Student Fee Assignment', () => {
    it('should assign fee structure with concession to active student', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          feeStructureId: structureId,
          academicYear: '2026-2027',
          studentIds: [studentId],
          concessionId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedCount).toBe(1);
      expect(res.body.data.assignments.length).toBe(1);

      const assignment = res.body.data.assignments[0];
      expect(assignment.baseAmount).toBe(20000);
      expect(assignment.concessionAmount).toBe(2000); // 10% of 20000
      expect(assignment.netPayable).toBe(18000);
      expect(assignment.installments.length).toBe(2);
      expect(assignment.installments[0].netAmount).toBe(9000); // 10000 - 1000
      assignmentId = assignment.id;
    });

    it('should reject duplicate assignment for the same student, class, and year', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          feeStructureId: structureId,
          academicYear: '2026-2027',
          studentIds: [studentId],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('6. Fee Invoice Generation', () => {
    it('should generate invoice for installment 1', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYear: '2026-2027',
          className: 'Class 10',
          installmentNumber: 1,
          studentIds: [studentId],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.generatedCount).toBe(1);
      expect(res.body.data.invoices.length).toBe(1);

      const inv = res.body.data.invoices[0];
      expect(inv.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(inv.totalPayable).toBe(9000);
      expect(inv.outstandingAmount).toBe(9000);
      expect(inv.paidAmount).toBe(0);
      expect(inv.status).toBe('UNPAID');
      invoiceId = inv.id;
    });

    it('should not recreate duplicate invoice for already invoiced installment', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYear: '2026-2027',
          className: 'Class 10',
          installmentNumber: 1,
          studentIds: [studentId],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedCount).toBe(0);
    });

    it('should list invoices with search and filters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/invoices?className=Class 10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should prevent modifying financial terms of a fee structure after invoices have been issued', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/fees/structures/${structureId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          totalAmount: 25000,
          categories: [
            { categoryId, categoryName: 'Tuition Fee Test', amount: 25000 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorMsg = res.body.error?.message || res.body.message;
      expect(errorMsg).toMatch(/Cannot modify financial terms/i);
    });

    it('should allow updating non-financial attributes (e.g. description) when invoices exist', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/fees/structures/${structureId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description for audited structure',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated description for audited structure');
    });
  });

  describe('7. Fee Collection & Payment Recording', () => {
    it('should reject payment exceeding outstanding balance', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/payments/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 15000, // outstanding is 9000
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
    });

    it('should successfully record partial payment and update balances', async () => {
      const res = await request(app)
        .post('/api/v1/admin/fees/payments/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 5000,
          paymentMethod: 'UPI',
          transactionReference: 'UPI-TXN-9876543210',
          remarks: 'First partial installment payment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receiptNumber).toMatch(/^REC-\d{4}-\d{4}$/);
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.status).toBe('SUCCESS');
      paymentId = res.body.data.id;

      // Verify invoice updated
      const invRes = await request(app)
        .get(`/api/v1/admin/fees/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(invRes.status).toBe(200);
      expect(invRes.body.data.paidAmount).toBe(5000);
      expect(invRes.body.data.outstandingAmount).toBe(4000);
      expect(invRes.body.data.status).toBe('PARTIAL');
    });

    it('should list payment transactions in the ledger', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((p: any) => p.id === paymentId)).toBe(true);
    });
  });

  describe('8. Payment Reversal & Balance Restoration', () => {
    it('should reject payment reversal without auditable reason', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/fees/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: '',
        });

      expect(res.status).toBe(400);
    });

    it('should reverse payment and restore invoice and installment balances', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/fees/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Bounced UPI transaction confirmation check',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REVERSED');
      expect(res.body.data.reversalReason).toBe('Bounced UPI transaction confirmation check');

      // Verify invoice balance restored
      const invRes = await request(app)
        .get(`/api/v1/admin/fees/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(invRes.status).toBe(200);
      expect(invRes.body.data.paidAmount).toBe(0);
      expect(invRes.body.data.outstandingAmount).toBe(9000);
      expect(invRes.body.data.status).toBe('UNPAID');
    });
  });

  describe('9. Defaulters, Dashboard & Reports', () => {
    it('should retrieve fee dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalExpected');
      expect(res.body.data).toHaveProperty('totalCollected');
      expect(res.body.data).toHaveProperty('outstandingFees');
      expect(res.body.data).toHaveProperty('overdueFees');
      expect(res.body.data).toHaveProperty('totalTransactions');
      expect(res.body.data).toHaveProperty('collectionPercentage');
      expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
    });

    it('should retrieve defaulters list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/defaulters')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should generate fee reports', async () => {
      const res = await request(app)
        .get('/api/v1/admin/fees/reports?type=COLLECTION_SUMMARY')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportType', 'COLLECTION_SUMMARY');
      expect(Array.isArray(res.body.data.rows)).toBe(true);
    });
  });

  describe('10. Invoice Payments & Assignment Cancellation', () => {
    it('should retrieve payment transactions for a specific invoice', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/fees/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should prevent cancelling assignment if payments have been recorded', async () => {
      // Record a new payment
      const payRes = await request(app)
        .post('/api/v1/admin/fees/payments/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 2000,
          paymentMethod: 'CASH',
        });
      expect(payRes.status).toBe(201);
      const newPaymentId = payRes.body.data.id;

      // Attempt to cancel assignment
      const cancelRes = await request(app)
        .put(`/api/v1/admin/fees/assignments/${assignmentId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cancelRes.status).toBe(400);

      // Clean up payment so we can test cancellation next
      await request(app)
        .post(`/api/v1/admin/fees/payments/${newPaymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test reset' });
    });

    it('should successfully cancel fee assignment when no payments exist', async () => {
      const cancelRes = await request(app)
        .put(`/api/v1/admin/fees/assignments/${assignmentId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Verify invoice is cancelled
      const invDoc = await FeeInvoiceModel.findById(invoiceId);
      expect(invDoc?.status).toBe('CANCELLED');
    });
  });

  describe('11. Parent Portal Fee Invoices & Access Isolation', () => {
    let secondParentUserId: string;
    let secondParentToken: string;
    let unapprovedParentUserId: string;
    let unapprovedParentToken: string;

    let testChild1Id: string;
    let testChild2Id: string;
    let testAssignment1Id: string;
    let testInvoice1Id: string;

    beforeAll(async () => {
      secondParentUserId = new mongoose.Types.ObjectId().toString();
      secondParentToken = tokenService.generateAccessToken({
        sub: secondParentUserId,
        email: 'other.parent@eduhub.school',
        role: UserRole.PARENT,
        fullName: 'Unrelated Parent',
      });

      await UserModel.create({
        _id: new mongoose.Types.ObjectId(secondParentUserId),
        email: 'other.parent@eduhub.school',
        phone: '+91 98765 00003',
        passwordHash: 'dummyhash',
        role: UserRole.PARENT,
        fullName: 'Unrelated Parent',
        status: 'ACTIVE',
      });

      // Third parent with no enrolled children (pending registration only)
      unapprovedParentUserId = new mongoose.Types.ObjectId().toString();
      unapprovedParentToken = tokenService.generateAccessToken({
        sub: unapprovedParentUserId,
        email: 'unapproved.parent@eduhub.school',
        role: UserRole.PARENT,
        fullName: 'Unapproved Parent',
      });

      await UserModel.create({
        _id: new mongoose.Types.ObjectId(unapprovedParentUserId),
        email: 'unapproved.parent@eduhub.school',
        phone: '+91 98765 00004',
        passwordHash: 'dummyhash',
        role: UserRole.PARENT,
        fullName: 'Unapproved Parent',
        status: 'ACTIVE',
      });

      // Create pending registration request for unapproved parent
      await mongoose.model('StudentRegistrationRequest').create({
        parentId: new mongoose.Types.ObjectId(unapprovedParentUserId),
        studentFullName: 'Aarav Sharma',
        dateOfBirth: new Date('2018-05-10'),
        gender: 'MALE',
        requestedGrade: 'Grade 3',
        academicYear: '2026-2027',
        parentRelationship: 'FATHER',
        status: 'PENDING',
      });

      // Set up Child 1 for primary parent: Active enrolled with fee assignment and invoice
      const child1Doc = await StudentModel.create({
        parentId: new mongoose.Types.ObjectId(parentUserId),
        fullName: 'Ayan Test Child',
        studentId: 'STU-TEST-001',
        grade: 'Class 10',
        section: 'A',
        classTeacher: 'Teacher Test',
        status: 'ACTIVE',
        academicYear: '2026-2027',
      });
      testChild1Id = child1Doc._id.toString();

      // Set up Child 2 for primary parent: Active enrolled WITHOUT fee assignment
      const child2Doc = await StudentModel.create({
        parentId: new mongoose.Types.ObjectId(parentUserId),
        fullName: 'Zoya Test Child',
        studentId: 'STU-TEST-002',
        grade: 'Class 8',
        section: 'B',
        classTeacher: 'Teacher Two',
        status: 'ACTIVE',
        academicYear: '2026-2027',
      });
      testChild2Id = child2Doc._id.toString();

      // Create assignment for Child 1
      const asgnDoc = await StudentFeeAssignmentModel.create({
        studentId: new mongoose.Types.ObjectId(testChild1Id),
        admissionNumber: 'STU-TEST-001',
        studentName: 'Ayan Test Child',
        className: 'Class 10',
        section: 'A',
        academicYear: '2026-2027',
        feeStructureId: new mongoose.Types.ObjectId(structureId),
        feeStructureName: 'Class 10 Standard Fee 2026',
        baseAmount: 10000,
        concessionAmount: 1000,
        netPayable: 9000,
        installments: [
          {
            installmentNumber: 1,
            name: 'Term 1 Tuition',
            baseAmount: 5000,
            concessionAmount: 500,
            netAmount: 4500,
            dueDate: '2026-08-31',
            paidAmount: 0,
            status: 'UNPAID',
          },
          {
            installmentNumber: 2,
            name: 'Term 2 Tuition',
            baseAmount: 5000,
            concessionAmount: 500,
            netAmount: 4500,
            dueDate: '2026-12-31',
            paidAmount: 0,
            status: 'UNPAID',
          },
        ],
        status: 'ACTIVE',
      });
      testAssignment1Id = asgnDoc._id.toString();

      // Create an invoice for Child 1
      const invDoc = await FeeInvoiceModel.create({
        invoiceNumber: 'INV-2026-TEST1',
        studentId: new mongoose.Types.ObjectId(testChild1Id),
        studentAdmissionNumber: 'STU-TEST-001',
        studentName: 'Ayan Test Child',
        parentId: new mongoose.Types.ObjectId(parentUserId),
        parentName: 'Parent Fee Tester',
        parentContact: '+91 98765 00002',
        className: 'Class 10',
        section: 'A',
        academicYear: '2026-2027',
        feeAssignmentId: new mongoose.Types.ObjectId(testAssignment1Id),
        feeStructureId: new mongoose.Types.ObjectId(structureId),
        installmentNumber: 1,
        installmentName: 'Term 1 Tuition',
        items: [
          { categoryName: 'Tuition Fee', amount: 4500 },
          { categoryName: 'Computer Lab Fee', amount: 500 },
        ],
        subtotal: 5000,
        concessionAmount: 500,
        lateFeeAmount: 0,
        totalPayable: 4500,
        paidAmount: 0,
        outstandingAmount: 4500,
        issueDate: '2026-06-01',
        dueDate: '2027-03-31',
        status: 'UNPAID',
      });
      testInvoice1Id = invDoc._id.toString();
    });

    afterAll(async () => {
      await UserModel.deleteMany({
        email: { $in: ['other.parent@eduhub.school', 'unapproved.parent@eduhub.school'] },
      });
      await StudentModel.deleteMany({
        studentId: { $in: ['STU-TEST-001', 'STU-TEST-002'] },
      });
      await mongoose.model('StudentRegistrationRequest').deleteMany({
        parentId: new mongoose.Types.ObjectId(unapprovedParentUserId),
      });
      await StudentFeeAssignmentModel.deleteMany({
        studentId: new mongoose.Types.ObjectId(testChild1Id),
      });
      await FeeInvoiceModel.deleteMany({
        invoiceNumber: 'INV-2026-TEST1',
      });
      await FeePaymentModel.deleteMany({
        invoiceId: new mongoose.Types.ObjectId(testInvoice1Id),
      });
    });

    it('Scenario 1: Enrolled student with assigned fee structure and invoice', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/fees/invoices?studentId=${testChild1Id}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasEnrolledChildren).toBe(true);
      expect(res.body.data.assignment).not.toBeNull();
      expect(res.body.data.assignment.studentName).toBe('Ayan Test Child');
      expect(res.body.data.assignment.feeStructureName).toBe('Class 10 Standard Fee 2026');
      expect(res.body.data.invoices.length).toBeGreaterThan(0);
      expect(res.body.data.invoices[0].invoiceNumber).toBe('INV-2026-TEST1');
      expect(res.body.data.summary.totalFees).toBeGreaterThan(0);
    });

    it('Scenario 2: Enrolled student without an assigned fee structure', async () => {
      const res = await request(app)
        .get(`/api/v1/parent/fees/invoices?studentId=${testChild2Id}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasEnrolledChildren).toBe(true);
      expect(res.body.data.assignment).toBeNull();
      expect(res.body.data.invoices).toHaveLength(0);
      expect(res.body.data.summary.totalFees).toBe(0);
      expect(res.body.data.summary.outstandingBalance).toBe(0);
    });

    it('Scenario 3: Parent with multiple children (selector support)', async () => {
      const res = await request(app)
        .get('/api/v1/parent/fees/invoices')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasEnrolledChildren).toBe(true);
      // Both test children are in the returned children list
      expect(res.body.data.children.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.children.some((c: any) => c.studentId === 'STU-TEST-001')).toBe(true);
      expect(res.body.data.children.some((c: any) => c.studentId === 'STU-TEST-002')).toBe(true);
    });

    it('Scenario 4: Unauthorized parent attempting to access another parent’s student fees', async () => {
      // Attempting to filter by another parent's child ID
      const queryRes = await request(app)
        .get(`/api/v1/parent/fees/invoices?studentId=${testChild1Id}`)
        .set('Authorization', `Bearer ${secondParentToken}`);

      expect(queryRes.status).toBe(403);

      // Attempting to directly fetch another parent's invoice details
      const detailRes = await request(app)
        .get(`/api/v1/parent/fees/invoices/${testInvoice1Id}`)
        .set('Authorization', `Bearer ${secondParentToken}`);

      expect(detailRes.status).toBe(403);
    });

    it('Scenario 5: Unpaid and partially paid invoice verification', async () => {
      // Verify initial UNPAID state
      const initialRes = await request(app)
        .get(`/api/v1/parent/fees/invoices/${testInvoice1Id}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(initialRes.status).toBe(200);
      expect(initialRes.body.data.status).toBe('UNPAID');
      expect(initialRes.body.data.paidAmount).toBe(0);
      expect(initialRes.body.data.outstandingAmount).toBe(4500);
      expect(initialRes.body.data.items.length).toBe(2);

      // Record a partial payment of 2000 against this invoice via admin
      const payRes = await request(app)
        .post('/api/v1/admin/fees/payments/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: testInvoice1Id,
          amount: 2000,
          paymentMethod: 'UPI',
          transactionReference: 'UPI-PARENT-TEST-01',
          remarks: 'Partial payment for Term 1',
        });

      expect(payRes.status).toBe(201);

      // Re-fetch invoice as parent to verify PARTIAL status and payment history
      const partialRes = await request(app)
        .get(`/api/v1/parent/fees/invoices/${testInvoice1Id}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(partialRes.status).toBe(200);
      expect(partialRes.body.data.status).toBe('PARTIAL');
      expect(partialRes.body.data.paidAmount).toBe(2000);
      expect(partialRes.body.data.outstandingAmount).toBe(2500);
      expect(partialRes.body.data.payments).toHaveLength(1);
      expect(partialRes.body.data.payments[0].receiptNumber).toMatch(/^REC-/);
      expect(partialRes.body.data.payments[0].amount).toBe(2000);
      expect(partialRes.body.data.payments[0].status).toBe('SUCCESS');
    });

    it('Scenario 6: Parent with no officially enrolled children (admission pending)', async () => {
      const res = await request(app)
        .get('/api/v1/parent/fees/invoices')
        .set('Authorization', `Bearer ${unapprovedParentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasEnrolledChildren).toBe(false);
      expect(res.body.data.registrationRequestsCount).toBe(1);
      expect(res.body.data.invoices).toHaveLength(0);
    });

    it('Scenario 7: Guarded structure deletion should reject deletion when active assignments/invoices exist', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/fees/structures/${structureId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(400);
      const errorMsg = deleteRes.body.error?.message || deleteRes.body.message;
      expect(errorMsg).toMatch(/active financial records reference it/i);
      expect(errorMsg).toMatch(/deactivate or archive this fee structure instead/i);

      // Verify that deactivating the structure succeeds
      const deactRes = await request(app)
        .put(`/api/v1/admin/fees/structures/${structureId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' });

      expect(deactRes.status).toBe(200);
      expect(deactRes.body.data.status).toBe('INACTIVE');
    });
  });
});
