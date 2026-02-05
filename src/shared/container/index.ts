import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';

// Interfaces
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IProvinciasRepository } from '../../domain/repositories/IProvinciasRepository';
import { IMunicipiosRepository } from '../../domain/repositories/IMunicipiosRepository';
import { IDistritosMunicipalesRepository } from '../../domain/repositories/IDistritosMunicipalesRepository';
import { ISeccionesRepository } from '../../domain/repositories/ISeccionesRepository';
import { IBarriosRepository } from '../../domain/repositories/IBarriosRepository';
import { ISubBarriosRepository } from '../../domain/repositories/ISubBarriosRepository';
import { IUbicacionesRepository } from '../../domain/repositories/IUbicacionesRepository';
import { IHorariosRepository } from '../../domain/repositories/IHorariosRepository';
import { IServicioHorarioRepository } from '../../domain/repositories/IServicioHorarioRepository';
import { ITipoServicioRepository } from '../../domain/repositories/ITipoServicioRepository';
import { ITipoCentroSaludRepository } from '../../domain/repositories/ITipoCentroSaludRepository';
import { IProfesionesRepository } from '../../domain/repositories/IProfesionesRepository';
import { IExperienciasLaboralesRepository } from '../../domain/repositories/IExperienciasLaboralesRepository';
import { IPasswordHasher } from '../../application/interfaces/IPasswordHasher';
import { ITranslationService } from '../../application/interfaces/ITranslationService';
import { INotificacionesRepository } from '../../domain/repositories/INotificacionesRepository';
import { IConversacionesRepository } from '../../domain/repositories/IConversacionesRepository';
import { IMensajesRepository } from '../../domain/repositories/IMensajesRepository';
import { ILecturasConversacionRepository } from '../../domain/repositories/ILecturasConversacionRepository';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';

// Implementaciones
import { PrismaUsuarioRepository } from '../../infrastructure/repositories/PrismaUsuarioRepository';
import { PrismaProvinciasRepository } from '../../infrastructure/repositories/PrismaProvinciasRepository';
import { PrismaMunicipiosRepository } from '../../infrastructure/repositories/PrismaMunicipiosRepository';
import { PrismaDistritosMunicipalesRepository } from '../../infrastructure/repositories/PrismaDistritosMunicipalesRepository';
import { PrismaSeccionesRepository } from '../../infrastructure/repositories/PrismaSeccionesRepository';
import { PrismaBarriosRepository } from '../../infrastructure/repositories/PrismaBarriosRepository';
import { PrismaSubBarriosRepository } from '../../infrastructure/repositories/PrismaSubBarriosRepository';
import { PrismaUbicacionesRepository } from '../../infrastructure/repositories/PrismaUbicacionesRepository';
import { PrismaHorariosRepository } from '../../infrastructure/repositories/PrismaHorariosRepository';
import { PrismaServicioHorarioRepository } from '../../infrastructure/repositories/PrismaServicioHorarioRepository';
import { PrismaTipoServicioRepository } from '../../infrastructure/repositories/PrismaTipoServicioRepository';
import { PrismaTipoCentroSaludRepository } from '../../infrastructure/repositories/PrismaTipoCentroSaludRepository';
import { PrismaProfesionesRepository } from '../../infrastructure/repositories/PrismaProfesionesRepository';
import { PrismaExperienciasLaboralesRepository } from '../../infrastructure/repositories/PrismaExperienciasLaboralesRepository';
import { PrismaNotificacionesRepository } from '../../infrastructure/repositories/PrismaNotificacionesRepository';
import { PrismaConversacionesRepository } from '../../infrastructure/repositories/PrismaConversacionesRepository';
import { PrismaMensajesRepository } from '../../infrastructure/repositories/PrismaMensajesRepository';
import { PrismaLecturasConversacionRepository } from '../../infrastructure/repositories/PrismaLecturasConversacionRepository';
import { PrismaMediaRepository } from '../../infrastructure/repositories/PrismaMediaRepository';
import { BcryptPasswordHasher } from '../../infrastructure/external-services/BcryptPasswordHasher';
import { LibreTranslateService } from '../../infrastructure/external-services/LibreTranslateService';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';
import { NotificacionesWebSocketService } from '../../infrastructure/external-services/NotificacionesWebSocketService';
import { ChatWebSocketService } from '../../infrastructure/external-services/ChatWebSocketService';
import { prisma } from '../../infrastructure/database/prisma/client';

