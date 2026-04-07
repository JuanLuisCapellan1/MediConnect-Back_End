"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletarPerfilCentroSaludUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const CentroSaludValidator_1 = require("../../domain/validators/CentrosSalud/CentroSaludValidator");
const UbicacionValidator_1 = require("../../domain/validators/Ubicaciones/UbicacionValidator");
const CentroSaludNoEncontradoError_1 = require("../../domain/errors/CentrosSalud/CentroSaludNoEncontradoError");
const TipoCentroSaludNoEncontradoError_1 = require("../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError");
let CompletarPerfilCentroSaludUseCase = class CompletarPerfilCentroSaludUseCase {
    constructor(prisma, centroSaludRepository, ubicacionesRepository, tipoCentroSaludRepository, storageService, passwordHasher, centroSaludValidator, ubicacionValidator) {
        this.prisma = prisma;
        this.centroSaludRepository = centroSaludRepository;
        this.ubicacionesRepository = ubicacionesRepository;
        this.tipoCentroSaludRepository = tipoCentroSaludRepository;
        this.storageService = storageService;
        this.passwordHasher = passwordHasher;
        this.centroSaludValidator = centroSaludValidator;
        this.ubicacionValidator = ubicacionValidator;
    }
    /**
     * Completa el perfil de un centro de salud con archivos
     */
    async execute(usuarioId, dto, files) {
        // ======================================================================
        // 1. VALIDACIONES PREVIAS
        // ======================================================================
        // Validar que el archivo certificado sanitario exista
        if (!files.certificadoSanitario?.[0]) {
            throw new Error('El certificado sanitario es obligatorio');
        }
        // Validar que el centro de salud existe
        const centroExistente = await this.centroSaludRepository.obtenerPorId(usuarioId);
        if (!centroExistente) {
            throw new CentroSaludNoEncontradoError_1.CentroSaludNoEncontradoError(usuarioId);
        }
        // Validar que el tipo de centro existe
        const tipoCentroExistente = await this.tipoCentroSaludRepository.obtenerPorId(dto.tipoCentroId);
        if (!tipoCentroExistente) {
            throw new TipoCentroSaludNoEncontradoError_1.TipoCentroSaludNoEncontradoError(dto.tipoCentroId);
        }
        // Validar ubicación
        const ubicacionExistente = await this.ubicacionesRepository.buscarPorId(dto.ubicacionId);
        if (!ubicacionExistente) {
            throw new Error(`La ubicación con ID ${dto.ubicacionId} no existe o está eliminada`);
        }
        // Validar datos con validadores
        this.centroSaludValidator.validarRNC(dto.rnc);
        this.centroSaludValidator.validarTelefono(dto.telefono);
        // ======================================================================
        // 2. SUBIR ARCHIVOS A SUPABASE
        // ======================================================================
        let certificadoUrl = '';
        let fotoCentroUrl = null;
        try {
            // Certificado sanitario (OBLIGATORIO)
            certificadoUrl = await this.storageService.uploadFile(files.certificadoSanitario[0].buffer, `centros-salud/${usuarioId}/certificado-sanitario.pdf`, 'secure-documents', files.certificadoSanitario[0].mimetype);
            // Foto de perfil (OPCIONAL)
            if (files.fotoPerfil?.[0]) {
                fotoCentroUrl = await this.storageService.uploadFile(files.fotoPerfil[0].buffer, `centros-salud/${usuarioId}/perfil.jpg`, 'public-assets', files.fotoPerfil[0].mimetype);
            }
        }
        catch (error) {
            console.error('Error subiendo archivos a Supabase:', error);
            throw new Error('No se pudieron subir los archivos. Intente de nuevo.');
        }
        // ======================================================================
        // 3. EJECUTAR TRANSACCIÓN ATÓMICA
        // ======================================================================
        try {
            const resultado = await this.prisma.$transaction(async (tx) => {
                // 3a. Usar la ubicación existente
                const ub = await this.ubicacionesRepository.buscarPorId(dto.ubicacionId);
                if (!ub)
                    throw new Error(`La ubicación con ID ${dto.ubicacionId} no existe`);
                const ubicacionId = dto.ubicacionId;
                // 3b. Actualizar el CentroSalud con los datos completos
                const centroActualizado = await tx.centroSalud.update({
                    where: { usuarioId },
                    data: {
                        nombreComercial: dto.nombreComercial.trim(),
                        ...(dto.rnc && { rnc: dto.rnc.trim() }),
                        tipoCentroId: dto.tipoCentroId,
                        ubicacionId: ubicacionId,
                        sitio_web: dto.sitioWeb ? dto.sitioWeb.trim() : null,
                        descripcion: dto.descripcion ? dto.descripcion.trim() : null,
                        certificacion_sanitaria: certificadoUrl,
                        estado: 'Activo',
                        estadoVerificacion: 'En revisión', // Pendiente de aprobación del admin
                        actualizadoEn: new Date(),
                    },
                    include: {
                        usuario: true,
                        tipoCentro: true,
                        ubicacion: true,
                    },
                });
                // Actualizar el usuario con teléfono, contraseña y foto
                const passwordHasheada = await this.passwordHasher.hash(dto.password);
                await tx.usuario.update({
                    where: { id: usuarioId },
                    data: {
                        password: passwordHasheada,
                        telefono: dto.telefono.trim(),
                        fotoPerfil: fotoCentroUrl ?? undefined,
                        actualizadoEn: new Date(),
                    },
                });
                // 3c. Crear acción de auditoría/revisión para administrador
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Revisión Centro de Salud' },
                });
                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: {
                            nombre: 'Revisión Centro de Salud',
                            estado: 'Activo',
                        },
                    });
                }
                // Crear la acción para que el administrador revise
                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: usuarioId,
                        detalle: `Solicitud de aprobación del centro de salud: ${dto.nombreComercial}`,
                        comentarioEmisor: `Ubicación ID: ${dto.ubicacionId}. RNC: ${dto.rnc}`,
                        fechaEmision: new Date(),
                        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
                        estado: 'Pendiente',
                    },
                });
                return centroActualizado;
            });
            return {
                id: resultado.usuarioId,
                nombreComercial: resultado.nombreComercial,
                estado: resultado.estado,
                estadoVerificacion: resultado.estadoVerificacion,
                message: 'Perfil del centro de salud completado exitosamente. Su solicitud está en revisión.',
            };
        }
        catch (error) {
            console.error('Error en transacción:', error);
            throw error;
        }
    }
};
exports.CompletarPerfilCentroSaludUseCase = CompletarPerfilCentroSaludUseCase;
exports.CompletarPerfilCentroSaludUseCase = CompletarPerfilCentroSaludUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __param(1, (0, tsyringe_1.inject)('CentroSaludRepository')),
    __param(2, (0, tsyringe_1.inject)('UbicacionesRepository')),
    __param(3, (0, tsyringe_1.inject)('TipoCentroSaludRepository')),
    __param(4, (0, tsyringe_1.inject)('StorageService')),
    __param(5, (0, tsyringe_1.inject)('PasswordHasher')),
    __param(6, (0, tsyringe_1.inject)(CentroSaludValidator_1.CentroSaludValidator)),
    __param(7, (0, tsyringe_1.inject)(UbicacionValidator_1.UbicacionValidator)),
    __metadata("design:paramtypes", [client_1.PrismaClient, Object, Object, Object, Object, Object, CentroSaludValidator_1.CentroSaludValidator,
        UbicacionValidator_1.UbicacionValidator])
], CompletarPerfilCentroSaludUseCase);
