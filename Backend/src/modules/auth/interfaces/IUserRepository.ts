import { IUserDocument } from '../models/User.model';
import { UserRole, AccountStatus } from '../dtos/auth.dto';

export interface CreateUserData {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  acceptedTerms: boolean;
  acceptedTermsAt?: Date;
  emailVerifiedAt?: Date | null;
}

export interface IUserRepository {
  findById(id: string): Promise<IUserDocument | null>;
  findByEmail(email: string): Promise<IUserDocument | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(data: CreateUserData): Promise<IUserDocument>;
  updateStatus(id: string, status: AccountStatus, emailVerifiedAt?: Date): Promise<IUserDocument | null>;
  updatePasswordHash(id: string, newPasswordHash: string): Promise<IUserDocument | null>;
}
