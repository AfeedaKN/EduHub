import { ClassStatus } from '../models/Class.model';
import { SectionStatus } from '../models/Section.model';

export interface CreateClassDTO {
  name: string;
  academicYear: string;
  description?: string;
}

export interface UpdateClassDTO {
  name?: string;
  academicYear?: string;
  description?: string;
  status?: ClassStatus;
}

export interface CreateSectionDTO {
  name: string;
  capacity: number;
  roomNumber?: string;
}

export interface UpdateSectionDTO {
  name?: string;
  capacity?: number;
  roomNumber?: string;
  status?: SectionStatus;
}

export interface ClassFilterOptions {
  academicYear?: string;
  status?: ClassStatus | 'ALL';
  search?: string;
}

export interface SectionDetailDTO {
  id: string;
  classId: string;
  className: string;
  name: string;
  academicYear: string;
  capacity: number;
  enrolledCount: number;
  availableSeats: number;
  roomNumber?: string;
  status: SectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassDetailDTO {
  id: string;
  name: string;
  academicYear: string;
  description?: string;
  status: ClassStatus;
  sectionsCount: number;
  totalEnrolled: number;
  totalCapacity: number;
  availableSeats: number;
  sections: SectionDetailDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassSummaryStatsDTO {
  totalClasses: number;
  totalSections: number;
  totalEnrolledStudents: number;
  totalAvailableSeats: number;
}
