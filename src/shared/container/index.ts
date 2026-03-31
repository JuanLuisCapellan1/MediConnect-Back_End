import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';

// Interfaces
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IProvinciasRepository } from '../../domain/repositories/IProvinciasRepository';
import { IMunicipiosRepository } from '../../domain/repositories/IMunicipiosRepository';
import { IDistritosMunicipalesRepository } from '../../domain/repositories/IDistritosMunicipalesRepository';
import { ISeccionesRepository } from '../../domain/repositories/ISeccionesRepository';
import { IBarriosRepository } from '../../domain/repositories/IBarriosRepository';
import { IUbicacionesRepository } from '../../domain/repositories/IUbicacionesRepository';
import { IHorariosRepository } from '../../domain/repositories/IHorariosRepository';
import { IServicioHorarioRepository } from '../../domain/repositories/IServicioHorarioRepository';
import { IEspecialidadRepository } from '../../domain/repositories/IEspecialidadRepository';
import { IPacienteRepository } from '../../domain/repositories/IPacienteRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { IDoctorIdiomaRepository } from '../../domain/repositories/IDoctorIdiomaRepository';
import { ITipoCentroSaludRepository } from '../../domain/repositories/ITipoCentroSaludRepository';
import { IExperienciaLaboralRepository } from '../../domain/repositories/IExperienciaLaboralRepository';
import { IFormacionAcademicaRepository } from '../../domain/repositories/IFormacionAcademicaRepository';
import { IPaisRepository } from '../../domain/repositories/IPaisRepository';
import { IUniversidadRepository } from '../../domain/repositories/IUniversidadRepository';
import { IPasswordHasher } from '../../application/interfaces/IPasswordHasher';
import { ITranslationService } from '../../application/interfaces/ITranslationService';

import { IStorageService } from '../../application/interfaces/IStorageService';
import { IEmailService } from '../../application/interfaces/IEmailService';

import { INotificacionesRepository } from '../../domain/repositories/INotificacionesRepository';
import { IConversacionesRepository } from '../../domain/repositories/IConversacionesRepository';
import { IMensajesRepository } from '../../domain/repositories/IMensajesRepository';
import { ILecturasConversacionRepository } from '../../domain/repositories/ILecturasConversacionRepository';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { ICondicionMedicaRepository } from '../../domain/repositories/ICondicionMedicaRepository';
import { ISeguroMedicoRepository } from '../../domain/repositories/ISeguroMedicoRepository';
import { ITipoSeguroRepository } from '../../domain/repositories/ITipoSeguroRepository';
import { IServicioRepository } from '../../domain/repositories/IServicioRepository';
import { IFavoritoRepository } from '../../domain/repositories/IFavoritoRepository';
import { ISolicitudAlianzaRepository } from '../../domain/repositories/ISolicitudAlianzaRepository';
import { ICitaRepository } from '../../domain/repositories/ICitaRepository';

import { IInactividadRepository } from '../../domain/repositories/IInactividadRepository';
import { IResenaRepository } from '../../domain/repositories/IResenaRepository';

