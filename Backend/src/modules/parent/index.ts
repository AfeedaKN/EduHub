import { RegistrationRequestRepository } from './repositories/RegistrationRequestRepository';
import { StudentRepository } from './repositories/StudentRepository';
import { ParentService } from './services/ParentService';
import { ParentController } from './controllers/ParentController';
import { createParentRouter } from './routes/parent.routes';
import { authenticateMiddleware } from '../auth';
import { ParentModuleComponents } from './parent.module';

export const registrationRequestRepository = new RegistrationRequestRepository();
export const studentRepository = new StudentRepository();

export const parentService = new ParentService(
  registrationRequestRepository,
  studentRepository
);

export const parentController = new ParentController(parentService);

export const parentRouter = createParentRouter({
  parentController,
  authenticateMiddleware,
});

export const parentModule: ParentModuleComponents = {
  router: parentRouter,
  parentController,
  parentService,
  registrationRequestRepository,
  studentRepository,
};
