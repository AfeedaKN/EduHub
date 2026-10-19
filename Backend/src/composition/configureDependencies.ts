import { authModule } from '../modules/auth';
import { adminModule } from '../modules/admin';
import { parentModule } from '../modules/parent';
import { teacherModule } from '../modules/teacher';
import { AuthModuleComponents } from '../modules/auth/auth.module';
import { AdminModuleComponents } from '../modules/admin/admin.module';
import { ParentModuleComponents } from '../modules/parent/parent.module';
import { TeacherModuleComponents } from '../modules/teacher/teacher.module';

export interface AppDependencies {
  authModule: AuthModuleComponents;
  parentModule: ParentModuleComponents;
  adminModule: AdminModuleComponents;
  teacherModule: TeacherModuleComponents;
}

export function configureDependencies(): AppDependencies {
  return {
    authModule,
    parentModule,
    adminModule,
    teacherModule,
  };
}