// Implementaciones
import { PrismaUsuarioRepository } from '../../infrastructure/repositories/PrismaUsuarioRepository';
import { PrismaProvinciasRepository } from '../../infrastructure/repositories/PrismaProvinciasRepository';
import { PrismaMunicipiosRepository } from '../../infrastructure/repositories/PrismaMunicipiosRepository';
import { PrismaDistritosMunicipalesRepository } from '../../infrastructure/repositories/PrismaDistritosMunicipalesRepository';
import { PrismaSeccionesRepository } from '../../infrastructure/repositories/PrismaSeccionesRepository';
import { PrismaBarriosRepository } from '../../infrastructure/repositories/PrismaBarriosRepository';
import { PrismaUbicacionesRepository } from '../../infrastructure/repositories/PrismaUbicacionesRepository';
import { PrismaHorariosRepository } from '../../infrastructure/repositories/PrismaHorariosRepository';
import { PrismaServicioHorarioRepository } from '../../infrastructure/repositories/PrismaServicioHorarioRepository';
import { PrismaEspecialidadRepository } from '../../infrastructure/repositories/PrismaEspecialidadRepository';
import { PrismaPacienteRepository } from '../../infrastructure/repositories/PrismaPacienteRepository';
import { PrismaDoctorRepository } from '../../infrastructure/repositories/PrismaDoctorRepository';
import { PrismaDoctorIdiomaRepository } from '../../infrastructure/repositories/PrismaDoctorIdiomaRepository';
import { PrismaTipoCentroSaludRepository } from '../../infrastructure/repositories/PrismaTipoCentroSaludRepository';
import { PrismaExperienciaLaboralRepository } from '../../infrastructure/repositories/PrismaExperienciaLaboralRepository';
import { PrismaFormacionAcademicaRepository } from '../../infrastructure/repositories/PrismaFormacionAcademicaRepository';
import { PrismaPaisRepository } from '../../infrastructure/repositories/PrismaPaisRepository';
import { PrismaUniversidadRepository } from '../../infrastructure/repositories/PrismaUniversidadRepository';
import { PrismaSolicitudAlianzaRepository } from '../../infrastructure/repositories/PrismaSolicitudAlianzaRepository';
import { PrismaNotificacionesRepository } from '../../infrastructure/repositories/PrismaNotificacionesRepository';
import { PrismaConversacionesRepository } from '../../infrastructure/repositories/PrismaConversacionesRepository';
import { PrismaMensajesRepository } from '../../infrastructure/repositories/PrismaMensajesRepository';
import { PrismaLecturasConversacionRepository } from '../../infrastructure/repositories/PrismaLecturasConversacionRepository';
import { PrismaMediaRepository } from '../../infrastructure/repositories/PrismaMediaRepository';
import { PrismaCentroSaludRepository } from '../../infrastructure/repositories/PrismaCentroSaludRepository';
import { PrismaCondicionMedicaRepository } from '../../infrastructure/repositories/PrismaCondicionMedicaRepository';
import { PrismaSeguroMedicoRepository } from '../../infrastructure/repositories/PrismaSeguroMedicoRepository';
import { PrismaTipoSeguroRepository } from '../../infrastructure/repositories/PrismaTipoSeguroRepository';
import { PrismaServicioRepository } from '../../infrastructure/repositories/PrismaServicioRepository';
import { PrismaFavoritoRepository } from '../../infrastructure/repositories/PrismaFavoritoRepository';
import { PrismaCitaRepository } from '../../infrastructure/repositories/PrismaCitaRepository';

import { PrismaInactividadRepository } from '../../infrastructure/repositories/PrismaInactividadRepository';
import { CitaController } from '../../infrastructure/http/controllers/CitaController';
import { TeleconsultaController } from '../../infrastructure/http/controllers/TeleconsultaController';
import { FinalizarTeleconsultaUseCase } from '../../application/use-cases/teleconsultas/FinalizarTeleconsultaUseCase';
import { MediaController } from '../../infrastructure/http/controllers/MediaController';
import { PrismaResenaRepository } from '../../infrastructure/repositories/PrismaResenaRepository';
import { ResenaController } from '../../infrastructure/http/controllers/ResenaController';

import { BcryptPasswordHasher } from '../../infrastructure/external-services/BcryptPasswordHasher';
import { LibreTranslateService } from '../../infrastructure/external-services/LibreTranslateService';
import { TranslationHydrator } from '../../infrastructure/services/TranslationHydrator';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';

import { NotificacionesWebSocketService } from '../../infrastructure/external-services/NotificacionesWebSocketService';
import { ChatWebSocketService } from '../../infrastructure/external-services/ChatWebSocketService';
import { prisma } from '../../infrastructure/database/prisma/client';
import { SupabaseStorageService } from '../../infrastructure/external-services/SupabaseStorageService';
import { NodemailerEmailService } from '../../infrastructure/external-services/NodemailerEmailService';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { DailyVideoService } from '../../infrastructure/external-services/DailyVideoService';

// Validadores
import { ProvinciaValidator } from '../../domain/validators/Provincias/ProvinciaValidator';
import { MunicipioValidator } from '../../domain/validators/Municipios/MunicipioValidator';
import { DistritoMunicipalValidator } from '../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator';
import { SeccionValidator } from '../../domain/validators/Secciones/SeccionValidator';
import { BarrioValidator } from '../../domain/validators/Barrios/BarrioValidator';
import { UbicacionValidator } from '../../domain/validators/Ubicaciones/UbicacionValidator';
import { HorarioValidator } from '../../domain/validators/Horarios/HorarioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { ValidadorServicioHorario } from '../../domain/validators/ServiciosHorarios/ValidadorServicioHorario';
import { EspecialidadValidator } from '../../domain/validators/Especialidades/EspecialidadValidator';
import { PacienteValidator } from '../../domain/validators/Pacientes/PacienteValidator';
import { DoctorValidator } from '../../domain/validators/Doctores/DoctorValidator';
import { TipoCentroSaludValidator } from '../../domain/validators/TiposCentrosSalud/TipoCentroSaludValidator';

import { ExperienciaLaboralValidator } from '../../domain/validators/ExperienciasLaborales/ExperienciaLaboralValidator';
import { FormacionAcademicaValidator } from '../../domain/validators/FormacionesAcademicas/FormacionAcademicaValidator';
import { CentroSaludValidator } from '../../domain/validators/CentrosSalud/CentroSaludValidator';
import { CondicionMedicaValidator } from '../../domain/validators/CondicionesMedicas/CondicionMedicaValidator';