// Validadores
import { ProvinciaValidator } from '../../domain/validators/Provincias/ProvinciaValidator';
import { MunicipioValidator } from '../../domain/validators/Municipios/MunicipioValidator';
import { DistritoMunicipalValidator } from '../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator';
import { SeccionValidator } from '../../domain/validators/Secciones/SeccionValidator';
import { BarrioValidator } from '../../domain/validators/Barrios/BarrioValidator';
import { SubBarrioValidator } from '../../domain/validators/SubBarrios/SubBarrioValidator';
import { UbicacionValidator } from '../../domain/validators/Ubicaciones/UbicacionValidator';
import { HorarioValidator } from '../../domain/validators/Horarios/HorarioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { ValidadorServicioHorario } from '../../domain/validators/ServiciosHorarios/ValidadorServicioHorario';
import { TipoServicioValidator } from '../../domain/validators/TiposServicios/TipoServicioValidator';
import { TipoCentroSaludValidator } from '../../domain/validators/TiposCentrosSalud/TipoCentroSaludValidator';
import { ProfesionValidator } from '../../domain/validators/Profesiones/ProfesionValidator';
import { ExperienciaLaboralValidator } from '../../domain/validators/ExperienciasLaborales/ExperienciaLaboralValidator';

// UseCases
import { GestionarProvinciasUseCase } from '../../application/use-cases/GestionarProvinciasUseCase';
import { GestionarMunicipiosUseCase } from '../../application/use-cases/GestionarMunicipiosUseCase';
import { GestionarDistritosMunicipalesUseCase } from '../../application/use-cases/GestionarDistritosMunicipalesUseCase';
import { GestionarBarriosUseCase } from '../../application/use-cases/GestionarBarriosUseCase';
import { GestionarSubBarriosUseCase } from '../../application/use-cases/GestionarSubBarriosUseCase';
import { GestionarUbicacionesUseCase } from '../../application/use-cases/GestionarUbicacionesUseCase';
import { GestionarHorariosUseCase } from '../../application/use-cases/GestionarHorariosUseCase';
import { GestionarSeccionesUseCase } from '../../application/use-cases/GestionarSeccionesUseCase';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/RegistrarUsuarioUseCase';
import { GestionarTiposServiciosUseCase } from '../../application/use-cases/GestionarTiposServiciosUseCase';
import { GestionarConversacionesUseCase } from '../../application/use-cases/GestionarConversacionesUseCase';
import { GestionarMensajesUseCase } from '../../application/use-cases/GestionarMensajesUseCase';
import { GestionarMediaUseCase } from '../../application/use-cases/GestionarMediaUseCase';
import { GestionarTiposCentrosSaludUseCase } from '../../application/use-cases/GestionarTiposCentrosSaludUseCase';
import { GestionarProfesionesUseCase } from '../../application/use-cases/GestionarProfesionesUseCase';
import { GestionarExperienciasLaboralesUseCase } from '../../application/use-cases/GestionarExperienciasLaboralesUseCase';
import { GestionarServicioHorariosUseCase } from '../../application/use-cases/GestionarServicioHorariosUseCase';
import { GestionarNotificacionesUseCase } from '../../application/use-cases/GestionarNotificacionesUseCase';

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

// Registrar ChatWebSocketService como singleton
container.registerSingleton(ChatWebSocketService);

// Registrar NotificacionesWebSocketService como singleton
container.registerSingleton(NotificacionesWebSocketService);

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

container.register(BarrioValidator, {
  useFactory: () => {
    const barriosRepository = container.resolve<IBarriosRepository>('BarriosRepository');
    const seccionesRepository = container.resolve<ISeccionesRepository>('SeccionesRepository');
    return new BarrioValidator(barriosRepository, seccionesRepository);
  }
});

container.register(SubBarrioValidator, {
  useFactory: () => {
    const subBarriosRepository = container.resolve<ISubBarriosRepository>('SubBarriosRepository');
    const barriosRepository = container.resolve<IBarriosRepository>('BarriosRepository');
    return new SubBarrioValidator(subBarriosRepository, barriosRepository);
  }
});

