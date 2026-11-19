import { Request, Response, NextFunction } from 'express';
import { AdminFeeService } from '../services/AdminFeeService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';

export class AdminFeeController {
  constructor(private readonly feeService: AdminFeeService) {}

  // 1. Dashboard
  getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear } = req.query;
      const result = await this.feeService.getDashboardSummary(
        academicYear ? String(academicYear) : undefined
      );
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee dashboard metrics retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 2. Categories
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const result = await this.feeService.getCategories(status ? String(status) : undefined);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee categories retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getCategoryById(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee category retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getCategoryUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getCategoryUsage(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee category usage retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.feeService.createCategory(req.body);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fee category created successfully.'));
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.updateCategory(id, req.body);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee category updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 3. Concessions
  getConcessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const result = await this.feeService.getConcessions(status ? String(status) : undefined);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee concessions retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  createConcession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.feeService.createConcession(req.body);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fee concession created successfully.'));
    } catch (error) {
      next(error);
    }
  };

  updateConcession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.updateConcession(id, req.body);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee concession updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 4. Structures
  getStructures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, className, status } = req.query;
      const result = await this.feeService.getStructures({
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
        status: status ? String(status) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee structures retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getStructureById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getStructureById(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee structure details retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  createStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.feeService.createStructure(req.body);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fee structure created successfully.'));
    } catch (error) {
      next(error);
    }
  };

  updateStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.updateStructure(id, req.body);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee structure updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  publishStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.publishStructure(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };

  getStructureUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getStructureUsage(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee structure usage retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  duplicateStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { targetAcademicYear, name } = req.body;
      const result = await this.feeService.duplicateStructure(id, targetAcademicYear, name);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fee structure duplicated successfully for target academic year.'));
    } catch (error) {
      next(error);
    }
  };

  deleteStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.deleteStructure(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };

  // 5. Fee Assignments
  getFeeAssignments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, className, section, studentId } = req.query;
      const result = await this.feeService.getFeeAssignments({
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        studentId: studentId ? String(studentId) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Student fee assignments retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  assignFees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated admin session required.');
      }
      const result = await this.feeService.assignFees(req.user.sub, req.body);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fees assigned to students successfully.'));
    } catch (error) {
      next(error);
    }
  };

  cancelFeeAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.cancelFeeAssignment(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee assignment cancelled successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 6. Invoices
  getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, className, section, status, studentId, search } = req.query;
      const result = await this.feeService.getInvoices({
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        status: status ? String(status) : undefined,
        studentId: studentId ? String(studentId) : undefined,
        search: search ? String(search) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee invoices retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getInvoiceById(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee invoice details retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getInvoicePayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getInvoicePayments(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Invoice payment history retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  generateInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.feeService.generateInvoices(req.body);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fee invoices generated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 7. Payments / Collection & Ledger
  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        academicYear,
        className,
        section,
        invoiceNumber,
        paymentMethod,
        status,
        startDate,
        endDate,
        search,
      } = req.query;
      const result = await this.feeService.getPayments({
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        invoiceNumber: invoiceNumber ? String(invoiceNumber) : undefined,
        paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        search: search ? String(search) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Payment transactions retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.feeService.getPaymentById(id);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Payment receipt retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getCollectionSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear } = req.query;
      const result = await this.feeService.getCollectionSummary(
        academicYear ? String(academicYear) : undefined
      );
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee collection summary retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getLedgerEntries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, studentId, transactionType, status } = req.query;
      const result = await this.feeService.getLedgerEntries({
        academicYear: academicYear ? String(academicYear) : undefined,
        studentId: studentId ? String(studentId) : undefined,
        transactionType: transactionType ? String(transactionType) : undefined,
        status: status ? String(status) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Financial fee ledger entries retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  collectFee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated admin session required.');
      }
      const recordedByName = req.user.fullName || 'School Admin';
      const result = await this.feeService.collectFee(req.user.sub, recordedByName, req.body);
      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Fee payment collected successfully. Receipt generated.'));
    } catch (error) {
      next(error);
    }
  };

  reversePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated admin session required.');
      }
      const { id } = req.params;
      const result = await this.feeService.reversePayment(id, req.user.sub, req.body);
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Payment reversed and balance restored successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 8. Defaulters
  getDefaulters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, className } = req.query;
      const result = await this.feeService.getDefaulters({
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee defaulters retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // 9. Reports
  getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, academicYear, className, startDate, endDate } = req.query;
      const reportType = (type as any) || 'COLLECTION_SUMMARY';
      const result = await this.feeService.generateReport(reportType, {
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Fee report generated successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
