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
exports.RegistrarCentroUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let RegistrarCentroUseCase = class RegistrarCentroUseCase {
    constructor(prisma, usuarioRepository, centroSaludRepository, passwordHasher, storageService, authService) {
        this.prisma = prisma;
        this.usuarioRepository = usuarioRepository;
        this.centroSaludRepository = centroSaludRepository;
        this.passwordHasher = passwordHasher;
        this.storageService = storageService;
        this.authService = authService;
    }
    async execute(dto, files, token) {
        // Validar token y extraer email (soporta token de Google también)
        let email = this.authService.validateRegistrationToken(token);
        if (!email) {
            const googlePayload = this.authService.validateGoogleRegistrationToken(token);
            if (googlePayload) {
                email = googlePayload.email;
            }
        }
        if (!email) {
            throw new Error('Token inválido o expirado');
        }
        // Validar que no exista usuario ACTIVO con este email
        // Esto permite re-registro si la cuenta anterior fue eliminada
        const emailActivo = await this.usuarioRepository.existeEmailActivo(email);
        if (emailActivo) {
            throw new Error('El email ya está registrado');
        }
        if (!files.certificadoSanitario?.[0]) {
            throw new Error('El certificado sanitario es obligatorio');
        }
        const hashedPassword = await this.passwordHasher.hash(dto.password);
        // Subir archivos
        let certificadoUrl = '';
        let fotoPerfilUrl = null;
        try {
            certificadoUrl = await this.storageService.uploadFile(files.certificadoSanitario[0].buffer, `centros-salud/${email}/certificado-sanitario.pdf`, 'secure-documents', files.certificadoSanitario[0].mimetype);
            if (files.fotoPerfil?.[0]) {
                fotoPerfilUrl = await this.storageService.uploadFile(files.fotoPerfil[0].buffer, `centros-salud/${email}/perfil.jpg`, 'public-assets', files.fotoPerfil[0].mimetype);
            }
        }
        catch (error) {
            throw new Error('No se pudieron subir los archivos. Intente de nuevo.');
        }
        // Persistir en transacción: usuario, ubicacion, centro y acción de auditoría
        await this.prisma.$transaction(async (tx) => {
            // CREAR O REACTIVAR USUARIO
            const usuarioEliminado = await tx.usuario.findFirst({
                where: {
                    email,
                    estado: 'Eliminado',
                },
            });
            let usuario;
            if (usuarioEliminado) {
                // Reactivar usuario eliminado
                usuario = await tx.usuario.update({
                    where: { id: usuarioEliminado.id },
                    data: {
                        password: hashedPassword,
                        rol: 'Centro',
                        estado: 'Activo',
                        emailVerificado: true,
                        telefono: dto.telefono,
                        fotoPerfil: fotoPerfilUrl,
                        actualizadoEn: new Date(),
                    },
                });
            }
            else {
                // Crear nuevo usuario
                usuario = await tx.usuario.create({
                    data: {
                        email,
                        password: hashedPassword,
                        rol: 'Centro',
                        estado: 'Activo',
                        emailVerificado: true,
                        telefono: dto.telefono,
                        fotoPerfil: fotoPerfilUrl,
                        creadoEn: new Date(),
                    },
                });
            }
            // USAR UBICACIÓN EXISTENTE
            const ubicacionExistente = await tx.ubicacion.findUnique({
                where: { id: dto.ubicacionId },
            });
            if (!ubicacionExistente || ubicacionExistente.estado === 'Eliminado') {
                throw new Error(`La ubicación con ID ${dto.ubicacionId} no existe o está eliminada`);
            }
            const ubicacionId = dto.ubicacionId;
            // CREAR O REACTIVAR CENTRO SALUD
            const centroEliminado = await tx.centroSalud.findFirst({
                where: { usuarioId: usuario.id },
            });
            if (centroEliminado) {
                // Reactivar centro de salud eliminado
                await tx.centroSalud.update({
                    where: { usuarioId: usuario.id },
                    data: {
                        nombreComercial: dto.nombreComercial,
                        rnc: dto.rnc ?? '',
                        tipoCentroId: dto.tipoCentroId,
                        ubicacionId: ubicacionId,
                        sitio_web: dto.sitioWeb ?? null,
                        descripcion: dto.descripcion ?? null,
                        certificacion_sanitaria: certificadoUrl,
                        estado: 'Activo',
                        estadoVerificacion: 'En revisión',
                        actualizadoEn: new Date(),
                    },
                });
            }
            else {
                // Crear nuevo centro de salud
                await tx.centroSalud.create({
                    data: {
                        usuarioId: usuario.id,
                        nombreComercial: dto.nombreComercial,
                        rnc: dto.rnc ?? '',
                        tipoCentroId: dto.tipoCentroId,
                        ubicacionId: ubicacionId,
                        sitio_web: dto.sitioWeb ?? null,
                        descripcion: dto.descripcion ?? null,
                        certificacion_sanitaria: certificadoUrl,
                        estado: 'Activo',
                        estadoVerificacion: 'En revisión',
                        creadoEn: new Date(),
                    },
                });
            }
            let tipoAccion = await tx.tipoAccion.findFirst({ where: { nombre: 'Revisión Centro de Salud' } });
            if (!tipoAccion) {
                tipoAccion = await tx.tipoAccion.create({ data: { nombre: 'Revisión Centro de Salud', estado: 'Activo' } });
            }
            await tx.accion.create({
                data: {
                    tipoAccionId: tipoAccion.id,
                    emisorId: usuario.id,
                    detalle: `Solicitud de registro del centro: ${dto.nombreComercial}`,
                    comentarioEmisor: `Ubicación ID: ${dto.ubicacionId}. RNC: ${dto.rnc ?? 'N/A'}`,
                    fechaEmision: new Date(),
                    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    estado: 'Pendiente',
                },
            });
        });
    }
};
exports.RegistrarCentroUseCase = RegistrarCentroUseCase;
exports.RegistrarCentroUseCase = RegistrarCentroUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('PrismaClient')),
    __param(1, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(2, (0, tsyringe_1.inject)('CentroSaludRepository')),
    __param(3, (0, tsyringe_1.inject)('PasswordHasher')),
    __param(4, (0, tsyringe_1.inject)('StorageService')),
    __param(5, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __metadata("design:paramtypes", [client_1.PrismaClient, Object, Object, Object, Object, AuthService_1.AuthService])
], RegistrarCentroUseCase);
