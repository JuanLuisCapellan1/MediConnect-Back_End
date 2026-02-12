"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const tsyringe_1 = require("tsyringe");
Object.defineProperty(exports, "container", { enumerable: true, get: function () { return tsyringe_1.container; } });
// Implementaciones
const PrismaUsuarioRepository_1 = require("../../infrastructure/repositories/PrismaUsuarioRepository");
const PrismaProvinciasRepository_1 = require("../../infrastructure/repositories/PrismaProvinciasRepository");
const PrismaMunicipiosRepository_1 = require("../../infrastructure/repositories/PrismaMunicipiosRepository");
const PrismaDistritosMunicipalesRepository_1 = require("../../infrastructure/repositories/PrismaDistritosMunicipalesRepository");
const PrismaSeccionesRepository_1 = require("../../infrastructure/repositories/PrismaSeccionesRepository");
const PrismaBarriosRepository_1 = require("../../infrastructure/repositories/PrismaBarriosRepository");
const PrismaSubBarriosRepository_1 = require("../../infrastructure/repositories/PrismaSubBarriosRepository");
const PrismaUbicacionesRepository_1 = require("../../infrastructure/repositories/PrismaUbicacionesRepository");
const PrismaHorariosRepository_1 = require("../../infrastructure/repositories/PrismaHorariosRepository");
const PrismaServicioHorarioRepository_1 = require("../../infrastructure/repositories/PrismaServicioHorarioRepository");
const PrismaTipoServicioRepository_1 = require("../../infrastructure/repositories/PrismaTipoServicioRepository");
const PrismaEspecialidadRepository_1 = require("../../infrastructure/repositories/PrismaEspecialidadRepository");
const PrismaTipoCentroSaludRepository_1 = require("../../infrastructure/repositories/PrismaTipoCentroSaludRepository");
const PrismaProfesionesRepository_1 = require("../../infrastructure/repositories/PrismaProfesionesRepository");
const PrismaExperienciasLaboralesRepository_1 = require("../../infrastructure/repositories/PrismaExperienciasLaboralesRepository");
// Implementaciones de tu compañero
const PrismaNotificacionesRepository_1 = require("../../infrastructure/repositories/PrismaNotificacionesRepository");
const PrismaConversacionesRepository_1 = require("../../infrastructure/repositories/PrismaConversacionesRepository");
const PrismaMensajesRepository_1 = require("../../infrastructure/repositories/PrismaMensajesRepository");
const PrismaLecturasConversacionRepository_1 = require("../../infrastructure/repositories/PrismaLecturasConversacionRepository");
const PrismaMediaRepository_1 = require("../../infrastructure/repositories/PrismaMediaRepository");
const PrismaCentroSaludRepository_1 = require("../../infrastructure/repositories/PrismaCentroSaludRepository");
const BcryptPasswordHasher_1 = require("../../infrastructure/external-services/BcryptPasswordHasher");
const LibreTranslateService_1 = require("../../infrastructure/external-services/LibreTranslateService");
const RedisCacheService_1 = require("../../infrastructure/external-services/RedisCacheService");
const NotificacionesWebSocketService_1 = require("../../infrastructure/external-services/NotificacionesWebSocketService");
const ChatWebSocketService_1 = require("../../infrastructure/external-services/ChatWebSocketService");
const client_1 = require("../../infrastructure/database/prisma/client");
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
const NodemailerEmailService_1 = require("../../infrastructure/external-services/NodemailerEmailService");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
// Validadores
const ProvinciaValidator_1 = require("../../domain/validators/Provincias/ProvinciaValidator");
const MunicipioValidator_1 = require("../../domain/validators/Municipios/MunicipioValidator");
const DistritoMunicipalValidator_1 = require("../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator");
const SeccionValidator_1 = require("../../domain/validators/Secciones/SeccionValidator");
const BarrioValidator_1 = require("../../domain/validators/Barrios/BarrioValidator");
const SubBarrioValidator_1 = require("../../domain/validators/SubBarrios/SubBarrioValidator");
const UbicacionValidator_1 = require("../../domain/validators/Ubicaciones/UbicacionValidator");
const HorarioValidator_1 = require("../../domain/validators/Horarios/HorarioValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
const ValidadorServicioHorario_1 = require("../../domain/validators/ServiciosHorarios/ValidadorServicioHorario");
const TipoServicioValidator_1 = require("../../domain/validators/TiposServicios/TipoServicioValidator");
const EspecialidadValidator_1 = require("../../domain/validators/Especialidades/EspecialidadValidator");
const TipoCentroSaludValidator_1 = require("../../domain/validators/TiposCentrosSalud/TipoCentroSaludValidator");
const ProfesionValidator_1 = require("../../domain/validators/Profesiones/ProfesionValidator");
const ExperienciaLaboralValidator_1 = require("../../domain/validators/ExperienciasLaborales/ExperienciaLaboralValidator");
const CentroSaludValidator_1 = require("../../domain/validators/CentrosSalud/CentroSaludValidator");
// UseCases
const GestionarProvinciasUseCase_1 = require("../../application/use-cases/GestionarProvinciasUseCase");
const GestionarMunicipiosUseCase_1 = require("../../application/use-cases/GestionarMunicipiosUseCase");
const GestionarDistritosMunicipalesUseCase_1 = require("../../application/use-cases/GestionarDistritosMunicipalesUseCase");
const GestionarBarriosUseCase_1 = require("../../application/use-cases/GestionarBarriosUseCase");
const GestionarSubBarriosUseCase_1 = require("../../application/use-cases/GestionarSubBarriosUseCase");
const GestionarUbicacionesUseCase_1 = require("../../application/use-cases/GestionarUbicacionesUseCase");
const GestionarHorariosUseCase_1 = require("../../application/use-cases/GestionarHorariosUseCase");
const GestionarSeccionesUseCase_1 = require("../../application/use-cases/GestionarSeccionesUseCase");
const RegistrarUsuarioUseCase_1 = require("../../application/use-cases/RegistrarUsuarioUseCase");
// Tus UseCases
const SolicitarCodigoRegistroUseCase_1 = require("../../application/use-cases/SolicitarCodigoRegistroUseCase");
const ValidarCodigoRegistroUseCase_1 = require("../../application/use-cases/ValidarCodigoRegistroUseCase");
const RegistrarDoctorUseCase_1 = require("../../application/use-cases/RegistrarDoctorUseCase");
const RegistrarPacienteUseCase_1 = require("../../application/use-cases/RegistrarPacienteUseCase");
const LoginGoogleUseCase_1 = require("../../application/use-cases/LoginGoogleUseCase");
const LoginUseCase_1 = require("../../application/use-cases/LoginUseCase");
// UseCases de tu compañero
const GestionarTiposServiciosUseCase_1 = require("../../application/use-cases/GestionarTiposServiciosUseCase");
const GestionarEspecialidadesUseCase_1 = require("../../application/use-cases/GestionarEspecialidadesUseCase");
const GestionarConversacionesUseCase_1 = require("../../application/use-cases/GestionarConversacionesUseCase");
const GestionarMensajesUseCase_1 = require("../../application/use-cases/GestionarMensajesUseCase");
const GestionarMediaUseCase_1 = require("../../application/use-cases/GestionarMediaUseCase");
const GestionarTiposCentrosSaludUseCase_1 = require("../../application/use-cases/GestionarTiposCentrosSaludUseCase");
const GestionarProfesionesUseCase_1 = require("../../application/use-cases/GestionarProfesionesUseCase");
const GestionarExperienciasLaboralesUseCase_1 = require("../../application/use-cases/GestionarExperienciasLaboralesUseCase");
const GestionarServicioHorariosUseCase_1 = require("../../application/use-cases/GestionarServicioHorariosUseCase");
const GestionarNotificacionesUseCase_1 = require("../../application/use-cases/GestionarNotificacionesUseCase");
const RefreshAccessTokenUseCase_1 = require("../../application/use-cases/RefreshAccessTokenUseCase");
const CompletarPerfilCentroSaludUseCase_1 = require("../../application/use-cases/CompletarPerfilCentroSaludUseCase");
const RegistrarCentroUseCase_1 = require("../../application/use-cases/RegistrarCentroUseCase");
const ActualizarFotoPerfilUseCase_1 = require("../../application/use-cases/ActualizarFotoPerfilUseCase");
const CentrosSaludController_1 = require("../../infrastructure/http/controllers/CentrosSaludController");
// ===== REGISTRAR SERVICIOS EXTERNOS =====
// Registrar PrismaClient como singleton
tsyringe_1.container.register('PrismaClient', {
    useValue: client_1.prisma
});
// Registrar RedisCacheService como singleton
const redisCacheService = new RedisCacheService_1.RedisCacheService();
tsyringe_1.container.register(RedisCacheService_1.RedisCacheService, {
    useValue: redisCacheService
});
// Registrar AuthService como singleton (Tuyo)
tsyringe_1.container.registerSingleton(AuthService_1.AuthService, AuthService_1.AuthService);
// Registrar EmailService (Tuyo)
tsyringe_1.container.register('EmailService', {
    useClass: NodemailerEmailService_1.NodemailerEmailService
});
// Registrar ChatWebSocketService como singleton (Compañero)
tsyringe_1.container.registerSingleton(ChatWebSocketService_1.ChatWebSocketService);
// Registrar NotificacionesWebSocketService como singleton (Compañero)
tsyringe_1.container.registerSingleton(NotificacionesWebSocketService_1.NotificacionesWebSocketService);
// ===== REGISTRAR VALIDADORES =====
tsyringe_1.container.register(ProvinciaValidator_1.ProvinciaValidator, {
    useFactory: () => {
        const provinciasRepository = tsyringe_1.container.resolve('ProvinciasRepository');
        return new ProvinciaValidator_1.ProvinciaValidator(provinciasRepository);
    }
});
tsyringe_1.container.register(MunicipioValidator_1.MunicipioValidator, {
    useFactory: () => {
        const municipiosRepository = tsyringe_1.container.resolve('MunicipiosRepository');
        const provinciasRepository = tsyringe_1.container.resolve('ProvinciasRepository');
        return new MunicipioValidator_1.MunicipioValidator(municipiosRepository, provinciasRepository);
    }
});
tsyringe_1.container.register(DistritoMunicipalValidator_1.DistritoMunicipalValidator, {
    useFactory: () => {
        const distritosRepository = tsyringe_1.container.resolve('DistritosMunicipalesRepository');
        const municipiosRepository = tsyringe_1.container.resolve('MunicipiosRepository');
        return new DistritoMunicipalValidator_1.DistritoMunicipalValidator(distritosRepository, municipiosRepository);
    }
});
tsyringe_1.container.register(SeccionValidator_1.SeccionValidator, {
    useFactory: () => {
        const seccionesRepository = tsyringe_1.container.resolve('SeccionesRepository');
        const municipiosRepository = tsyringe_1.container.resolve('MunicipiosRepository');
        const distritosRepository = tsyringe_1.container.resolve('DistritosMunicipalesRepository');
        return new SeccionValidator_1.SeccionValidator(seccionesRepository, distritosRepository, municipiosRepository);
    }
});
tsyringe_1.container.register(BarrioValidator_1.BarrioValidator, {
    useFactory: () => {
        const barriosRepository = tsyringe_1.container.resolve('BarriosRepository');
        const seccionesRepository = tsyringe_1.container.resolve('SeccionesRepository');
        return new BarrioValidator_1.BarrioValidator(barriosRepository, seccionesRepository);
    }
});
tsyringe_1.container.register(SubBarrioValidator_1.SubBarrioValidator, {
    useFactory: () => {
        const subBarriosRepository = tsyringe_1.container.resolve('SubBarriosRepository');
        const barriosRepository = tsyringe_1.container.resolve('BarriosRepository');
        return new SubBarrioValidator_1.SubBarrioValidator(subBarriosRepository, barriosRepository);
    }
});
tsyringe_1.container.register(UbicacionValidator_1.UbicacionValidator, {
    useFactory: () => {
        const barriosRepository = tsyringe_1.container.resolve('BarriosRepository');
        const subBarriosRepository = tsyringe_1.container.resolve('SubBarriosRepository');
        return new UbicacionValidator_1.UbicacionValidator(barriosRepository, subBarriosRepository);
    }
});
tsyringe_1.container.register(HorarioValidator_1.HorarioValidator, {
    useFactory: () => {
        const ubicacionesRepository = tsyringe_1.container.resolve('UbicacionesRepository');
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const horariosRepository = tsyringe_1.container.resolve('HorariosRepository');
        return new HorarioValidator_1.HorarioValidator(ubicacionesRepository, usuarioRepository, horariosRepository);
    }
});
tsyringe_1.container.register(ValidadorServicioHorario_1.ValidadorServicioHorario, {
    useFactory: () => {
        return new ValidadorServicioHorario_1.ValidadorServicioHorario();
    }
});
tsyringe_1.container.register(TipoServicioValidator_1.TipoServicioValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('TipoServicioRepository');
        return new TipoServicioValidator_1.TipoServicioValidator(repo);
    }
});
tsyringe_1.container.register(EspecialidadValidator_1.EspecialidadValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('EspecialidadRepository');
        return new EspecialidadValidator_1.EspecialidadValidator(repo);
    }
});
tsyringe_1.container.register(TipoCentroSaludValidator_1.TipoCentroSaludValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('TipoCentroSaludRepository');
        return new TipoCentroSaludValidator_1.TipoCentroSaludValidator(repo);
    }
});
tsyringe_1.container.register(CentroSaludValidator_1.CentroSaludValidator, {
    useFactory: () => {
        return new CentroSaludValidator_1.CentroSaludValidator();
    }
});
tsyringe_1.container.register(ProfesionValidator_1.ProfesionValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('ProfesionesRepository');
        return new ProfesionValidator_1.ProfesionValidator(repo);
    }
});
tsyringe_1.container.register(ExperienciaLaboralValidator_1.ExperienciaLaboralValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('IExperienciasLaboralesRepository');
        return new ExperienciaLaboralValidator_1.ExperienciaLaboralValidator(repo);
    }
});
tsyringe_1.container.register(EstadoValidator_1.EstadoValidator, {
    useFactory: () => {
        return new EstadoValidator_1.EstadoValidator();
    }
});
// ===== REGISTRAR REPOSITORIOS =====
tsyringe_1.container.register('ProvinciasRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaProvinciasRepository_1.PrismaProvinciasRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('MunicipiosRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaMunicipiosRepository_1.PrismaMunicipiosRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('DistritosMunicipalesRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaDistritosMunicipalesRepository_1.PrismaDistritosMunicipalesRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('SeccionesRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaSeccionesRepository_1.PrismaSeccionesRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('BarriosRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaBarriosRepository_1.PrismaBarriosRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('SubBarriosRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaSubBarriosRepository_1.PrismaSubBarriosRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('UbicacionesRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaUbicacionesRepository_1.PrismaUbicacionesRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('HorariosRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaHorariosRepository_1.PrismaHorariosRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('ServicioHorarioRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaServicioHorarioRepository_1.PrismaServicioHorarioRepository(prismaClient);
    }
});
tsyringe_1.container.register('TipoServicioRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaTipoServicioRepository_1.PrismaTipoServicioRepository(prismaClient);
    }
});
tsyringe_1.container.register('EspecialidadRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaEspecialidadRepository_1.PrismaEspecialidadRepository(prismaClient);
    }
});
tsyringe_1.container.register('TipoCentroSaludRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaTipoCentroSaludRepository_1.PrismaTipoCentroSaludRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('CentroSaludRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaCentroSaludRepository_1.PrismaCentroSaludRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('ProfesionesRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaProfesionesRepository_1.PrismaProfesionesRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('IExperienciasLaboralesRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaExperienciasLaboralesRepository_1.PrismaExperienciasLaboralesRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('UsuarioRepository', { useClass: PrismaUsuarioRepository_1.PrismaUsuarioRepository });
tsyringe_1.container.register('NotificacionesRepository', { useClass: PrismaNotificacionesRepository_1.PrismaNotificacionesRepository });
// ===== REGISTRAR REPOSITORIOS DE CHAT (Compañero) =====
tsyringe_1.container.register('ConversacionesRepository', { useClass: PrismaConversacionesRepository_1.PrismaConversacionesRepository });
tsyringe_1.container.register('MensajesRepository', { useClass: PrismaMensajesRepository_1.PrismaMensajesRepository });
tsyringe_1.container.register('LecturasConversacionRepository', { useClass: PrismaLecturasConversacionRepository_1.PrismaLecturasConversacionRepository });
tsyringe_1.container.register('MediaRepository', { useClass: PrismaMediaRepository_1.PrismaMediaRepository });
// ===== REGISTRAR USE CASES =====
tsyringe_1.container.register(GestionarProvinciasUseCase_1.GestionarProvinciasUseCase, {
    useFactory: () => {
        const provinciasRepository = tsyringe_1.container.resolve('ProvinciasRepository');
        const provinciaValidator = tsyringe_1.container.resolve(ProvinciaValidator_1.ProvinciaValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarProvinciasUseCase_1.GestionarProvinciasUseCase(provinciasRepository, provinciaValidator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarMunicipiosUseCase_1.GestionarMunicipiosUseCase, {
    useFactory: () => {
        const municipiosRepository = tsyringe_1.container.resolve('MunicipiosRepository');
        const municipioValidator = tsyringe_1.container.resolve(MunicipioValidator_1.MunicipioValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarMunicipiosUseCase_1.GestionarMunicipiosUseCase(municipiosRepository, municipioValidator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarDistritosMunicipalesUseCase_1.GestionarDistritosMunicipalesUseCase, {
    useFactory: () => {
        const distritosRepository = tsyringe_1.container.resolve('DistritosMunicipalesRepository');
        const distritoValidator = tsyringe_1.container.resolve(DistritoMunicipalValidator_1.DistritoMunicipalValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarDistritosMunicipalesUseCase_1.GestionarDistritosMunicipalesUseCase(distritosRepository, distritoValidator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarSeccionesUseCase_1.GestionarSeccionesUseCase, {
    useFactory: () => {
        const seccionesRepository = tsyringe_1.container.resolve('SeccionesRepository');
        const seccionValidator = tsyringe_1.container.resolve(SeccionValidator_1.SeccionValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarSeccionesUseCase_1.GestionarSeccionesUseCase(seccionesRepository, seccionValidator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarBarriosUseCase_1.GestionarBarriosUseCase, {
    useFactory: () => {
        const barriosRepository = tsyringe_1.container.resolve('BarriosRepository');
        const barrioValidator = tsyringe_1.container.resolve(BarrioValidator_1.BarrioValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarBarriosUseCase_1.GestionarBarriosUseCase(barriosRepository, barrioValidator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarSubBarriosUseCase_1.GestionarSubBarriosUseCase, {
    useFactory: () => {
        const subBarriosRepository = tsyringe_1.container.resolve('SubBarriosRepository');
        const subBarrioValidator = tsyringe_1.container.resolve(SubBarrioValidator_1.SubBarrioValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarSubBarriosUseCase_1.GestionarSubBarriosUseCase(subBarriosRepository, subBarrioValidator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarUbicacionesUseCase_1.GestionarUbicacionesUseCase, {
    useFactory: () => {
        const ubicacionesRepository = tsyringe_1.container.resolve('UbicacionesRepository');
        const ubicacionValidator = tsyringe_1.container.resolve(UbicacionValidator_1.UbicacionValidator);
        return new GestionarUbicacionesUseCase_1.GestionarUbicacionesUseCase(ubicacionValidator, ubicacionesRepository);
    }
});
tsyringe_1.container.register(GestionarHorariosUseCase_1.GestionarHorariosUseCase, {
    useFactory: () => {
        const horariosRepository = tsyringe_1.container.resolve('HorariosRepository');
        const horarioValidator = tsyringe_1.container.resolve(HorarioValidator_1.HorarioValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarHorariosUseCase_1.GestionarHorariosUseCase(horariosRepository, horarioValidator, estadoValidator);
    }
});
tsyringe_1.container.register(RegistrarUsuarioUseCase_1.RegistrarUsuarioUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        return new RegistrarUsuarioUseCase_1.RegistrarUsuarioUseCase(usuarioRepository, passwordHasher);
    }
});
// Registrar Use Cases de Autenticación y Registro (Tuyos)
tsyringe_1.container.register(SolicitarCodigoRegistroUseCase_1.SolicitarCodigoRegistroUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const emailService = tsyringe_1.container.resolve('EmailService');
        const redisService = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new SolicitarCodigoRegistroUseCase_1.SolicitarCodigoRegistroUseCase(usuarioRepository, emailService, redisService);
    }
});
tsyringe_1.container.register(ValidarCodigoRegistroUseCase_1.ValidarCodigoRegistroUseCase, {
    useFactory: () => {
        const redisService = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        return new ValidarCodigoRegistroUseCase_1.ValidarCodigoRegistroUseCase(redisService, authService);
    }
});
tsyringe_1.container.register(RegistrarDoctorUseCase_1.RegistrarDoctorUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        const storageService = tsyringe_1.container.resolve('StorageService');
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        return new RegistrarDoctorUseCase_1.RegistrarDoctorUseCase(usuarioRepository, passwordHasher, storageService, authService);
    }
});
tsyringe_1.container.register(RegistrarPacienteUseCase_1.RegistrarPacienteUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        const storageService = tsyringe_1.container.resolve('StorageService');
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        return new RegistrarPacienteUseCase_1.RegistrarPacienteUseCase(usuarioRepository, passwordHasher, storageService, authService);
    }
});
tsyringe_1.container.register(LoginGoogleUseCase_1.LoginGoogleUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        return new LoginGoogleUseCase_1.LoginGoogleUseCase(usuarioRepository, authService, passwordHasher);
    }
});
tsyringe_1.container.register(LoginUseCase_1.LoginUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        return new LoginUseCase_1.LoginUseCase(usuarioRepository, passwordHasher, authService);
    }
});
tsyringe_1.container.register(GestionarTiposServiciosUseCase_1.GestionarTiposServiciosUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('TipoServicioRepository');
        const validator = tsyringe_1.container.resolve(TipoServicioValidator_1.TipoServicioValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarTiposServiciosUseCase_1.GestionarTiposServiciosUseCase(repo, validator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarEspecialidadesUseCase_1.GestionarEspecialidadesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('EspecialidadRepository');
        const validator = tsyringe_1.container.resolve(EspecialidadValidator_1.EspecialidadValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarEspecialidadesUseCase_1.GestionarEspecialidadesUseCase(repo, validator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarTiposCentrosSaludUseCase_1.GestionarTiposCentrosSaludUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('TipoCentroSaludRepository');
        const validator = tsyringe_1.container.resolve(TipoCentroSaludValidator_1.TipoCentroSaludValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarTiposCentrosSaludUseCase_1.GestionarTiposCentrosSaludUseCase(repo, validator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarProfesionesUseCase_1.GestionarProfesionesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('ProfesionesRepository');
        const validator = tsyringe_1.container.resolve(ProfesionValidator_1.ProfesionValidator);
        return new GestionarProfesionesUseCase_1.GestionarProfesionesUseCase(repo, validator);
    }
});
tsyringe_1.container.register('GestionarProfesionesUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarProfesionesUseCase_1.GestionarProfesionesUseCase);
    }
});
tsyringe_1.container.register(GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('IExperienciasLaboralesRepository');
        const validator = tsyringe_1.container.resolve(ExperienciaLaboralValidator_1.ExperienciaLaboralValidator);
        return new GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase(repo, validator);
    }
});
tsyringe_1.container.register('GestionarExperienciasLaboralesUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase);
    }
});
tsyringe_1.container.register(GestionarServicioHorariosUseCase_1.GestionarServicioHorariosUseCase, {
    useFactory: () => {
        const servicioHorarioRepository = tsyringe_1.container.resolve('ServicioHorarioRepository');
        return new GestionarServicioHorariosUseCase_1.GestionarServicioHorariosUseCase(servicioHorarioRepository);
    }
});
// Casos de Uso de Notificaciones y Chat (Compañero)
tsyringe_1.container.register(GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase, {
    useFactory: () => {
        const notificacionesRepository = tsyringe_1.container.resolve('NotificacionesRepository');
        return new GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase(notificacionesRepository);
    }
});
tsyringe_1.container.register(GestionarConversacionesUseCase_1.GestionarConversacionesUseCase, {
    useFactory: () => {
        const conversacionesRepository = tsyringe_1.container.resolve('ConversacionesRepository');
        const lecturasRepository = tsyringe_1.container.resolve('LecturasConversacionRepository');
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        return new GestionarConversacionesUseCase_1.GestionarConversacionesUseCase(conversacionesRepository, lecturasRepository, usuarioRepository);
    }
});
tsyringe_1.container.register(GestionarMensajesUseCase_1.GestionarMensajesUseCase, {
    useFactory: () => {
        const mensajesRepository = tsyringe_1.container.resolve('MensajesRepository');
        const conversacionesRepository = tsyringe_1.container.resolve('ConversacionesRepository');
        const lecturasRepository = tsyringe_1.container.resolve('LecturasConversacionRepository');
        const mediaRepository = tsyringe_1.container.resolve('MediaRepository');
        return new GestionarMensajesUseCase_1.GestionarMensajesUseCase(mensajesRepository, conversacionesRepository, lecturasRepository, mediaRepository);
    }
});
tsyringe_1.container.register(GestionarMediaUseCase_1.GestionarMediaUseCase, {
    useFactory: () => {
        const mediaRepository = tsyringe_1.container.resolve('MediaRepository');
        return new GestionarMediaUseCase_1.GestionarMediaUseCase(mediaRepository);
    }
});
// ===== REGISTRAR SERVICIOS DE APLICACIÓN =====
tsyringe_1.container.register('PasswordHasher', { useClass: BcryptPasswordHasher_1.BcryptPasswordHasher });
tsyringe_1.container.register('ITranslationService', {
    useClass: LibreTranslateService_1.LibreTranslateService
});
// Registro del Storage Service (Tuyo)
tsyringe_1.container.registerSingleton('StorageService', SupabaseStorageService_1.SupabaseStorageService);
tsyringe_1.container.register(CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase, {
    useFactory: () => {
        const prisma = tsyringe_1.container.resolve('PrismaClient');
        const centroRepo = tsyringe_1.container.resolve('CentroSaludRepository');
        const ubicacionRepo = tsyringe_1.container.resolve('UbicacionesRepository');
        const tipoRepo = tsyringe_1.container.resolve('TipoCentroSaludRepository');
        const storage = tsyringe_1.container.resolve('StorageService');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        const validator = tsyringe_1.container.resolve(CentroSaludValidator_1.CentroSaludValidator);
        const ubicValidator = tsyringe_1.container.resolve(UbicacionValidator_1.UbicacionValidator);
        return new CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase(prisma, centroRepo, ubicacionRepo, tipoRepo, storage, passwordHasher, validator, ubicValidator);
    }
});
tsyringe_1.container.register(RegistrarCentroUseCase_1.RegistrarCentroUseCase, {
    useFactory: () => {
        const prisma = tsyringe_1.container.resolve('PrismaClient');
        const usuarioRepo = tsyringe_1.container.resolve('UsuarioRepository');
        const centroRepo = tsyringe_1.container.resolve('CentroSaludRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        const storage = tsyringe_1.container.resolve('StorageService');
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        return new RegistrarCentroUseCase_1.RegistrarCentroUseCase(prisma, usuarioRepo, centroRepo, passwordHasher, storage, authService);
    }
});
tsyringe_1.container.register(CentrosSaludController_1.CentrosSaludController, {
    useFactory: () => {
        const completarPerfilUseCase = tsyringe_1.container.resolve(CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase);
        const registrarCentroUseCase = tsyringe_1.container.resolve(RegistrarCentroUseCase_1.RegistrarCentroUseCase);
        return new CentrosSaludController_1.CentrosSaludController(completarPerfilUseCase, registrarCentroUseCase);
    }
});
tsyringe_1.container.register(RefreshAccessTokenUseCase_1.RefreshAccessTokenUseCase, {
    useFactory: () => {
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        return new RefreshAccessTokenUseCase_1.RefreshAccessTokenUseCase(authService, usuarioRepository);
    }
});
tsyringe_1.container.register(ActualizarFotoPerfilUseCase_1.ActualizarFotoPerfilUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const storageService = tsyringe_1.container.resolve(SupabaseStorageService_1.SupabaseStorageService);
        return new ActualizarFotoPerfilUseCase_1.ActualizarFotoPerfilUseCase(usuarioRepository, storageService);
    }
});
