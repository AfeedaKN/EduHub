import { IAdminAttendanceRepository } from '../repositories/AdminAttendanceRepository';
import {
  AdminAttendanceSummaryDTO,
  AdminDailyRegisterResponseDTO,
  AdminClassOverviewItemDTO,
  AdminSubmissionMonitoringItemDTO,
  AdminMonthlyReportResponseDTO,
  AdminLowAttendanceItemDTO,
  AdminStudentAttendanceHistoryDTO,
  AdminAttendanceCorrectionDTO,
  AdminDailyRegisterFilterDTO,
  AdminMonthlyReportFilterDTO,
  AdminLowAttendanceFilterDTO,
  AdminSubjectGridFilterDTO,
  AdminSubjectGridResponseDTO,
  AdminSaveSubjectAttendancePayloadDTO,
} from '../dtos/adminAttendance.dto';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../../../shared/domain/errors/AppError';
import { AttendanceStatus } from '../../teacher/models/Attendance.model';

export interface IAdminAttendanceService {
  getSummary(dateStr?: string, academicYear?: string): Promise<AdminAttendanceSummaryDTO>;
  getDailyRegister(filter: AdminDailyRegisterFilterDTO): Promise<AdminDailyRegisterResponseDTO>;
  getClassesOverview(dateStr?: string, academicYear?: string): Promise<AdminClassOverviewItemDTO[]>;
  getSubmissionsMonitoring(dateStr?: string, academicYear?: string): Promise<AdminSubmissionMonitoringItemDTO[]>;
  getMonthlyReport(filter: AdminMonthlyReportFilterDTO): Promise<AdminMonthlyReportResponseDTO>;
  getLowAttendanceReport(filter: AdminLowAttendanceFilterDTO): Promise<AdminLowAttendanceItemDTO[]>;
  getStudentHistory(studentId: string, startDate?: string, endDate?: string): Promise<AdminStudentAttendanceHistoryDTO>;
  correctAttendanceRecord(
    recordId: string,
    dto: AdminAttendanceCorrectionDTO,
    adminUserId: string
  ): Promise<any>;
  recordSingleStudentAttendance(
    studentId: string,
    dateStr: string,
    dto: AdminAttendanceCorrectionDTO,
    adminUserId: string
  ): Promise<any>;
  getSubjectWiseAttendanceGrid(filter: AdminSubjectGridFilterDTO): Promise<AdminSubjectGridResponseDTO>;
  saveSubjectWiseAttendanceBatch(
    payload: AdminSaveSubjectAttendancePayloadDTO,
    adminUserId: string,
    adminUserName: string
  ): Promise<void>;
}

export class AdminAttendanceService implements IAdminAttendanceService {
  constructor(private readonly attendanceRepo: IAdminAttendanceRepository) { }

  private validateDate(dateStr?: string): string {
    if (!dateStr || !dateStr.trim()) {
      return new Date().toISOString().split('T')[0];
    }

    const cleanDate = dateStr.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      throw new ValidationError('Date must be formatted as YYYY-MM-DD.');
    }

