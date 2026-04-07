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
const PrismaUbicacionesRepository_1 = require("../../infrastructure/repositories/PrismaUbicacionesRepository");
const PrismaHorariosRepository_1 = require("../../infrastructure/repositories/PrismaHorariosRepository");
const PrismaServicioHorarioRepository_1 = require("../../infrastructure/repositories/PrismaServicioHorarioRepository");
const PrismaEspecialidadRepository_1 = require("../../infrastructure/repositories/PrismaEspecialidadRepository");
const PrismaPacienteRepository_1 = require("../../infrastructure/repositories/PrismaPacienteRepository");
const PrismaDoctorRepository_1 = require("../../infrastructure/repositories/PrismaDoctorRepository");
const PrismaDoctorIdiomaRepository_1 = require("../../infrastructure/repositories/PrismaDoctorIdiomaRepository");
const PrismaTipoCentroSaludRepository_1 = require("../../infrastructure/repositories/PrismaTipoCentroSaludRepository");
const PrismaExperienciaLaboralRepository_1 = require("../../infrastructure/repositories/PrismaExperienciaLaboralRepository");
const PrismaFormacionAcademicaRepository_1 = require("../../infrastructure/repositories/PrismaFormacionAcademicaRepository");
const PrismaPaisRepository_1 = require("../../infrastructure/repositories/PrismaPaisRepository");
const PrismaUniversidadRepository_1 = require("../../infrastructure/repositories/PrismaUniversidadRepository");
const PrismaSolicitudAlianzaRepository_1 = require("../../infrastructure/repositories/PrismaSolicitudAlianzaRepository");
const PrismaNotificacionesRepository_1 = require("../../infrastructure/repositories/PrismaNotificacionesRepository");
const PrismaConversacionesRepository_1 = require("../../infrastructure/repositories/PrismaConversacionesRepository");
const PrismaMensajesRepository_1 = require("../../infrastructure/repositories/PrismaMensajesRepository");
const PrismaLecturasConversacionRepository_1 = require("../../infrastructure/repositories/PrismaLecturasConversacionRepository");
const PrismaMediaRepository_1 = require("../../infrastructure/repositories/PrismaMediaRepository");
const PrismaCentroSaludRepository_1 = require("../../infrastructure/repositories/PrismaCentroSaludRepository");
const PrismaCondicionMedicaRepository_1 = require("../../infrastructure/repositories/PrismaCondicionMedicaRepository");
const PrismaSeguroMedicoRepository_1 = require("../../infrastructure/repositories/PrismaSeguroMedicoRepository");
const PrismaTipoSeguroRepository_1 = require("../../infrastructure/repositories/PrismaTipoSeguroRepository");
const PrismaServicioRepository_1 = require("../../infrastructure/repositories/PrismaServicioRepository");
const PrismaFavoritoRepository_1 = require("../../infrastructure/repositories/PrismaFavoritoRepository");
const PrismaCitaRepository_1 = require("../../infrastructure/repositories/PrismaCitaRepository");
const PrismaGrupoCitaRepository_1 = require("../../infrastructure/repositories/PrismaGrupoCitaRepository");
const PrismaInactividadRepository_1 = require("../../infrastructure/repositories/PrismaInactividadRepository");
const CitaController_1 = require("../../infrastructure/http/controllers/CitaController");
const TeleconsultaController_1 = require("../../infrastructure/http/controllers/TeleconsultaController");
const FinalizarTeleconsultaUseCase_1 = require("../../application/use-cases/teleconsultas/FinalizarTeleconsultaUseCase");
const MediaController_1 = require("../../infrastructure/http/controllers/MediaController");
const PrismaResenaRepository_1 = require("../../infrastructure/repositories/PrismaResenaRepository");
const ResenaController_1 = require("../../infrastructure/http/controllers/ResenaController");
const BcryptPasswordHasher_1 = require("../../infrastructure/external-services/BcryptPasswordHasher");
const LibreTranslateService_1 = require("../../infrastructure/external-services/LibreTranslateService");
const RedisCacheService_1 = require("../../infrastructure/external-services/RedisCacheService");
const NotificacionesWebSocketService_1 = require("../../infrastructure/external-services/NotificacionesWebSocketService");
const ChatWebSocketService_1 = require("../../infrastructure/external-services/ChatWebSocketService");
const client_1 = require("../../infrastructure/database/prisma/client");
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
const NodemailerEmailService_1 = require("../../infrastructure/external-services/NodemailerEmailService");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
const DailyVideoService_1 = require("../../infrastructure/external-services/DailyVideoService");
// Validadores
const ProvinciaValidator_1 = require("../../domain/validators/Provincias/ProvinciaValidator");
const MunicipioValidator_1 = require("../../domain/validators/Municipios/MunicipioValidator");
const DistritoMunicipalValidator_1 = require("../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator");
const SeccionValidator_1 = require("../../domain/validators/Secciones/SeccionValidator");
const BarrioValidator_1 = require("../../domain/validators/Barrios/BarrioValidator");
const UbicacionValidator_1 = require("../../domain/validators/Ubicaciones/UbicacionValidator");
const HorarioValidator_1 = require("../../domain/validators/Horarios/HorarioValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
const ValidadorServicioHorario_1 = require("../../domain/validators/ServiciosHorarios/ValidadorServicioHorario");
const EspecialidadValidator_1 = require("../../domain/validators/Especialidades/EspecialidadValidator");
const PacienteValidator_1 = require("../../domain/validators/Pacientes/PacienteValidator");
const DoctorValidator_1 = require("../../domain/validators/Doctores/DoctorValidator");
const TipoCentroSaludValidator_1 = require("../../domain/validators/TiposCentrosSalud/TipoCentroSaludValidator");
const ExperienciaLaboralValidator_1 = require("../../domain/validators/ExperienciasLaborales/ExperienciaLaboralValidator");
const FormacionAcademicaValidator_1 = require("../../domain/validators/FormacionesAcademicas/FormacionAcademicaValidator");
const CentroSaludValidator_1 = require("../../domain/validators/CentrosSalud/CentroSaludValidator");
const CondicionMedicaValidator_1 = require("../../domain/validators/CondicionesMedicas/CondicionMedicaValidator");
// UseCases
const GestionarProvinciasUseCase_1 = require("../../application/use-cases/GestionarProvinciasUseCase");
const GestionarMunicipiosUseCase_1 = require("../../application/use-cases/GestionarMunicipiosUseCase");
const GestionarDistritosMunicipalesUseCase_1 = require("../../application/use-cases/GestionarDistritosMunicipalesUseCase");
const GestionarBarriosUseCase_1 = require("../../application/use-cases/GestionarBarriosUseCase");
const GestionarUbicacionesUseCase_1 = require("../../application/use-cases/GestionarUbicacionesUseCase");
const GestionarHorariosUseCase_1 = require("../../application/use-cases/GestionarHorariosUseCase");
const GestionarSeccionesUseCase_1 = require("../../application/use-cases/GestionarSeccionesUseCase");
const RegistrarUsuarioUseCase_1 = require("../../application/use-cases/RegistrarUsuarioUseCase");
const SolicitarCodigoRegistroUseCase_1 = require("../../application/use-cases/SolicitarCodigoRegistroUseCase");
const ValidarCodigoRegistroUseCase_1 = require("../../application/use-cases/ValidarCodigoRegistroUseCase");
const RegistrarDoctorUseCase_1 = require("../../application/use-cases/RegistrarDoctorUseCase");
const VerificarDocumentoUseCase_1 = require("../../application/use-cases/VerificarDocumentoUseCase");
const AprobarRechazarDocumentoUseCase_1 = require("../../application/use-cases/AprobarRechazarDocumentoUseCase");
const RegistrarPacienteUseCase_1 = require("../../application/use-cases/RegistrarPacienteUseCase");
const LoginGoogleUseCase_1 = require("../../application/use-cases/LoginGoogleUseCase");
const LoginUseCase_1 = require("../../application/use-cases/LoginUseCase");
const GestionarEspecialidadesUseCase_1 = require("../../application/use-cases/GestionarEspecialidadesUseCase");
const GestionarPacientesUseCase_1 = require("../../application/use-cases/GestionarPacientesUseCase");
const GestionarDoctoresUseCase_1 = require("../../application/use-cases/GestionarDoctoresUseCase");
const GestionarDoctorIdiomasUseCase_1 = require("../../application/use-cases/GestionarDoctorIdiomasUseCase");
const GestionarConversacionesUseCase_1 = require("../../application/use-cases/GestionarConversacionesUseCase");
const GestionarMensajesUseCase_1 = require("../../application/use-cases/GestionarMensajesUseCase");
const GestionarMediaUseCase_1 = require("../../application/use-cases/GestionarMediaUseCase");
const GestionarTiposCentrosSaludUseCase_1 = require("../../application/use-cases/GestionarTiposCentrosSaludUseCase");
const GestionarExperienciasLaboralesUseCase_1 = require("../../application/use-cases/GestionarExperienciasLaboralesUseCase");
const GestionarFormacionesAcademicasUseCase_1 = require("../../application/use-cases/GestionarFormacionesAcademicasUseCase");
const GestionarPaisesUseCase_1 = require("../../application/use-cases/GestionarPaisesUseCase");
const GestionarUniversidadesUseCase_1 = require("../../application/use-cases/GestionarUniversidadesUseCase");
const GestionarServicioHorariosUseCase_1 = require("../../application/use-cases/GestionarServicioHorariosUseCase");
const GestionarNotificacionesUseCase_1 = require("../../application/use-cases/GestionarNotificacionesUseCase");
const EnviarNotificacionUseCase_1 = require("../../application/use-cases/notificaciones/EnviarNotificacionUseCase");
const ObtenerNotificacionesUseCase_1 = require("../../application/use-cases/notificaciones/ObtenerNotificacionesUseCase");
const MarcarNotificacionLeidaUseCase_1 = require("../../application/use-cases/notificaciones/MarcarNotificacionLeidaUseCase");
const NotificacionesController_1 = require("../../infrastructure/http/controllers/NotificacionesController");
const RefreshAccessTokenUseCase_1 = require("../../application/use-cases/RefreshAccessTokenUseCase");
const CompletarPerfilCentroSaludUseCase_1 = require("../../application/use-cases/CompletarPerfilCentroSaludUseCase");
const RegistrarCentroUseCase_1 = require("../../application/use-cases/RegistrarCentroUseCase");
const ActualizarFotoPerfilUseCase_1 = require("../../application/use-cases/ActualizarFotoPerfilUseCase");
const ActualizarBannerUseCase_1 = require("../../application/use-cases/ActualizarBannerUseCase");
const CambiarEmailUseCase_1 = require("../../application/use-cases/CambiarEmailUseCase");
const EliminarCuentaUseCase_1 = require("../../application/use-cases/EliminarCuentaUseCase");
const CentrosSaludController_1 = require("../../infrastructure/http/controllers/CentrosSaludController");
const GestionarCondicionesMedicasUseCase_1 = require("../../application/use-cases/GestionarCondicionesMedicasUseCase");
const GestionarServiciosUseCase_1 = require("../../application/use-cases/GestionarServiciosUseCase");
const GestionarFavoritosUseCase_1 = require("../../application/use-cases/GestionarFavoritosUseCase");
const GestionarCentroSaludUseCase_1 = require("../../application/use-cases/GestionarCentroSaludUseCase");
const GestionarSolicitudesAlianzaUseCase_1 = require("../../application/use-cases/GestionarSolicitudesAlianzaUseCase");
const GestionarCitasUseCase_1 = require("../../application/use-cases/GestionarCitasUseCase");
const GestionarResenasUseCase_1 = require("../../application/use-cases/GestionarResenasUseCase");
const IniciarTeleconsultaUseCase_1 = require("../../application/use-cases/teleconsultas/IniciarTeleconsultaUseCase");
// ===== REGISTRAR SERVICIOS EXTERNOS =====
tsyringe_1.container.register('PrismaClient', {
    useValue: client_1.prisma
});
const redisCacheService = new RedisCacheService_1.RedisCacheService();
tsyringe_1.container.register(RedisCacheService_1.RedisCacheService, {
    useValue: redisCacheService
});
tsyringe_1.container.registerSingleton(AuthService_1.AuthService, AuthService_1.AuthService);
tsyringe_1.container.register('EmailService', {
    useClass: NodemailerEmailService_1.NodemailerEmailService
});
tsyringe_1.container.registerSingleton(ChatWebSocketService_1.ChatWebSocketService);
tsyringe_1.container.registerSingleton(NotificacionesWebSocketService_1.NotificacionesWebSocketService);
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
tsyringe_1.container.register(UbicacionValidator_1.UbicacionValidator, {
    useFactory: () => {
        const barriosRepository = tsyringe_1.container.resolve('BarriosRepository');
        return new UbicacionValidator_1.UbicacionValidator(barriosRepository);
    }
});
tsyringe_1.container.register(HorarioValidator_1.HorarioValidator, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const horariosRepository = tsyringe_1.container.resolve('HorariosRepository');
        return new HorarioValidator_1.HorarioValidator(usuarioRepository, horariosRepository);
    }
});
tsyringe_1.container.register(ValidadorServicioHorario_1.ValidadorServicioHorario, {
    useFactory: () => {
        return new ValidadorServicioHorario_1.ValidadorServicioHorario();
    }
});
tsyringe_1.container.register(EspecialidadValidator_1.EspecialidadValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('EspecialidadRepository');
        return new EspecialidadValidator_1.EspecialidadValidator(repo);
    }
});
tsyringe_1.container.register(PacienteValidator_1.PacienteValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('PacienteRepository');
        return new PacienteValidator_1.PacienteValidator(repo);
    }
});
tsyringe_1.container.register(DoctorValidator_1.DoctorValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('DoctorRepository');
        return new DoctorValidator_1.DoctorValidator(repo);
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
tsyringe_1.container.register(ExperienciaLaboralValidator_1.ExperienciaLaboralValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('IExperienciaLaboralRepository');
        return new ExperienciaLaboralValidator_1.ExperienciaLaboralValidator(repo);
    }
});
tsyringe_1.container.register(FormacionAcademicaValidator_1.FormacionAcademicaValidator, {
    useFactory: () => {
        return new FormacionAcademicaValidator_1.FormacionAcademicaValidator();
    }
});
tsyringe_1.container.register(CondicionMedicaValidator_1.CondicionMedicaValidator, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('CondicionMedicaRepository');
        return new CondicionMedicaValidator_1.CondicionMedicaValidator(repo);
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
tsyringe_1.container.register('EspecialidadRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaEspecialidadRepository_1.PrismaEspecialidadRepository(prismaClient);
    }
});
tsyringe_1.container.register('PacienteRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaPacienteRepository_1.PrismaPacienteRepository(prismaClient);
    }
});
tsyringe_1.container.register('DoctorRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaDoctorRepository_1.PrismaDoctorRepository(prismaClient);
    }
});
tsyringe_1.container.register('DoctorIdiomaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaDoctorIdiomaRepository_1.PrismaDoctorIdiomaRepository(prismaClient);
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
tsyringe_1.container.register('SolicitudAlianzaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaSolicitudAlianzaRepository_1.PrismaSolicitudAlianzaRepository(prismaClient);
    }
});
tsyringe_1.container.register(GestionarCentroSaludUseCase_1.GestionarCentroSaludUseCase, {
    useFactory: () => {
        const centroRepo = tsyringe_1.container.resolve('CentroSaludRepository');
        const supabase = tsyringe_1.container.resolve(SupabaseStorageService_1.SupabaseStorageService);
        return new GestionarCentroSaludUseCase_1.GestionarCentroSaludUseCase(centroRepo, supabase);
    }
});
tsyringe_1.container.register(GestionarSolicitudesAlianzaUseCase_1.GestionarSolicitudesAlianzaUseCase, {
    useFactory: () => {
        const solicitudRepo = tsyringe_1.container.resolve('SolicitudAlianzaRepository');
        const centroRepo = tsyringe_1.container.resolve('CentroSaludRepository');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarSolicitudesAlianzaUseCase_1.GestionarSolicitudesAlianzaUseCase(solicitudRepo, centroRepo, enviarNotifUC);
    }
});
tsyringe_1.container.register('IExperienciaLaboralRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaExperienciaLaboralRepository_1.PrismaExperienciaLaboralRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('IFormacionAcademicaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaFormacionAcademicaRepository_1.PrismaFormacionAcademicaRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('IPaisRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaPaisRepository_1.PrismaPaisRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('IUniversidadRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaUniversidadRepository_1.PrismaUniversidadRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('CondicionMedicaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaCondicionMedicaRepository_1.PrismaCondicionMedicaRepository(prismaClient);
    }
});
tsyringe_1.container.register('UsuarioRepository', { useClass: PrismaUsuarioRepository_1.PrismaUsuarioRepository });
tsyringe_1.container.register('NotificacionesRepository', { useClass: PrismaNotificacionesRepository_1.PrismaNotificacionesRepository });
// ===== REGISTRAR REPOSITORIOS DE CHAT (Compañero) =====
tsyringe_1.container.register('ConversacionesRepository', { useClass: PrismaConversacionesRepository_1.PrismaConversacionesRepository });
tsyringe_1.container.register('MensajesRepository', { useClass: PrismaMensajesRepository_1.PrismaMensajesRepository });
tsyringe_1.container.register('LecturasConversacionRepository', { useClass: PrismaLecturasConversacionRepository_1.PrismaLecturasConversacionRepository });
tsyringe_1.container.register('MediaRepository', { useClass: PrismaMediaRepository_1.PrismaMediaRepository });
tsyringe_1.container.register('SeguroMedicoRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaSeguroMedicoRepository_1.PrismaSeguroMedicoRepository(prismaClient);
    }
});
tsyringe_1.container.register('TipoSeguroRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaTipoSeguroRepository_1.PrismaTipoSeguroRepository(prismaClient);
    }
});
tsyringe_1.container.register('ServicioRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const redisCache = tsyringe_1.container.resolve(RedisCacheService_1.RedisCacheService);
        return new PrismaServicioRepository_1.PrismaServicioRepository(prismaClient, redisCache);
    }
});
tsyringe_1.container.register('FavoritoRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaFavoritoRepository_1.PrismaFavoritoRepository(prismaClient);
    }
});
tsyringe_1.container.register(GestionarFavoritosUseCase_1.GestionarFavoritosUseCase, {
    useFactory: () => {
        const favRepo = tsyringe_1.container.resolve('FavoritoRepository');
        const doctorRepo = tsyringe_1.container.resolve('DoctorRepository');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarFavoritosUseCase_1.GestionarFavoritosUseCase(favRepo, doctorRepo, enviarNotifUC);
    }
});
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
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarHorariosUseCase_1.GestionarHorariosUseCase(horariosRepository, horarioValidator, estadoValidator, enviarNotifUC);
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
        const especialidadRepository = tsyringe_1.container.resolve('EspecialidadRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        const storageService = tsyringe_1.container.resolve('StorageService');
        const authService = tsyringe_1.container.resolve(AuthService_1.AuthService);
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new RegistrarDoctorUseCase_1.RegistrarDoctorUseCase(usuarioRepository, especialidadRepository, passwordHasher, storageService, authService, enviarNotifUC);
    }
});
tsyringe_1.container.register('VerificarDocumentoUseCase', {
    useClass: VerificarDocumentoUseCase_1.VerificarDocumentoUseCase,
});
tsyringe_1.container.register(AprobarRechazarDocumentoUseCase_1.AprobarRechazarDocumentoUseCase, {
    useFactory: () => {
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new AprobarRechazarDocumentoUseCase_1.AprobarRechazarDocumentoUseCase(enviarNotifUC);
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
tsyringe_1.container.register(GestionarEspecialidadesUseCase_1.GestionarEspecialidadesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('EspecialidadRepository');
        const validator = tsyringe_1.container.resolve(EspecialidadValidator_1.EspecialidadValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarEspecialidadesUseCase_1.GestionarEspecialidadesUseCase(repo, validator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarPacientesUseCase_1.GestionarPacientesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('PacienteRepository');
        const validator = tsyringe_1.container.resolve(PacienteValidator_1.PacienteValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarPacientesUseCase_1.GestionarPacientesUseCase(repo, validator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('DoctorRepository');
        const citaRepo = tsyringe_1.container.resolve('CitaRepository');
        const validator = tsyringe_1.container.resolve(DoctorValidator_1.DoctorValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarDoctoresUseCase_1.GestionarDoctoresUseCase(repo, citaRepo, validator, estadoValidator);
    }
});
tsyringe_1.container.register(GestionarDoctorIdiomasUseCase_1.GestionarDoctorIdiomasUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('DoctorIdiomaRepository');
        return new GestionarDoctorIdiomasUseCase_1.GestionarDoctorIdiomasUseCase(repo);
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
tsyringe_1.container.register(GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('IExperienciaLaboralRepository');
        const validator = tsyringe_1.container.resolve(ExperienciaLaboralValidator_1.ExperienciaLaboralValidator);
        return new GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase(repo, validator);
    }
});
tsyringe_1.container.register('GestionarExperienciasLaboralesUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase);
    }
});
tsyringe_1.container.register(GestionarFormacionesAcademicasUseCase_1.GestionarFormacionesAcademicasUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('IFormacionAcademicaRepository');
        const validator = tsyringe_1.container.resolve(FormacionAcademicaValidator_1.FormacionAcademicaValidator);
        return new GestionarFormacionesAcademicasUseCase_1.GestionarFormacionesAcademicasUseCase(repo, validator);
    }
});
tsyringe_1.container.register('GestionarFormacionesAcademicasUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarFormacionesAcademicasUseCase_1.GestionarFormacionesAcademicasUseCase);
    }
});
tsyringe_1.container.register(GestionarPaisesUseCase_1.GestionarPaisesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('IPaisRepository');
        return new GestionarPaisesUseCase_1.GestionarPaisesUseCase(repo);
    }
});
tsyringe_1.container.register('GestionarPaisesUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarPaisesUseCase_1.GestionarPaisesUseCase);
    }
});
tsyringe_1.container.register(GestionarUniversidadesUseCase_1.GestionarUniversidadesUseCase, {
    useFactory: () => {
        const universidadRepo = tsyringe_1.container.resolve('IUniversidadRepository');
        const paisRepo = tsyringe_1.container.resolve('IPaisRepository');
        return new GestionarUniversidadesUseCase_1.GestionarUniversidadesUseCase(universidadRepo, paisRepo);
    }
});
tsyringe_1.container.register('GestionarUniversidadesUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarUniversidadesUseCase_1.GestionarUniversidadesUseCase);
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
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarMensajesUseCase_1.GestionarMensajesUseCase(mensajesRepository, conversacionesRepository, lecturasRepository, mediaRepository, enviarNotifUC);
    }
});
tsyringe_1.container.register(GestionarMediaUseCase_1.GestionarMediaUseCase, {
    useFactory: () => {
        const mediaRepository = tsyringe_1.container.resolve('MediaRepository');
        const storageService = tsyringe_1.container.resolve('StorageService');
        return new GestionarMediaUseCase_1.GestionarMediaUseCase(mediaRepository, storageService);
    }
});
tsyringe_1.container.register(GestionarCondicionesMedicasUseCase_1.GestionarCondicionesMedicasUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('CondicionMedicaRepository');
        const validator = tsyringe_1.container.resolve(CondicionMedicaValidator_1.CondicionMedicaValidator);
        const estadoValidator = tsyringe_1.container.resolve(EstadoValidator_1.EstadoValidator);
        return new GestionarCondicionesMedicasUseCase_1.GestionarCondicionesMedicasUseCase(repo, validator, estadoValidator);
    }
});
tsyringe_1.container.register('GestionarCondicionesMedicasUseCase', {
    useFactory: () => {
        return tsyringe_1.container.resolve(GestionarCondicionesMedicasUseCase_1.GestionarCondicionesMedicasUseCase);
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
        return new CentrosSaludController_1.CentrosSaludController(completarPerfilUseCase, registrarCentroUseCase, tsyringe_1.container.resolve(GestionarCentroSaludUseCase_1.GestionarCentroSaludUseCase), tsyringe_1.container.resolve(GestionarSolicitudesAlianzaUseCase_1.GestionarSolicitudesAlianzaUseCase));
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
tsyringe_1.container.register(ActualizarBannerUseCase_1.ActualizarBannerUseCase, {
    useFactory: () => {
        const usuarioRepository = tsyringe_1.container.resolve('UsuarioRepository');
        const storageService = tsyringe_1.container.resolve(SupabaseStorageService_1.SupabaseStorageService);
        return new ActualizarBannerUseCase_1.ActualizarBannerUseCase(usuarioRepository, storageService);
    }
});
tsyringe_1.container.register(CambiarEmailUseCase_1.CambiarEmailUseCase, {
    useFactory: () => {
        const usuarioRepo = tsyringe_1.container.resolve('UsuarioRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        return new CambiarEmailUseCase_1.CambiarEmailUseCase(usuarioRepo, passwordHasher);
    }
});
tsyringe_1.container.register(EliminarCuentaUseCase_1.EliminarCuentaUseCase, {
    useFactory: () => {
        const usuarioRepo = tsyringe_1.container.resolve('UsuarioRepository');
        const passwordHasher = tsyringe_1.container.resolve('PasswordHasher');
        return new EliminarCuentaUseCase_1.EliminarCuentaUseCase(usuarioRepo, passwordHasher);
    }
});
tsyringe_1.container.register(GestionarServiciosUseCase_1.GestionarServiciosUseCase, {
    useFactory: () => {
        const servicioRepository = tsyringe_1.container.resolve('ServicioRepository');
        const storageService = tsyringe_1.container.resolve('StorageService');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarServiciosUseCase_1.GestionarServiciosUseCase(servicioRepository, storageService, enviarNotifUC);
    }
});
tsyringe_1.container.register('CitaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaCitaRepository_1.PrismaCitaRepository(prismaClient);
    }
});
tsyringe_1.container.register('GrupoCitaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaGrupoCitaRepository_1.PrismaGrupoCitaRepository(prismaClient);
    }
});
tsyringe_1.container.register('InactividadRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaInactividadRepository_1.PrismaInactividadRepository(prismaClient);
    }
});
tsyringe_1.container.register(GestionarCitasUseCase_1.GestionarCitasUseCase, {
    useFactory: () => {
        const citaRepo = tsyringe_1.container.resolve('CitaRepository');
        const doctorRepo = tsyringe_1.container.resolve('DoctorRepository');
        const pacienteRepo = tsyringe_1.container.resolve('PacienteRepository');
        const inactividadRepo = tsyringe_1.container.resolve('InactividadRepository');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarCitasUseCase_1.GestionarCitasUseCase(citaRepo, doctorRepo, pacienteRepo, inactividadRepo, enviarNotifUC);
    }
});
tsyringe_1.container.register(CitaController_1.CitaController, {
    useFactory: () => {
        const useCase = tsyringe_1.container.resolve(GestionarCitasUseCase_1.GestionarCitasUseCase);
        return new CitaController_1.CitaController(useCase);
    }
});
tsyringe_1.container.register('VideoService', {
    useClass: DailyVideoService_1.DailyVideoService,
});
tsyringe_1.container.register(IniciarTeleconsultaUseCase_1.IniciarTeleconsultaUseCase, {
    useFactory: () => {
        const citaRepo = tsyringe_1.container.resolve('CitaRepository');
        const conversacionesRepo = tsyringe_1.container.resolve('ConversacionesRepository');
        const videoService = tsyringe_1.container.resolve('VideoService');
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new IniciarTeleconsultaUseCase_1.IniciarTeleconsultaUseCase(citaRepo, conversacionesRepo, videoService, prismaClient, enviarNotifUC);
    }
});
tsyringe_1.container.register(FinalizarTeleconsultaUseCase_1.FinalizarTeleconsultaUseCase, {
    useFactory: () => {
        const citaRepo = tsyringe_1.container.resolve('CitaRepository');
        const videoService = tsyringe_1.container.resolve('VideoService');
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new FinalizarTeleconsultaUseCase_1.FinalizarTeleconsultaUseCase(citaRepo, videoService, prismaClient, enviarNotifUC);
    }
});
tsyringe_1.container.register(TeleconsultaController_1.TeleconsultaController, {
    useFactory: () => {
        const iniciarUseCase = tsyringe_1.container.resolve(IniciarTeleconsultaUseCase_1.IniciarTeleconsultaUseCase);
        const finalizarUseCase = tsyringe_1.container.resolve(FinalizarTeleconsultaUseCase_1.FinalizarTeleconsultaUseCase);
        return new TeleconsultaController_1.TeleconsultaController(iniciarUseCase, finalizarUseCase);
    }
});
tsyringe_1.container.register('ResenaRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaResenaRepository_1.PrismaResenaRepository(prismaClient);
    }
});
tsyringe_1.container.register(GestionarResenasUseCase_1.GestionarResenasUseCase, {
    useFactory: () => {
        const resenaRepo = tsyringe_1.container.resolve('ResenaRepository');
        const enviarNotifUC = tsyringe_1.container.resolve(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase);
        return new GestionarResenasUseCase_1.GestionarResenasUseCase(resenaRepo, enviarNotifUC);
    }
});
tsyringe_1.container.register(ResenaController_1.ResenaController, {
    useFactory: () => {
        const useCase = tsyringe_1.container.resolve(GestionarResenasUseCase_1.GestionarResenasUseCase);
        return new ResenaController_1.ResenaController(useCase);
    }
});
tsyringe_1.container.register(MediaController_1.MediaController, {
    useFactory: () => new MediaController_1.MediaController()
});
// ─── Notificaciones ───────────────────────────────────────────────────────────
tsyringe_1.container.register('NotificacionesRepository', {
    useFactory: () => {
        const prismaClient = tsyringe_1.container.resolve('PrismaClient');
        return new PrismaNotificacionesRepository_1.PrismaNotificacionesRepository(prismaClient);
    }
});
tsyringe_1.container.register(GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('NotificacionesRepository');
        return new GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase(repo);
    }
});
tsyringe_1.container.register(EnviarNotificacionUseCase_1.EnviarNotificacionUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('NotificacionesRepository');
        const ws = tsyringe_1.container.resolve(NotificacionesWebSocketService_1.NotificacionesWebSocketService);
        return new EnviarNotificacionUseCase_1.EnviarNotificacionUseCase(repo, ws);
    }
});
tsyringe_1.container.register(ObtenerNotificacionesUseCase_1.ObtenerNotificacionesUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('NotificacionesRepository');
        return new ObtenerNotificacionesUseCase_1.ObtenerNotificacionesUseCase(repo);
    }
});
tsyringe_1.container.register(MarcarNotificacionLeidaUseCase_1.MarcarNotificacionLeidaUseCase, {
    useFactory: () => {
        const repo = tsyringe_1.container.resolve('NotificacionesRepository');
        const ws = tsyringe_1.container.resolve(NotificacionesWebSocketService_1.NotificacionesWebSocketService);
        return new MarcarNotificacionLeidaUseCase_1.MarcarNotificacionLeidaUseCase(repo, ws);
    }
});
tsyringe_1.container.register(NotificacionesController_1.NotificacionesController, {
    useFactory: () => {
        const obtenerUC = tsyringe_1.container.resolve(ObtenerNotificacionesUseCase_1.ObtenerNotificacionesUseCase);
        const marcarUC = tsyringe_1.container.resolve(MarcarNotificacionLeidaUseCase_1.MarcarNotificacionLeidaUseCase);
        const gestionarUC = tsyringe_1.container.resolve(GestionarNotificacionesUseCase_1.GestionarNotificacionesUseCase);
        return new NotificacionesController_1.NotificacionesController(obtenerUC, marcarUC, gestionarUC);
    }
});
