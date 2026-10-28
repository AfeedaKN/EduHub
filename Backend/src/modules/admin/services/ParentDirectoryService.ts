import mongoose from 'mongoose';
import { IParentDirectoryRepository } from '../repositories/ParentDirectoryRepository';
import {
  ParentFilterDTO,
  ParentSummaryStatsDTO,
  ParentDirectoryResponseDTO,
  ParentDetailDTO,
  UpdateParentStatusDTO,
} from '../dtos/parentDirectory.dto';
import { AccountStatus } from '../../auth/dtos/auth.dto';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors/AppError';

export interface IParentDirectoryService {
  getSummaryStats(): Promise<ParentSummaryStatsDTO>;
  getParents(filter: ParentFilterDTO): Promise<ParentDirectoryResponseDTO>;
  getParentById(id: string): Promise<ParentDetailDTO>;
  updateParentStatus(id: string, dto: UpdateParentStatusDTO): Promise<ParentDetailDTO>;
}

export class ParentDirectoryService implements IParentDirectoryService {
  constructor(private readonly parentDirectoryRepo: IParentDirectoryRepository) {}

  async getSummaryStats(): Promise<ParentSummaryStatsDTO> {
    return await this.parentDirectoryRepo.getSummaryStats();
  }

  async getParents(filter: ParentFilterDTO): Promise<ParentDirectoryResponseDTO> {
    return await this.parentDirectoryRepo.findParents(filter);
  }

  async getParentById(id: string): Promise<ParentDetailDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid parent ID format.', 'INVALID_PARENT_ID');
    }

    const parent = await this.parentDirectoryRepo.findParentById(id);
    if (!parent) {
      throw new NotFoundError(`Parent account with ID ${id} was not found.`, 'PARENT_NOT_FOUND');
    }

    return parent;
  }

  async updateParentStatus(id: string, dto: UpdateParentStatusDTO): Promise<ParentDetailDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid parent ID format.', 'INVALID_PARENT_ID');
    }

    const validStatuses = [
      AccountStatus.ACTIVE,
      AccountStatus.DISABLED,
      AccountStatus.PENDING_VERIFICATION,
    ];
    if (!validStatuses.includes(dto.status as AccountStatus)) {
      throw new ValidationError(
        `Invalid account status. Allowed values: ${validStatuses.join(', ')}`,
        'INVALID_STATUS'
      );
    }

    const updatedUser = await this.parentDirectoryRepo.updateParentStatus(
      id,
      dto.status as AccountStatus
    );

    if (!updatedUser) {
      throw new NotFoundError(`Parent account with ID ${id} was not found.`, 'PARENT_NOT_FOUND');
    }

    const detail = await this.parentDirectoryRepo.findParentById(id);
    if (!detail) {
      throw new NotFoundError(`Parent account with ID ${id} was not found.`, 'PARENT_NOT_FOUND');
    }

    return detail;
  }
}
