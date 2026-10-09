import { Router, RequestHandler } from 'express';
import { RegistrationRequestRepository } from './repositories/RegistrationRequestRepository';
import { StudentRepository } from './repositories/StudentRepository';
import { ParentService } from './services/ParentService';
import { ParentController } from './controllers/ParentController';
import { createParentRouter } from './routes/parent.routes';

export interface ParentModuleComponents {
  router: Router;
  parentController: ParentController;
  parentService: ParentService;
  registrationRequestRepository: RegistrationRequestRepository;
  studentRepository: StudentRepository;
}

export function initParentModule(authenticateMiddleware: RequestHandler): ParentModuleComponents {
  // 1. Repositories
  const registrationRequestRepository = new RegistrationRequestRepository();
  const studentRepository = new StudentRepository();

  // 2. Services
  const parentService = new ParentService(
    registrationRequestRepository,
    studentRepository
  );

  // 3. Controller
  const parentController = new ParentController(parentService);

  // 4. Router
  const router = createParentRouter({
    parentController,
    authenticateMiddleware,
  });

  return {
    router,
    parentController,
    parentService,
    registrationRequestRepository,
    studentRepository,
  };
}