// UseCases
import { GestionarProvinciasUseCase } from '../../application/use-cases/GestionarProvinciasUseCase';
import { GestionarMunicipiosUseCase } from '../../application/use-cases/GestionarMunicipiosUseCase';
import { GestionarDistritosMunicipalesUseCase } from '../../application/use-cases/GestionarDistritosMunicipalesUseCase';
import { GestionarBarriosUseCase } from '../../application/use-cases/GestionarBarriosUseCase';
import { GestionarUbicacionesUseCase } from '../../application/use-cases/GestionarUbicacionesUseCase';
import { GestionarHorariosUseCase } from '../../application/use-cases/GestionarHorariosUseCase';
import { GestionarSeccionesUseCase } from '../../application/use-cases/GestionarSeccionesUseCase';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/RegistrarUsuarioUseCase';
import { SolicitarCodigoRegistroUseCase } from '../../application/use-cases/SolicitarCodigoRegistroUseCase';
import { ValidarCodigoRegistroUseCase } from '../../application/use-cases/ValidarCodigoRegistroUseCase';
import { RegistrarDoctorUseCase } from '../../application/use-cases/RegistrarDoctorUseCase';
import { VerificarDocumentoUseCase } from '../../application/use-cases/VerificarDocumentoUseCase';
import { AprobarRechazarDocumentoUseCase } from '../../application/use-cases/AprobarRechazarDocumentoUseCase';
import { RegistrarPacienteUseCase } from '../../application/use-cases/RegistrarPacienteUseCase';
import { LoginGoogleUseCase } from '../../application/use-cases/LoginGoogleUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { GestionarEspecialidadesUseCase } from '../../application/use-cases/GestionarEspecialidadesUseCase';
import { GestionarPacientesUseCase } from '../../application/use-cases/GestionarPacientesUseCase';
import { GestionarDoctoresUseCase } from '../../application/use-cases/GestionarDoctoresUseCase';
import { GestionarDoctorIdiomasUseCase } from '../../application/use-cases/GestionarDoctorIdiomasUseCase';
import { GestionarConversacionesUseCase } from '../../application/use-cases/GestionarConversacionesUseCase';
import { GestionarMensajesUseCase } from '../../application/use-cases/GestionarMensajesUseCase';
import { GestionarMediaUseCase } from '../../application/use-cases/GestionarMediaUseCase';
import { GestionarTiposCentrosSaludUseCase } from '../../application/use-cases/GestionarTiposCentrosSaludUseCase';
import { GestionarExperienciasLaboralesUseCase } from '../../application/use-cases/GestionarExperienciasLaboralesUseCase';
import { GestionarFormacionesAcademicasUseCase } from '../../application/use-cases/GestionarFormacionesAcademicasUseCase';
import { GestionarPaisesUseCase } from '../../application/use-cases/GestionarPaisesUseCase';
import { GestionarUniversidadesUseCase } from '../../application/use-cases/GestionarUniversidadesUseCase';
import { GestionarServicioHorariosUseCase } from '../../application/use-cases/GestionarServicioHorariosUseCase';
import { GestionarNotificacionesUseCase } from '../../application/use-cases/GestionarNotificacionesUseCase';
import { EnviarNotificacionUseCase } from '../../application/use-cases/notificaciones/EnviarNotificacionUseCase';
import { ObtenerNotificacionesUseCase } from '../../application/use-cases/notificaciones/ObtenerNotificacionesUseCase';
import { MarcarNotificacionLeidaUseCase } from '../../application/use-cases/notificaciones/MarcarNotificacionLeidaUseCase';
import { NotificacionesController } from '../../infrastructure/http/controllers/NotificacionesController';
import { RefreshAccessTokenUseCase } from '../../application/use-cases/RefreshAccessTokenUseCase';
import { CompletarPerfilCentroSaludUseCase } from '../../application/use-cases/CompletarPerfilCentroSaludUseCase';
import { RegistrarCentroUseCase } from '../../application/use-cases/RegistrarCentroUseCase';
import { ActualizarFotoPerfilUseCase } from '../../application/use-cases/ActualizarFotoPerfilUseCase';
import { ActualizarBannerUseCase } from '../../application/use-cases/ActualizarBannerUseCase';
import { CambiarEmailUseCase } from '../../application/use-cases/CambiarEmailUseCase';
import { EliminarCuentaUseCase } from '../../application/use-cases/EliminarCuentaUseCase';
import { VerificarIdentidadUseCase } from '../../application/use-cases/VerificarIdentidadUseCase';
import { CentrosSaludController } from '../../infrastructure/http/controllers/CentrosSaludController';
import { GestionarCondicionesMedicasUseCase } from '../../application/use-cases/GestionarCondicionesMedicasUseCase';
import { GestionarServiciosUseCase } from '../../application/use-cases/GestionarServiciosUseCase';
import { GestionarFavoritosUseCase } from '../../application/use-cases/GestionarFavoritosUseCase';
import { GestionarCentroSaludUseCase } from '../../application/use-cases/GestionarCentroSaludUseCase';
import { GestionarSolicitudesAlianzaUseCase } from '../../application/use-cases/GestionarSolicitudesAlianzaUseCase';
import { GestionarCitasUseCase } from '../../application/use-cases/GestionarCitasUseCase';
import { GestionarResenasUseCase } from '../../application/use-cases/GestionarResenasUseCase';
import { IVideoService } from '../../application/interfaces/IVideoService';
import { IniciarTeleconsultaUseCase } from '../../application/use-cases/teleconsultas/IniciarTeleconsultaUseCase';

