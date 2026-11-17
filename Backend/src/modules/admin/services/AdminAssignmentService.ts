import mongoose from 'mongoose';
import { IAdminAssignmentRepository } from '../repositories/AdminAssignmentRepository';
import {
  AdminAssignmentFilterDTO,
  AdminAssignmentSummaryStatsDTO,
  AdminAssignmentFilterMetadataDTO,
  AdminAssignmentListResponseDTO,
  AdminAssignmentDetailsDTO,
  AdminTeacherMonitoringItemDTO,
} from '../dtos/adminAssignment.dto';
import { ValidationError, NotFoundError } from '../../../shared/domain/errors/AppError';

export class AdminAssignmentService {
  constructor(private readonly adminAssignmentRepo: IAdminAssignmentRepository) {}

  /**
   * Dashboard Summary Statistics
   */
  async getSummary(academicYear?: string): Promise<AdminAssignmentSummaryStatsDTO> {
    return await this.adminAssignmentRepo.getSummaryStats(academicYear);
  }

  /**
   * Filter Metadata
   */
  async getFilterMetadata(): Promise<AdminAssignmentFilterMetadataDTO> {
    return await this.adminAssignmentRepo.getFilterMetadata();
  }

  /**
   * List assignments with pagination, filter, summary, and filter metadata
   */
  async getAssignments(filter: AdminAssignmentFilterDTO): Promise<AdminAssignmentListResponseDTO> {
    const [assignmentsResult, summary, filterMetadata] = await Promise.all([
      this.adminAssignmentRepo.findAssignments(filter),
      this.adminAssignmentRepo.getSummaryStats(filter.academicYear),
      this.adminAssignmentRepo.getFilterMetadata(),
    ]);

    return {
      assignments: assignmentsResult.assignments,
      pagination: {
        total: assignmentsResult.total,
        page: assignmentsResult.page,
        limit: assignmentsResult.limit,
        totalPages: assignmentsResult.totalPages,
      },
      summary,
      filterMetadata,
    };
  }

  /**
   * Assignment details by ID
   */
  async getAssignmentDetails(id: string): Promise<AdminAssignmentDetailsDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid assignment ID format.');
    }

    const details = await this.adminAssignmentRepo.findAssignmentDetails(id);
    if (!details) {
      throw new NotFoundError('Assignment not found.');
    }

    return details;
  }

  /**
   * Teacher-wise Assignment Monitoring
   */
  async getTeacherMonitoring(
    academicYear?: string,
    search?: string
  ): Promise<AdminTeacherMonitoringItemDTO[]> {
    return await this.adminAssignmentRepo.getTeacherMonitoring(academicYear, search);
  }
}