container.register(UbicacionValidator, {
  useFactory: () => {
    const barriosRepository = container.resolve<IBarriosRepository>('BarriosRepository');
    const subBarriosRepository = container.resolve<ISubBarriosRepository>('SubBarriosRepository');
    return new UbicacionValidator(barriosRepository, subBarriosRepository);
  }
});

container.register(HorarioValidator, {
  useFactory: () => {
    const ubicacionesRepository = container.resolve<IUbicacionesRepository>('UbicacionesRepository');
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const horariosRepository = container.resolve<IHorariosRepository>('HorariosRepository');
    return new HorarioValidator(ubicacionesRepository, usuarioRepository, horariosRepository);
  }
});

container.register(ValidadorServicioHorario, {
  useFactory: () => {
    return new ValidadorServicioHorario();
  }
});

container.register(TipoServicioValidator, {
  useFactory: () => {
    const repo = container.resolve<ITipoServicioRepository>('TipoServicioRepository');
    return new TipoServicioValidator(repo);
  }
});

container.register(TipoCentroSaludValidator, {
  useFactory: () => {
    const repo = container.resolve<ITipoCentroSaludRepository>('TipoCentroSaludRepository');
    return new TipoCentroSaludValidator(repo);
  }
});

container.register(ProfesionValidator, {
  useFactory: () => {
    const repo = container.resolve<IProfesionesRepository>('ProfesionesRepository');
    return new ProfesionValidator(repo);
  }
});

container.register(ExperienciaLaboralValidator, {
  useFactory: () => {
    const repo = container.resolve<IExperienciasLaboralesRepository>('IExperienciasLaboralesRepository');
    return new ExperienciaLaboralValidator(repo);
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

container.register<IBarriosRepository>(
  'BarriosRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaBarriosRepository(prismaClient, redisCache);
    }
  }
);

container.register<ISubBarriosRepository>(
  'SubBarriosRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaSubBarriosRepository(prismaClient, redisCache);
    }
  }
);

container.register<IUbicacionesRepository>(
  'UbicacionesRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaUbicacionesRepository(prismaClient, redisCache);
    }
  }
);

container.register<IHorariosRepository>(
  'HorariosRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaHorariosRepository(prismaClient, redisCache);
    }
  }
);

container.register<IServicioHorarioRepository>(
  'ServicioHorarioRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaServicioHorarioRepository(prismaClient);
    }
  }
);

container.register<ITipoServicioRepository>(
  'TipoServicioRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaTipoServicioRepository(prismaClient);
    }
  }
);

container.register<ITipoCentroSaludRepository>(
  'TipoCentroSaludRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaTipoCentroSaludRepository(prismaClient, redisCache);
    }
  }
);

container.register<IProfesionesRepository>(
  'ProfesionesRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaProfesionesRepository(prismaClient, redisCache);
    }
  }
);

container.register<IExperienciasLaboralesRepository>(
  'IExperienciasLaboralesRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaExperienciasLaboralesRepository(prismaClient, redisCache);
    }
  }
);

container.register<IUsuarioRepository>(
  'UsuarioRepository',
  { useClass: PrismaUsuarioRepository }
);

container.register<INotificacionesRepository>(
  'NotificacionesRepository',
  { useClass: PrismaNotificacionesRepository }
);

// ===== REGISTRAR REPOSITORIOS DE CHAT =====
container.register<IConversacionesRepository>(
  'ConversacionesRepository',
  { useClass: PrismaConversacionesRepository }
);

container.register<IMensajesRepository>(
  'MensajesRepository',
  { useClass: PrismaMensajesRepository }
);

container.register<ILecturasConversacionRepository>(
  'LecturasConversacionRepository',
  { useClass: PrismaLecturasConversacionRepository }
);