// ===== REGISTRAR SERVICIOS EXTERNOS =====
container.register<PrismaClient>('PrismaClient', {
  useValue: prisma
});

const redisCacheService = new RedisCacheService();
container.register(RedisCacheService, {
  useValue: redisCacheService
});

container.registerSingleton(AuthService, AuthService);

container.register<IEmailService>('EmailService', {
  useClass: NodemailerEmailService
});

container.registerSingleton(ChatWebSocketService);

container.registerSingleton(NotificacionesWebSocketService);

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


container.register(UbicacionValidator, {
  useFactory: () => {
    const barriosRepository = container.resolve<IBarriosRepository>('BarriosRepository');
    return new UbicacionValidator(barriosRepository);
  }
});

container.register(HorarioValidator, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const horariosRepository = container.resolve<IHorariosRepository>('HorariosRepository');
    return new HorarioValidator(usuarioRepository, horariosRepository);
  }
});

container.register(ValidadorServicioHorario, {
  useFactory: () => {
    return new ValidadorServicioHorario();
  }
});


container.register(EspecialidadValidator, {
  useFactory: () => {
    const repo = container.resolve<IEspecialidadRepository>('EspecialidadRepository');
    return new EspecialidadValidator(repo);
  }
});

container.register(PacienteValidator, {
  useFactory: () => {
    const repo = container.resolve<IPacienteRepository>('PacienteRepository');
    return new PacienteValidator(repo);
  }
});

container.register(DoctorValidator, {
  useFactory: () => {
    const repo = container.resolve<IDoctorRepository>('DoctorRepository');
    return new DoctorValidator(repo);
  }
});

container.register(TipoCentroSaludValidator, {
  useFactory: () => {
    const repo = container.resolve<ITipoCentroSaludRepository>('TipoCentroSaludRepository');
    return new TipoCentroSaludValidator(repo);
  }
});

container.register(CentroSaludValidator, {
  useFactory: () => {
    return new CentroSaludValidator();
  }
});




container.register(ExperienciaLaboralValidator, {
  useFactory: () => {
    const repo = container.resolve<IExperienciaLaboralRepository>('IExperienciaLaboralRepository');
    return new ExperienciaLaboralValidator(repo);
  }
});

container.register(FormacionAcademicaValidator, {
  useFactory: () => {
    return new FormacionAcademicaValidator();
  }
});


container.register(CondicionMedicaValidator, {
  useFactory: () => {
    const repo = container.resolve<ICondicionMedicaRepository>('CondicionMedicaRepository');
    return new CondicionMedicaValidator(repo);
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


container.register<IEspecialidadRepository>(
  'EspecialidadRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaEspecialidadRepository(prismaClient);
    }
  }
);

container.register<IPacienteRepository>(
  'PacienteRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaPacienteRepository(prismaClient);
    }
  }
);

container.register<IDoctorRepository>(
  'DoctorRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaDoctorRepository(prismaClient);
    }
  }
);

container.register<IDoctorIdiomaRepository>(
  'DoctorIdiomaRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaDoctorIdiomaRepository(prismaClient);
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

container.register<ICentroSaludRepository>(
  'CentroSaludRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaCentroSaludRepository(prismaClient, redisCache);
    }
  } as any
);

container.register<ISolicitudAlianzaRepository>(
  'SolicitudAlianzaRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaSolicitudAlianzaRepository(prismaClient);
    }
  } as any
);

container.register(GestionarCentroSaludUseCase, {
  useFactory: () => {
    const centroRepo = container.resolve<ICentroSaludRepository>('CentroSaludRepository');
    const supabase = container.resolve(SupabaseStorageService);
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    return new GestionarCentroSaludUseCase(centroRepo, supabase, prismaClient);
  }
});

