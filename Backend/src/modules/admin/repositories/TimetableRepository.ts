import mongoose, { FilterQuery } from 'mongoose';
import {
  TimetablePeriodModel,
  ITimetablePeriodDoc,
  DayOfWeek,
} from '../models/TimetablePeriod.model';
import { TimetableFilterDTO } from '../dtos/timetable.dto';

export interface ITimetableRepository {
  findById(id: string): Promise<ITimetablePeriodDoc | null>;
  findByFilter(filter: TimetableFilterDTO): Promise<ITimetablePeriodDoc[]>;
  findSectionOverlaps(
    academicYear: string,
    className: string,
    section: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ITimetablePeriodDoc[]>;
  findTeacherOverlaps(
    academicYear: string,
    teacherId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ITimetablePeriodDoc[]>;
  findRoomOverlaps(
    academicYear: string,
    roomNumber: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ITimetablePeriodDoc[]>;
  findByTeacherId(
    teacherId: string,
    academicYear?: string,
    dayOfWeek?: DayOfWeek
  ): Promise<ITimetablePeriodDoc[]>;
  create(data: Partial<ITimetablePeriodDoc>): Promise<ITimetablePeriodDoc>;
  update(
    id: string,
    updateData: Partial<ITimetablePeriodDoc>
  ): Promise<ITimetablePeriodDoc | null>;
  delete(id: string): Promise<boolean>;
}

export class TimetableRepository implements ITimetableRepository {
  /**
   * Normalize "H:mm" to "HH:mm" for accurate lexicographical comparison
   */
  private normalizeTime(t: string): string {
    const [h, m] = t.split(':');
    return `${(h || '0').padStart(2, '0')}:${(m || '0').padStart(2, '0')}`;
  }

  async findById(id: string): Promise<ITimetablePeriodDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return TimetablePeriodModel.findById(id).exec();
  }

  async findByFilter(filter: TimetableFilterDTO): Promise<ITimetablePeriodDoc[]> {
    const query: FilterQuery<ITimetablePeriodDoc> = {};

    if (filter.academicYear) {
      query.academicYear = filter.academicYear;
    }
    if (filter.classId && mongoose.Types.ObjectId.isValid(filter.classId)) {
      query.classId = new mongoose.Types.ObjectId(filter.classId);
    }
    if (filter.className) {
      query.className = filter.className;
    }
    if (filter.section) {
      query.section = filter.section.toUpperCase();
    }
    if (filter.dayOfWeek) {
      query.dayOfWeek = filter.dayOfWeek.toUpperCase() as DayOfWeek;
    }
    if (filter.teacherId && mongoose.Types.ObjectId.isValid(filter.teacherId)) {
      query.teacherId = new mongoose.Types.ObjectId(filter.teacherId);
    }
    if (filter.periodType) {
      query.periodType = filter.periodType;
    }

    return TimetablePeriodModel.find(query)
      .sort({ dayOfWeek: 1, startTime: 1 })
      .exec();
  }

  async findSectionOverlaps(
    academicYear: string,
    className: string,
    section: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ITimetablePeriodDoc[]> {
    const normStart = this.normalizeTime(startTime);
    const normEnd = this.normalizeTime(endTime);

    const query: FilterQuery<ITimetablePeriodDoc> = {
      academicYear,
      className,
      section: section.toUpperCase(),
      dayOfWeek: dayOfWeek.toUpperCase() as DayOfWeek,
      startTime: { $lt: normEnd },
      endTime: { $gt: normStart },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return TimetablePeriodModel.find(query).exec();
  }

  async findTeacherOverlaps(
    academicYear: string,
    teacherId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ITimetablePeriodDoc[]> {
    const normStart = this.normalizeTime(startTime);
    const normEnd = this.normalizeTime(endTime);

    const query: FilterQuery<ITimetablePeriodDoc> = {
      academicYear,
      teacherId: new mongoose.Types.ObjectId(teacherId),
      dayOfWeek: dayOfWeek.toUpperCase() as DayOfWeek,
      startTime: { $lt: normEnd },
      endTime: { $gt: normStart },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return TimetablePeriodModel.find(query).exec();
  }

  async findRoomOverlaps(
    academicYear: string,
    roomNumber: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ITimetablePeriodDoc[]> {
    const cleanRoom = roomNumber.trim();
    if (!cleanRoom) return [];

    const normStart = this.normalizeTime(startTime);
    const normEnd = this.normalizeTime(endTime);

    const query: FilterQuery<ITimetablePeriodDoc> = {
      academicYear,
      roomNumber: { $regex: new RegExp(`^${cleanRoom}$`, 'i') },
      dayOfWeek: dayOfWeek.toUpperCase() as DayOfWeek,
      startTime: { $lt: normEnd },
      endTime: { $gt: normStart },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return TimetablePeriodModel.find(query).exec();
  }

  async findByTeacherId(
    teacherId: string,
    academicYear?: string,
    dayOfWeek?: DayOfWeek
  ): Promise<ITimetablePeriodDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) return [];

    const query: FilterQuery<ITimetablePeriodDoc> = {
      teacherId: new mongoose.Types.ObjectId(teacherId),
    };

    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (dayOfWeek) {
      query.dayOfWeek = dayOfWeek.toUpperCase() as DayOfWeek;
    }

    return TimetablePeriodModel.find(query)
      .sort({ dayOfWeek: 1, startTime: 1 })
      .exec();
  }

  async create(data: Partial<ITimetablePeriodDoc>): Promise<ITimetablePeriodDoc> {
    const period = new TimetablePeriodModel(data);
    return period.save();
  }

  async update(
    id: string,
    updateData: Partial<ITimetablePeriodDoc>
  ): Promise<ITimetablePeriodDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return TimetablePeriodModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await TimetablePeriodModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }
}
