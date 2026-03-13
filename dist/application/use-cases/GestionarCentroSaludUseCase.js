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
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
let GestionarCentroSaludUseCase = class GestionarCentroSaludUseCase {
    constructor(centroRepo, supabase) {
        this.centroRepo = centroRepo;
        this.supabase = supabase;
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
        return await this.centroRepo.actualizarPerfil(centroId, {
            nombreComercial: dto.nombreComercial?.trim(),
            rnc: dto.rnc?.trim(),
            tipoCentroId: dto.tipoCentroId,
            sitio_web: dto.sitio_web,
            descripcion: dto.descripcion,
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
};
exports.GestionarCentroSaludUseCase = GestionarCentroSaludUseCase;
exports.GestionarCentroSaludUseCase = GestionarCentroSaludUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('CentroSaludRepository')),
    __param(1, (0, tsyringe_1.inject)(SupabaseStorageService_1.SupabaseStorageService)),
    __metadata("design:paramtypes", [Object, SupabaseStorageService_1.SupabaseStorageService])
], GestionarCentroSaludUseCase);