container.register(GestionarSolicitudesAlianzaUseCase, {
  useFactory: () => {
    const solicitudRepo = container.resolve<ISolicitudAlianzaRepository>('SolicitudAlianzaRepository');
    const centroRepo = container.resolve<ICentroSaludRepository>('CentroSaludRepository');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new GestionarSolicitudesAlianzaUseCase(solicitudRepo, centroRepo, enviarNotifUC);
  }
});



container.register<IExperienciaLaboralRepository>(
  'IExperienciaLaboralRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaExperienciaLaboralRepository(prismaClient, redisCache);
    }
  } as any
);

container.register<IFormacionAcademicaRepository>(
  'IFormacionAcademicaRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaFormacionAcademicaRepository(prismaClient, redisCache);
    }
  } as any
);

container.register<IPaisRepository>(
  'IPaisRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve<RedisCacheService>(RedisCacheService);
      return new PrismaPaisRepository(prismaClient, redisCache);
    }
  } as any
);

container.register<IUniversidadRepository>(
  'IUniversidadRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve<RedisCacheService>(RedisCacheService);
      return new PrismaUniversidadRepository(prismaClient, redisCache);
    }
  } as any
);


container.register<ICondicionMedicaRepository>(
  'CondicionMedicaRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaCondicionMedicaRepository(prismaClient);
    }
  } as any
);

container.register<IUsuarioRepository>(
  'UsuarioRepository',
  { useClass: PrismaUsuarioRepository }
);

container.register<INotificacionesRepository>(
  'NotificacionesRepository',
  { useClass: PrismaNotificacionesRepository }
);

// ===== REGISTRAR REPOSITORIOS DE CHAT (Compañero) =====
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

container.register<ISeguroMedicoRepository>(
  'SeguroMedicoRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaSeguroMedicoRepository(prismaClient);
    }
  }
);

container.register<ITipoSeguroRepository>(
  'TipoSeguroRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaTipoSeguroRepository(prismaClient);
    }
  }
);

container.register<IServicioRepository>(
  'ServicioRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      const redisCache = container.resolve(RedisCacheService);
      return new PrismaServicioRepository(prismaClient, redisCache);
    }
  }
);

container.register<IFavoritoRepository>(
  'FavoritoRepository',
  {
    useFactory: () => {
      const prismaClient = container.resolve<PrismaClient>('PrismaClient');
      return new PrismaFavoritoRepository(prismaClient);
    }
  }
);

container.register(GestionarFavoritosUseCase, {
  useFactory: () => {
    const favRepo = container.resolve<IFavoritoRepository>('FavoritoRepository');
    const doctorRepo = container.resolve<IDoctorRepository>('DoctorRepository');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new GestionarFavoritosUseCase(favRepo, doctorRepo, enviarNotifUC);
  }
});


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


container.register(GestionarUbicacionesUseCase, {
  useFactory: () => {
    const ubicacionesRepository = container.resolve<IUbicacionesRepository>('UbicacionesRepository');
    const ubicacionValidator = container.resolve(UbicacionValidator);
    const hydrator = container.resolve(TranslationHydrator);
    return new GestionarUbicacionesUseCase(ubicacionValidator, ubicacionesRepository, hydrator);
  }
});

container.register(GestionarHorariosUseCase, {
  useFactory: () => {
    const horariosRepository = container.resolve<IHorariosRepository>('HorariosRepository');
    const horarioValidator = container.resolve(HorarioValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new GestionarHorariosUseCase(horariosRepository, horarioValidator, estadoValidator, enviarNotifUC);
  }
});

container.register(RegistrarUsuarioUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new RegistrarUsuarioUseCase(usuarioRepository, passwordHasher);
  }
});

// Registrar Use Cases de Autenticación y Registro (Tuyos)
container.register(SolicitarCodigoRegistroUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const emailService = container.resolve<IEmailService>('EmailService');
    const redisService = container.resolve(RedisCacheService);
    return new SolicitarCodigoRegistroUseCase(usuarioRepository, emailService, redisService);
  }
});

container.register(ValidarCodigoRegistroUseCase, {
  useFactory: () => {
    const redisService = container.resolve(RedisCacheService);
    const authService = container.resolve(AuthService);
    return new ValidarCodigoRegistroUseCase(redisService, authService);
  }
});

container.register(RegistrarDoctorUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const especialidadRepository = container.resolve<IEspecialidadRepository>('EspecialidadRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    const storageService = container.resolve<IStorageService>('StorageService');
    const authService = container.resolve(AuthService);
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new RegistrarDoctorUseCase(usuarioRepository, especialidadRepository, passwordHasher, storageService, authService, enviarNotifUC);
  }
});

container.register('VerificarDocumentoUseCase', {
  useClass: VerificarDocumentoUseCase,
});

container.register(AprobarRechazarDocumentoUseCase, {
  useFactory: () => {
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new AprobarRechazarDocumentoUseCase(enviarNotifUC);
  }
});

