import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';

// Interfaces
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IProvinciasRepository } from '../../domain/repositories/IProvinciasRepository';
import { IMunicipiosRepository } from '../../domain/repositories/IMunicipiosRepository';
import { IDistritosMunicipalesRepository } from '../../domain/repositories/IDistritosMunicipalesRepository';
import { ISeccionesRepository } from '../../domain/repositories/ISeccionesRepository';
import { IPasswordHasher } from '../../application/interfaces/IPasswordHasher';
import { ITranslationService } from '../../application/interfaces/ITranslationService';

// Implementaciones
import { PrismaUsuarioRepository } from '../../infrastructure/repositories/PrismaUsuarioRepository';
import { PrismaProvinciasRepository } from '../../infrastructure/repositories/PrismaProvinciasRepository';
import { PrismaMunicipiosRepository } from '../../infrastructure/repositories/PrismaMunicipiosRepository';
import { PrismaDistritosMunicipalesRepository } from '../../infrastructure/repositories/PrismaDistritosMunicipalesRepository';
import { PrismaSeccionesRepository } from '../../infrastructure/repositories/PrismaSeccionesRepository';
import { BcryptPasswordHasher } from '../../infrastructure/external-services/BcryptPasswordHasher';
import { LibreTranslateService } from '../../infrastructure/external-services/LibreTranslateService';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';
import { prisma } from '../../infrastructure/database/prisma/client';

// Validadores
import { ProvinciaValidator } from '../../domain/validators/Provincias/ProvinciaValidator';
import { MunicipioValidator } from '../../domain/validators/Municipios/MunicipioValidator';
import { DistritoMunicipalValidator } from '../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator';
import { SeccionValidator } from '../../domain/validators/Secciones/SeccionValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

// UseCases
import { GestionarProvinciasUseCase } from '../../application/use-cases/GestionarProvinciasUseCase';
import { GestionarMunicipiosUseCase } from '../../application/use-cases/GestionarMunicipiosUseCase';
import { GestionarDistritosMunicipalesUseCase } from '../../application/use-cases/GestionarDistritosMunicipalesUseCase';
import { GestionarSeccionesUseCase } from '../../application/use-cases/GestionarSeccionesUseCase';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/RegistrarUsuarioUseCase';

// ===== REGISTRAR SERVICIOS EXTERNOS =====
// Registrar PrismaClient como singleton
container.register<PrismaClient>('PrismaClient', {
  useValue: prisma
});

// Registrar RedisCacheService como singleton (ya instanciado)
const redisCacheService = new RedisCacheService();
container.register(RedisCacheService, {
  useValue: redisCacheService
});

// ===== REGISTRAR VALIDADORES =====
container.register(ProvinciaValidator, {
  useFactory: () => {
    const provinciasRepository = container.resolve<IProvinciasRepository>('ProvinciasRepository');
    return new ProvinciaValidator(provinciasRepository);
  }
});

container.register(MunicipioValidator, {
  useFactory: () => {
    const municipiosRepository = container.resolve<IMunicipiosRepository>('MunicipiosRepository');
    const provinciasRepository = container.resolve<IProvinciasRepository>('ProvinciasRepository');
    return new MunicipioValidator(municipiosRepository, provinciasRepository);
  }
});

container.register(DistritoMunicipalValidator, {
  useFactory: () => {
    const distritosRepository = container.resolve<IDistritosMunicipalesRepository>('DistritosMunicipalesRepository');
    const municipiosRepository = container.resolve<IMunicipiosRepository>('MunicipiosRepository');
    return new DistritoMunicipalValidator(distritosRepository, municipiosRepository);
  }
});

container.register(SeccionValidator, {
  useFactory: () => {
    const seccionesRepository = container.resolve<ISeccionesRepository>('SeccionesRepository');
    const municipiosRepository = container.resolve<IMunicipiosRepository>('MunicipiosRepository');
    const distritosRepository = container.resolve<IDistritosMunicipalesRepository>('DistritosMunicipalesRepository');
    return new SeccionValidator(seccionesRepository, distritosRepository, municipiosRepository);
  }
});

container.register(EstadoValidator, {
  useFactory: () => {
    return new EstadoValidator();
  }
});

// ===== REGISTRAR REPOSITORIOS =====
container.register<IProvinciasRepository>(
  'ProvinciasRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaProvinciasRepository(prismaClient, redisCache);
    }
  }
);

container.register<IMunicipiosRepository>(
  'MunicipiosRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaMunicipiosRepository(prismaClient, redisCache);
    }
  }
);

container.register<IDistritosMunicipalesRepository>(
  'DistritosMunicipalesRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaDistritosMunicipalesRepository(prismaClient, redisCache);
    }
  }
);

container.register<ISeccionesRepository>(
  'SeccionesRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaSeccionesRepository(prismaClient, redisCache);
    }
  }
);

container.register<IUsuarioRepository>(
  'UsuarioRepository',
  { useClass: PrismaUsuarioRepository }
);

// ===== REGISTRAR USE CASES =====
container.register(GestionarProvinciasUseCase, {
  useFactory: () => {
    const provinciasRepository = container.resolve<IProvinciasRepository>('ProvinciasRepository');
    const provinciaValidator = container.resolve(ProvinciaValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarProvinciasUseCase(provinciasRepository, provinciaValidator, estadoValidator);
  }
});

container.register(GestionarMunicipiosUseCase, {
  useFactory: () => {
    const municipiosRepository = container.resolve<IMunicipiosRepository>('MunicipiosRepository');
    const municipioValidator = container.resolve(MunicipioValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarMunicipiosUseCase(municipiosRepository, municipioValidator, estadoValidator);
  }
});

container.register(GestionarDistritosMunicipalesUseCase, {
  useFactory: () => {
    const distritosRepository = container.resolve<IDistritosMunicipalesRepository>('DistritosMunicipalesRepository');
    const distritoValidator = container.resolve(DistritoMunicipalValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarDistritosMunicipalesUseCase(distritosRepository, distritoValidator, estadoValidator);
  }
});

container.register(GestionarSeccionesUseCase, {
  useFactory: () => {
    const seccionesRepository = container.resolve<ISeccionesRepository>('SeccionesRepository');
    const seccionValidator = container.resolve(SeccionValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarSeccionesUseCase(seccionesRepository, seccionValidator, estadoValidator);
  }
});

container.register(RegistrarUsuarioUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new RegistrarUsuarioUseCase(usuarioRepository, passwordHasher);
  }
});

// ===== REGISTRAR SERVICIOS DE APLICACIÓN =====
container.register<IPasswordHasher>(
  'PasswordHasher',
  { useClass: BcryptPasswordHasher }
);

container.register<ITranslationService>('ITranslationService', {
  useClass: LibreTranslateService
});