    const [year, month, day] = cleanDate.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new ValidationError(`Invalid calendar date: ${cleanDate}.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (cleanDate > todayStr) {
      throw new ValidationError('Attendance cannot be queried or recorded for future dates.');
    }

    return cleanDate;
  }

  private validateYearMonth(yearMonth?: string): string {
    if (!yearMonth || !yearMonth.trim()) {
      return new Date().toISOString().slice(0, 7);
    }

    const clean = yearMonth.trim();
    if (!/^\d{4}-\d{2}$/.test(clean)) {
      throw new ValidationError('Month must be formatted as YYYY-MM.');
    }

    const [year, month] = clean.split('-').map(Number);
    if (month < 1 || month > 12) {
      throw new ValidationError(`Invalid month value: ${month}. Must be between 01 and 12.`);
    }

    return clean;
  }

  async getSummary(dateStr?: string, academicYear?: string): Promise<AdminAttendanceSummaryDTO> {
    const validatedDate = this.validateDate(dateStr);
    return await this.attendanceRepo.getSummary(validatedDate, academicYear);
  }

  async getDailyRegister(filter: AdminDailyRegisterFilterDTO): Promise<AdminDailyRegisterResponseDTO> {
    const validatedDate = this.validateDate(filter.date);
    return await this.attendanceRepo.getDailyRegister({
      ...filter,
      date: validatedDate,
    });
  }

  async getClassesOverview(dateStr?: string, academicYear?: string): Promise<AdminClassOverviewItemDTO[]> {
    const validatedDate = this.validateDate(dateStr);
    return await this.attendanceRepo.getClassesOverview(validatedDate, academicYear);
  }

  async getSubmissionsMonitoring(dateStr?: string, academicYear?: string): Promise<AdminSubmissionMonitoringItemDTO[]> {
    const validatedDate = this.validateDate(dateStr);
    return await this.attendanceRepo.getSubmissionsMonitoring(validatedDate, academicYear);
  }

  async getMonthlyReport(filter: AdminMonthlyReportFilterDTO): Promise<AdminMonthlyReportResponseDTO> {
    const validatedMonth = this.validateYearMonth(filter.month);
    return await this.attendanceRepo.getMonthlyReport({
      ...filter,
      month: validatedMonth,
    });
  }

  async getLowAttendanceReport(filter: AdminLowAttendanceFilterDTO): Promise<AdminLowAttendanceItemDTO[]> {
    const threshold =
      typeof filter.threshold === 'number' && !isNaN(filter.threshold)
        ? filter.threshold
        : 75;

    if (threshold < 1 || threshold > 100) {
      throw new ValidationError('Low attendance threshold must be between 1% and 100%.');
    }

    return await this.attendanceRepo.getLowAttendanceReport({
      ...filter,
      threshold,
    });
  }

  async getStudentHistory(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AdminStudentAttendanceHistoryDTO> {
    if (!studentId || !studentId.trim()) {
      throw new ValidationError('Student ID is required.');
    }

    const result = await this.attendanceRepo.getStudentHistory(
      studentId.trim(),
      startDate,
      endDate
    );

    if (!result) {
      throw new NotFoundError(`Student with ID "${studentId}" was not found.`);
    }

    return result;
  }

  async correctAttendanceRecord(
    recordId: string,
    dto: AdminAttendanceCorrectionDTO,
    adminUserId: string
  ): Promise<any> {
    if (!recordId || !recordId.trim()) {
      throw new ValidationError('Attendance record ID is required.');
    }

    const validStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];
    if (!dto.status || !validStatuses.includes(dto.status)) {
      throw new ValidationError(
        `Invalid attendance status: "${dto.status}". Allowed values: PRESENT, ABSENT, LATE.`
      );
    }

    const remarksText = dto.remarks ? dto.remarks.trim() : dto.reason ? dto.reason.trim() : '';

    const updated = await this.attendanceRepo.correctAttendanceRecord(
      recordId.trim(),
      dto.status,
      remarksText,
      adminUserId
    );

    if (!updated) {
      throw new NotFoundError(`Attendance record with ID "${recordId}" was not found.`);
    }

    return {
      id: updated._id.toString(),
      studentId: updated.studentId.toString(),
      className: updated.className,
      section: updated.section,
      date: updated.date,
      status: updated.status,
      remarks: updated.remarks,
      updatedAt: updated.updatedAt,
    };
  }

  async recordSingleStudentAttendance(
    studentId: string,
    dateStr: string,
    dto: AdminAttendanceCorrectionDTO,
    adminUserId: string
  ): Promise<any> {
    if (!studentId || !studentId.trim()) {
      throw new ValidationError('Student ID is required.');
    }

    const validatedDate = this.validateDate(dateStr);

    const validStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];
    if (!dto.status || !validStatuses.includes(dto.status)) {
      throw new ValidationError(
        `Invalid attendance status: "${dto.status}". Allowed values: PRESENT, ABSENT, LATE.`
      );
    }

    const remarksText = dto.remarks ? dto.remarks.trim() : dto.reason ? dto.reason.trim() : 'Admin verified entry';

    const record = await this.attendanceRepo.createAttendanceRecord(
      studentId.trim(),
      validatedDate,
      dto.status,
      remarksText,
      adminUserId
    );

    return {
      id: record._id.toString(),
      studentId: record.studentId.toString(),
      className: record.className,
      section: record.section,
      date: record.date,
      status: record.status,
      remarks: record.remarks,
      updatedAt: record.updatedAt,
    };
  }

  async getSubjectWiseAttendanceGrid(
    filter: AdminSubjectGridFilterDTO
  ): Promise<AdminSubjectGridResponseDTO> {
    if (!filter.className || !filter.className.trim()) {
      throw new ValidationError('Class name is required.');
    }
    if (!filter.section || !filter.section.trim()) {
      throw new ValidationError('Section is required.');
    }
    const validatedDate = this.validateDate(filter.date);
    return await this.attendanceRepo.getSubjectWiseAttendanceGrid({
      ...filter,
      date: validatedDate,
    });
  }

  async saveSubjectWiseAttendanceBatch(
    payload: AdminSaveSubjectAttendancePayloadDTO,
    adminUserId: string,
    adminUserName: string
  ): Promise<void> {
    if (!payload.className || !payload.className.trim()) {
      throw new ValidationError('Class name is required.');
    }
    if (!payload.section || !payload.section.trim()) {
      throw new ValidationError('Section is required.');
    }
    const validatedDate = this.validateDate(payload.date);
    if (!payload.records || !Array.isArray(payload.records)) {
      throw new ValidationError('Records array is required.');
    }

    await this.attendanceRepo.saveSubjectWiseAttendanceBatch(
      {
        ...payload,
        date: validatedDate,
      },
      adminUserId,
      adminUserName
    );
  }
}