container.register(RegistrarPacienteUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    const storageService = container.resolve<IStorageService>('StorageService');
    const authService = container.resolve(AuthService);
    return new RegistrarPacienteUseCase(usuarioRepository, passwordHasher, storageService, authService);
  }
});

container.register(LoginGoogleUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const authService = container.resolve(AuthService);
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new LoginGoogleUseCase(usuarioRepository, authService, passwordHasher);
  }
});

container.register(LoginUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    const authService = container.resolve(AuthService);
    return new LoginUseCase(usuarioRepository, passwordHasher, authService);
  }
});


container.register(GestionarEspecialidadesUseCase, {
  useFactory: () => {
    const repo = container.resolve<IEspecialidadRepository>('EspecialidadRepository');
    const validator = container.resolve(EspecialidadValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    const hydrator = container.resolve(TranslationHydrator);
    return new GestionarEspecialidadesUseCase(repo, validator, estadoValidator, hydrator);
  }
});

container.register(GestionarPacientesUseCase, {
  useFactory: () => {
    const repo = container.resolve<IPacienteRepository>('PacienteRepository');
    const validator = container.resolve(PacienteValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    return new GestionarPacientesUseCase(repo, validator, estadoValidator);
  }
});

container.register(GestionarDoctoresUseCase, {
  useFactory: () => {
    const repo = container.resolve<IDoctorRepository>('DoctorRepository');
    const citaRepo = container.resolve<ICitaRepository>('CitaRepository');
    const validator = container.resolve(DoctorValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    return new GestionarDoctoresUseCase(repo, citaRepo, validator, estadoValidator, prismaClient);
  }
});

container.register(GestionarDoctorIdiomasUseCase, {
  useFactory: () => {
    const repo = container.resolve<IDoctorIdiomaRepository>('DoctorIdiomaRepository');
    return new GestionarDoctorIdiomasUseCase(repo);
  }
});

container.register(GestionarTiposCentrosSaludUseCase, {
  useFactory: () => {
    const repo = container.resolve<ITipoCentroSaludRepository>('TipoCentroSaludRepository');
    const validator = container.resolve(TipoCentroSaludValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    const hydrator = container.resolve(TranslationHydrator);
    return new GestionarTiposCentrosSaludUseCase(repo, validator, estadoValidator, hydrator);
  }
});



container.register(GestionarExperienciasLaboralesUseCase, {
  useFactory: () => {
    const repo = container.resolve<IExperienciaLaboralRepository>('IExperienciaLaboralRepository');
    const validator = container.resolve(ExperienciaLaboralValidator);
    return new GestionarExperienciasLaboralesUseCase(repo, validator);
  }
});

container.register('GestionarExperienciasLaboralesUseCase', {
  useFactory: () => {
    return container.resolve(GestionarExperienciasLaboralesUseCase);
  }
});

container.register(GestionarFormacionesAcademicasUseCase, {
  useFactory: () => {
    const repo = container.resolve<IFormacionAcademicaRepository>('IFormacionAcademicaRepository');
    const validator = container.resolve(FormacionAcademicaValidator);
    return new GestionarFormacionesAcademicasUseCase(repo, validator);
  }
});

container.register('GestionarFormacionesAcademicasUseCase', {
  useFactory: () => {
    return container.resolve(GestionarFormacionesAcademicasUseCase);
  }
});

container.register(GestionarPaisesUseCase, {
  useFactory: () => {
    const repo = container.resolve<IPaisRepository>('IPaisRepository');
    return new GestionarPaisesUseCase(repo);
  }
});

container.register('GestionarPaisesUseCase', {
  useFactory: () => {
    return container.resolve(GestionarPaisesUseCase);
  }
});

container.register(GestionarUniversidadesUseCase, {
  useFactory: () => {
    const universidadRepo = container.resolve<IUniversidadRepository>('IUniversidadRepository');
    const paisRepo = container.resolve<IPaisRepository>('IPaisRepository');
    return new GestionarUniversidadesUseCase(universidadRepo, paisRepo);
  }
});

container.register('GestionarUniversidadesUseCase', {
  useFactory: () => {
    return container.resolve(GestionarUniversidadesUseCase);
  }
});


container.register(GestionarServicioHorariosUseCase, {
  useFactory: () => {
    const servicioHorarioRepository = container.resolve<IServicioHorarioRepository>('ServicioHorarioRepository');
    return new GestionarServicioHorariosUseCase(servicioHorarioRepository);
  }
});

// Casos de Uso de Notificaciones y Chat (Compañero)
container.register(GestionarNotificacionesUseCase, {
  useFactory: () => {
    const notificacionesRepository = container.resolve<INotificacionesRepository>('NotificacionesRepository');
    return new GestionarNotificacionesUseCase(notificacionesRepository);
  }
});

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
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new GestionarMensajesUseCase(mensajesRepository, conversacionesRepository, lecturasRepository, mediaRepository, enviarNotifUC);
  }
});

container.register(GestionarMediaUseCase, {
  useFactory: () => {
    const mediaRepository = container.resolve<IMediaRepository>('MediaRepository');
    const storageService = container.resolve<IStorageService>('StorageService');
    return new GestionarMediaUseCase(mediaRepository, storageService);
  }
});

container.register(GestionarCondicionesMedicasUseCase, {
  useFactory: () => {
    const repo = container.resolve<ICondicionMedicaRepository>('CondicionMedicaRepository');
    const validator = container.resolve(CondicionMedicaValidator);
    const estadoValidator = container.resolve(EstadoValidator);
    const hydrator = container.resolve(TranslationHydrator);
    return new GestionarCondicionesMedicasUseCase(repo, validator, estadoValidator, hydrator);
  }
});

container.register('GestionarCondicionesMedicasUseCase', {
  useFactory: () => {
    return container.resolve(GestionarCondicionesMedicasUseCase);
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

// Registro del Storage Service (Tuyo)
container.registerSingleton<IStorageService>('StorageService', SupabaseStorageService);

container.register(CompletarPerfilCentroSaludUseCase, {
  useFactory: () => {
    const prisma = container.resolve<PrismaClient>('PrismaClient');
    const centroRepo = container.resolve<ICentroSaludRepository>('CentroSaludRepository');
    const ubicacionRepo = container.resolve<IUbicacionesRepository>('UbicacionesRepository');
    const tipoRepo = container.resolve<ITipoCentroSaludRepository>('TipoCentroSaludRepository');
    const storage = container.resolve<IStorageService>('StorageService');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    const validator = container.resolve(CentroSaludValidator);
    const ubicValidator = container.resolve(UbicacionValidator);

    return new CompletarPerfilCentroSaludUseCase(
      prisma,
      centroRepo,
      ubicacionRepo,
      tipoRepo,
      storage,
      passwordHasher,
      validator,
      ubicValidator
    );
  }
});

container.register(RegistrarCentroUseCase, {
  useFactory: () => {
    const prisma = container.resolve<PrismaClient>('PrismaClient');
    const usuarioRepo = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const centroRepo = container.resolve<ICentroSaludRepository>('CentroSaludRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    const storage = container.resolve<IStorageService>('StorageService');
    const authService = container.resolve(AuthService);

    return new RegistrarCentroUseCase(
      prisma,
      usuarioRepo,
      centroRepo,
      passwordHasher,
      storage,
      authService
    );
  }
});

container.register(CentrosSaludController, {
  useFactory: () => {
    const completarPerfilUseCase = container.resolve(CompletarPerfilCentroSaludUseCase);
    const registrarCentroUseCase = container.resolve(RegistrarCentroUseCase);
    return new CentrosSaludController(
      completarPerfilUseCase,
      registrarCentroUseCase,
      container.resolve(GestionarCentroSaludUseCase),
      container.resolve(GestionarSolicitudesAlianzaUseCase)
    );
  }
});

container.register(RefreshAccessTokenUseCase, {
  useFactory: () => {
    const authService = container.resolve(AuthService);
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    return new RefreshAccessTokenUseCase(authService, usuarioRepository);
  }
});

container.register(ActualizarFotoPerfilUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const storageService = container.resolve(SupabaseStorageService);
    return new ActualizarFotoPerfilUseCase(usuarioRepository, storageService);
  }
});

container.register(ActualizarBannerUseCase, {
  useFactory: () => {
    const usuarioRepository = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const storageService = container.resolve(SupabaseStorageService);
    return new ActualizarBannerUseCase(usuarioRepository, storageService);
  }
});

container.register(CambiarEmailUseCase, {
  useFactory: () => {
    const usuarioRepo = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new CambiarEmailUseCase(usuarioRepo, passwordHasher);
  }
});

container.register(EliminarCuentaUseCase, {
  useFactory: () => {
    const usuarioRepo = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new EliminarCuentaUseCase(usuarioRepo, passwordHasher);
  }
});

container.register(VerificarIdentidadUseCase, {
  useFactory: () => {
    const usuarioRepo = container.resolve<IUsuarioRepository>('UsuarioRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('PasswordHasher');
    return new VerificarIdentidadUseCase(usuarioRepo, passwordHasher);
  }
});

container.register(GestionarServiciosUseCase, {
  useFactory: () => {
    const servicioRepository = container.resolve<IServicioRepository>('ServicioRepository');
    const storageService = container.resolve<IStorageService>('StorageService');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    const hydrator = container.resolve(TranslationHydrator);
    return new GestionarServiciosUseCase(servicioRepository, storageService, enviarNotifUC, hydrator);
  }
});

container.register<ICitaRepository>('CitaRepository', {
  useFactory: () => {
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    return new PrismaCitaRepository(prismaClient);
  }
});



container.register<IInactividadRepository>('InactividadRepository', {
  useFactory: () => {
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    return new PrismaInactividadRepository(prismaClient);
  }
});

container.register(GestionarCitasUseCase, {
  useFactory: () => {
    const citaRepo = container.resolve<ICitaRepository>('CitaRepository');
    const doctorRepo = container.resolve<IDoctorRepository>('DoctorRepository');
    const pacienteRepo = container.resolve<IPacienteRepository>('PacienteRepository');
    const inactividadRepo = container.resolve<IInactividadRepository>('InactividadRepository');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    const storageService = container.resolve(SupabaseStorageService);
    return new GestionarCitasUseCase(citaRepo, doctorRepo, pacienteRepo, inactividadRepo, enviarNotifUC, storageService);
  }
});

container.register(CitaController, {
  useFactory: () => {
    const useCase = container.resolve(GestionarCitasUseCase);
    return new CitaController(useCase);
  }
});

container.register<IVideoService>('VideoService', {
  useClass: DailyVideoService,
});

container.register(IniciarTeleconsultaUseCase, {
  useFactory: () => {
    const citaRepo = container.resolve<ICitaRepository>('CitaRepository');
    const conversacionesRepo = container.resolve<IConversacionesRepository>('ConversacionesRepository');
    const videoService = container.resolve<IVideoService>('VideoService');
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new IniciarTeleconsultaUseCase(citaRepo, conversacionesRepo, videoService, prismaClient, enviarNotifUC);
  }
});

container.register(FinalizarTeleconsultaUseCase, {
  useFactory: () => {
    const citaRepo = container.resolve<ICitaRepository>('CitaRepository');
    const videoService = container.resolve<IVideoService>('VideoService');
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new FinalizarTeleconsultaUseCase(citaRepo, videoService, prismaClient, enviarNotifUC);
  }
});

container.register(TeleconsultaController, {
  useFactory: () => {
    const iniciarUseCase = container.resolve(IniciarTeleconsultaUseCase);
    const finalizarUseCase = container.resolve(FinalizarTeleconsultaUseCase);
    return new TeleconsultaController(iniciarUseCase, finalizarUseCase);
  }
});

export { container };

container.register<IResenaRepository>('ResenaRepository', {
  useFactory: () => {
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    return new PrismaResenaRepository(prismaClient);
  }
});

container.register(GestionarResenasUseCase, {
  useFactory: () => {
    const resenaRepo = container.resolve<IResenaRepository>('ResenaRepository');
    const enviarNotifUC = container.resolve(EnviarNotificacionUseCase);
    return new GestionarResenasUseCase(resenaRepo, enviarNotifUC);
  }
});

container.register(ResenaController, {
  useFactory: () => {
    const useCase = container.resolve(GestionarResenasUseCase);
    return new ResenaController(useCase);
  }
});

container.register(MediaController, {
  useFactory: () => new MediaController()
});

// ─── Notificaciones ───────────────────────────────────────────────────────────

container.register<INotificacionesRepository>('NotificacionesRepository', {
  useFactory: () => {
    const prismaClient = container.resolve<PrismaClient>('PrismaClient');
    return new PrismaNotificacionesRepository(prismaClient);
  }
});

container.register(GestionarNotificacionesUseCase, {
  useFactory: () => {
    const repo = container.resolve<INotificacionesRepository>('NotificacionesRepository');
    return new GestionarNotificacionesUseCase(repo);
  }
});

container.register(EnviarNotificacionUseCase, {
  useFactory: () => {
    const repo = container.resolve<INotificacionesRepository>('NotificacionesRepository');
    const ws = container.resolve(NotificacionesWebSocketService);
    return new EnviarNotificacionUseCase(repo, ws);
  }
});

container.register(ObtenerNotificacionesUseCase, {
  useFactory: () => {
    const repo = container.resolve<INotificacionesRepository>('NotificacionesRepository');
    return new ObtenerNotificacionesUseCase(repo);
  }
});

container.register(MarcarNotificacionLeidaUseCase, {
  useFactory: () => {
    const repo = container.resolve<INotificacionesRepository>('NotificacionesRepository');
    const ws = container.resolve(NotificacionesWebSocketService);
    return new MarcarNotificacionLeidaUseCase(repo, ws);
  }
});

container.register(NotificacionesController, {
  useFactory: () => {
    const obtenerUC = container.resolve(ObtenerNotificacionesUseCase);
    const marcarUC = container.resolve(MarcarNotificacionLeidaUseCase);
    const gestionarUC = container.resolve(GestionarNotificacionesUseCase);
    return new NotificacionesController(obtenerUC, marcarUC, gestionarUC);
  }
});

