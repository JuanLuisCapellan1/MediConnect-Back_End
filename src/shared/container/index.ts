import { container } from 'tsyringe';

// Interfaces
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../../application/interfaces/IPasswordHasher';

// Implementaciones
import { PrismaUsuarioRepository } from '../../infrastructure/repositories/PrismaUsuarioRepository';
import { BcryptPasswordHasher } from '../../infrastructure/external-services/BcryptPasswordHasher';

// Registrar Repositorios
container.register<IUsuarioRepository>(
  'UsuarioRepository', // Este string debe coincidir con el @inject del UseCase
  { useClass: PrismaUsuarioRepository }
);

// Registrar Servicios Externos
container.register<IPasswordHasher>(
  'PasswordHasher',
  { useClass: BcryptPasswordHasher }
);