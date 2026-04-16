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
exports.GestionarCentroSaludUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
let GestionarCentroSaludUseCase = class GestionarCentroSaludUseCase {
    constructor(centroRepo, supabase, prisma) {
        this.centroRepo = centroRepo;
        this.supabase = supabase;
        this.prisma = prisma;
    }
    // ─── Perfil ────────────────────────────────────────────────────────────────
    async obtenerPerfil(centroId) {
        const centro = await this.centroRepo.obtenerPerfilCompleto(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        return centro;
    }
    async actualizarPerfil(centroId, dto) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        if (dto.nombreComercial !== undefined) {
            if (dto.nombreComercial.trim().length < 3)
                throw new Error('El nombre comercial debe tener al menos 3 caracteres');
            if (dto.nombreComercial.trim().length > 120)
                throw new Error('El nombre comercial no puede exceder 120 caracteres');
        }
        let requiereRevisionAdmin = false;
        let razonRevision = '';
        // Caso 1: La información del centro fue rechazada → cualquier actualización es un intento de corrección
        if (centro.estadoInfoPersonal === 'Rechazado') {
            requiereRevisionAdmin = true;
            razonRevision = 'El centro ha corregido la información de su perfil tras ser rechazado previamente.';
        }
        else if (centro.estadoVerificacion === 'Aprobado' || centro.estadoVerificacion === 'En revisión') {
            // Caso 2: Info ya aprobada (o en revisión por documentos pendientes).
            // Revisar si cambian datos legales críticos (RNC / Nombre Comercial)
            const nombreCambiado = dto.nombreComercial !== undefined && dto.nombreComercial.trim() !== centro.nombreComercial;
            const rncCambiado = dto.rnc !== undefined && dto.rnc.trim() !== centro.rnc;
            if (nombreCambiado || rncCambiado) {
                // Verificar si YA tiene una acción pendiente de Registro/Revisión de Perfil
                const accionPerfilPendiente = await this.prisma.accion.findFirst({
                    where: {
                        emisorId: centroId,
                        estado: 'Pendiente',
                        tipoAccion: { nombre: { in: ['Registro Centro de Salud', 'Revisión Centro de Salud'] } }
                    }
                });
                if (!accionPerfilPendiente) {
                    requiereRevisionAdmin = true;
                    razonRevision = 'El centro ha modificado su información legal sensible (RNC o Nombre Comercial).';
                }
            }
        }
        // Realizamos la transición transaccional para evitar inconsistencias
        return await this.prisma.$transaction(async (tx) => {
            const updatePayload = { actualizadoEn: new Date() };
            if (dto.nombreComercial !== undefined)
                updatePayload.nombreComercial = dto.nombreComercial?.trim();
            if (dto.rnc !== undefined)
                updatePayload.rnc = dto.rnc?.trim();
            if (dto.tipoCentroId !== undefined)
                updatePayload.tipoCentro = { connect: { id: dto.tipoCentroId } };
            if (dto.sitio_web !== undefined)
                updatePayload.sitio_web = dto.sitio_web;
            if (dto.descripcion !== undefined)
                updatePayload.descripcion = dto.descripcion;
            if (dto.telefono !== undefined)
                updatePayload.usuario = { update: { telefono: dto.telefono?.trim() } };
            if (requiereRevisionAdmin) {
                // Resetear estado de info personal a Pendiente para que el admin lo revise de nuevo
                updatePayload.estadoInfoPersonal = 'Pendiente';
                updatePayload.estadoVerificacion = 'Pendiente';
            }
            const centroActualizado = await tx.centroSalud.update({
                where: { usuarioId: centroId },
                data: updatePayload,
                include: { usuario: true, tipoCentro: true, ubicacion: true }
            });
            // Si se requiere revisión, generar nueva acción “Registro Centro de Salud”
            if (requiereRevisionAdmin) {
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Registro Centro de Salud' },
                });
                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: { nombre: 'Registro Centro de Salud', estado: 'Activo' }
                    });
                }
                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: centroId,
                        detalle: 'Revisión de datos del perfil del Centro',
                        comentarioEmisor: razonRevision,
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });
            }
            return centroActualizado;
        });
    }
    async actualizarFoto(centroId, file) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
        if (!TIPOS_PERMITIDOS.includes(file.mimetype))
            throw new Error('Tipo de archivo no permitido. Use JPG, PNG o WebP');
        if (file.size > 5 * 1024 * 1024)
            throw new Error('La foto no puede superar 5MB');
        const ext = file.originalname.split('.').pop()?.toUpperCase() ?? 'JPG';
        const fileName = `centros-salud/${centroId}/foto_perfil_${Date.now()}.${ext}`;
        // SupabaseStorageService.uploadFile(fileBuffer, fileName, bucket, mimeType)
        const url = await this.supabase.uploadFile(file.buffer, fileName, 'public-assets', file.mimetype);
        return await this.centroRepo.actualizarFotoPerfil(centroId, url);
    }
    // ─── Ubicación ─────────────────────────────────────────────────────────────
    async obtenerUbicacion(centroId) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.obtenerUbicacion(centroId);
    }
    async actualizarUbicacion(centroId, dto) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        // Si la información del centro fue rechazada, una actualización de ubicación
        // es un intento de corrección → resetear estadoInfoPersonal y crear accion de revisión
        if (centro.estadoInfoPersonal === 'Rechazado') {
            return await this.prisma.$transaction(async (tx) => {
                const result = await this.centroRepo.actualizarUbicacion(centroId, dto);
                await tx.centroSalud.update({
                    where: { usuarioId: centroId },
                    data: {
                        estadoInfoPersonal: 'Pendiente',
                        estadoVerificacion: 'Pendiente',
                        actualizadoEn: new Date(),
                    },
                });
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Registro Centro de Salud' },
                });
                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: { nombre: 'Registro Centro de Salud', estado: 'Activo' },
                    });
                }
                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: centroId,
                        detalle: 'Revisión de ubicación del Centro',
                        comentarioEmisor: 'El centro ha corregido su ubicación tras ser rechazado previamente.',
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });
                return result;
            });
        }
        return await this.centroRepo.actualizarUbicacion(centroId, dto);
    }
    // ─── Doctores asociados ────────────────────────────────────────────────────
    async listarDoctoresAsociados(centroId) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.listarDoctoresAsociados(centroId);
    }
    // ─── ANALÍTICAS ───────────────────────────────────────────────────────────
    async estadisticasGenerales(centroId) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.estadisticasGenerales(centroId);
    }
    async crecimientoMedicos(centroId, periodo) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
        const p = periodosValidos.includes(periodo) ? periodo : 'mes';
        return await this.centroRepo.crecimientoMedicos(centroId, p);
    }
    async distribucionEspecialidades(centroId) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.distribucionEspecialidades(centroId);
    }
    async listarParaAdmin(filtros) {
        return await this.centroRepo.listarParaAdmin(filtros);
    }
    // ─── Seguros de doctores afiliados ─────────────────────────────────────────
    async listarSegurosCentro(centroId) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro)
            throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.obtenerSegurosCentro(centroId);
    }
};
exports.GestionarCentroSaludUseCase = GestionarCentroSaludUseCase;
exports.GestionarCentroSaludUseCase = GestionarCentroSaludUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('CentroSaludRepository')),
    __param(1, (0, tsyringe_1.inject)(SupabaseStorageService_1.SupabaseStorageService)),
    __param(2, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [Object, SupabaseStorageService_1.SupabaseStorageService,
        client_1.PrismaClient])
], GestionarCentroSaludUseCase);
