import { env } from '../src/config/env.config';
import { connectDatabase, disconnectDatabase } from '../src/config/database.config';
import { UserModel } from '../src/modules/auth/models/User.model';
import { PasswordService } from '../src/modules/auth/services/PasswordService';
import { UserRole, AccountStatus } from '../src/modules/auth/dtos/auth.dto';

async function seedInitialManagement(): Promise<void> {
  console.log('====================================================');
  console.log('🌱 EduHub: Initial Management Account Setup');
  console.log('====================================================');

  await connectDatabase();

  try {
    const adminEmail = env.INITIAL_MANAGEMENT_EMAIL.toLowerCase().trim();
    const adminName = env.INITIAL_MANAGEMENT_NAME;
    const adminPhone = env.INITIAL_MANAGEMENT_PHONE;
    const rawPassword = env.INITIAL_MANAGEMENT_PASSWORD;

    // Check if any management account already exists
    const existingManagement = await UserModel.findOne({ role: UserRole.MANAGEMENT });
    if (existingManagement) {
      console.log(`ℹ️ Management account already exists: ${existingManagement.email}`);
      console.log('No action required. Seed completed.');
      return;
    }

    // Check if user with this email exists
    const existingUserWithEmail = await UserModel.findOne({ email: adminEmail });
    if (existingUserWithEmail) {
      console.log(`⚠️ User with email ${adminEmail} already exists with role ${existingUserWithEmail.role}.`);
      return;
    }

    const passwordService = new PasswordService(12);
    const passwordHash = await passwordService.hash(rawPassword);

    const managementUser = await UserModel.create({
      fullName: adminName,
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      role: UserRole.MANAGEMENT,
      status: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
    });

    console.log('✅ Initial Management account created successfully!');
    console.log(`   ID:    ${managementUser._id}`);
    console.log(`   Name:  ${managementUser.fullName}`);
    console.log(`   Email: ${managementUser.email}`);
    console.log(`   Role:  ${managementUser.role}`);
    console.log(`   Status: ${managementUser.status}`);
  } catch (error) {
    console.error('❌ Failed to create initial management account:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seedInitialManagement();