container.register<IMediaRepository>(
  'MediaRepository',
  { useClass: PrismaMediaRepository }
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

container.register(GestionarBarriosUseCase, {
  useFactory: () => {
    const barriosRepository = container.resolve<IBarriosRepository>('BarriosRepository');
    const barrioValidator = container.resolve(BarrioValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarBarriosUseCase(barriosRepository, barrioValidator, estadoValidator);
  }
});

container.register(GestionarSubBarriosUseCase, {
  useFactory: () => {
    const subBarriosRepository = container.resolve<ISubBarriosRepository>('SubBarriosRepository');
    const subBarrioValidator = container.resolve(SubBarrioValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarSubBarriosUseCase(subBarriosRepository, subBarrioValidator, estadoValidator);
  }
});

container.register(GestionarUbicacionesUseCase, {
  useFactory: () => {
    const ubicacionesRepository = container.resolve<IUbicacionesRepository>('UbicacionesRepository');
    const ubicacionValidator = container.resolve(UbicacionValidator);
    return new GestionarUbicacionesUseCase(ubicacionValidator, ubicacionesRepository);
  }
});

container.register(GestionarHorariosUseCase, {
  useFactory: () => {
    const horariosRepository = container.resolve<IHorariosRepository>('HorariosRepository');
    const horarioValidator = container.resolve(HorarioValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarHorariosUseCase(horariosRepository, horarioValidator, estadoValidator);
  }
});

container.register(RegistrarUsuarioUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new RegistrarUsuarioUseCase(usuarioRepository, passwordHasher);
  }
});

container.register(GestionarTiposServiciosUseCase, {
  useFactory: () => {
    const repo = container.resolve<ITipoServicioRepository>('TipoServicioRepository');
    const validator = container.resolve(TipoServicioValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarTiposServiciosUseCase(repo, validator, estadoValidator);
  }
});

container.register(GestionarTiposCentrosSaludUseCase, {
  useFactory: () => {
    const repo = container.resolve<ITipoCentroSaludRepository>('TipoCentroSaludRepository');
    const validator = container.resolve(TipoCentroSaludValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarTiposCentrosSaludUseCase(repo, validator, estadoValidator);
  }
});

container.register(GestionarProfesionesUseCase, {
  useFactory: () => {
    const repo = container.resolve<IProfesionesRepository>('ProfesionesRepository');
    const validator = container.resolve(ProfesionValidator);
    return new GestionarProfesionesUseCase(repo, validator);
  }
});

container.register('GestionarProfesionesUseCase', {
  useFactory: () => {
    return container.resolve(GestionarProfesionesUseCase);
  }
});

container.register(GestionarExperienciasLaboralesUseCase, {
  useFactory: () => {
    const repo = container.resolve<IExperienciasLaboralesRepository>('IExperienciasLaboralesRepository');
    const validator = container.resolve(ExperienciaLaboralValidator);
    return new GestionarExperienciasLaboralesUseCase(repo, validator);
  }
});

container.register('GestionarExperienciasLaboralesUseCase', {
  useFactory: () => {
    return container.resolve(GestionarExperienciasLaboralesUseCase);
  }
});

container.register(GestionarServicioHorariosUseCase, {
  useFactory: () => {
    const servicioHorarioRepository = container.resolve<IServicioHorarioRepository>('ServicioHorarioRepository');
    return new GestionarServicioHorariosUseCase(servicioHorarioRepository);
  }
});

container.register(GestionarNotificacionesUseCase, {
  useFactory: () => {
    const notificacionesRepository = container.resolve<INotificacionesRepository>('NotificacionesRepository');
    return new GestionarNotificacionesUseCase(notificacionesRepository);
  }
});

// ===== REGISTRAR USE CASES DE CHAT =====
container.register(GestionarConversacionesUseCase, {
  useFactory: () => {
    const conversacionesRepository = container.resolve<IConversacionesRepository>('ConversacionesRepository');
    const lecturasRepository = container.resolve<ILecturasConversacionRepository>('LecturasConversacionRepository');
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    return new GestionarConversacionesUseCase(conversacionesRepository, lecturasRepository, usuarioRepository);
  }
});

container.register(GestionarMensajesUseCase, {
  useFactory: () => {
    const mensajesRepository = container.resolve<IMensajesRepository>('MensajesRepository');
    const conversacionesRepository = container.resolve<IConversacionesRepository>('ConversacionesRepository');
    const lecturasRepository = container.resolve<ILecturasConversacionRepository>('LecturasConversacionRepository');
    const mediaRepository = container.resolve<IMediaRepository>('MediaRepository');
    return new GestionarMensajesUseCase(mensajesRepository, conversacionesRepository, lecturasRepository, mediaRepository);
  }
});

container.register(GestionarMediaUseCase, {
  useFactory: () => {
    const mediaRepository = container.resolve<IMediaRepository>('MediaRepository');
    return new GestionarMediaUseCase(mediaRepository);
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

export { container };