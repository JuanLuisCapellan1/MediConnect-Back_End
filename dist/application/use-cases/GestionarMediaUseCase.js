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
exports.GestionarMediaUseCase = exports.ALL_ALLOWED_MIME_TYPES = void 0;
const tsyringe_1 = require("tsyringe");
const Media_1 = require("../../domain/entities/Media");
const MediaNoEncontradoError_1 = require("../../domain/errors/Media/MediaNoEncontradoError");
const BUCKET = 'public-assets';
const ALLOWED_MIME_TYPES = {
    IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    FILE: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
    ],
};
exports.ALL_ALLOWED_MIME_TYPES = [
    ...ALLOWED_MIME_TYPES.IMAGE,
    ...ALLOWED_MIME_TYPES.AUDIO,
    ...ALLOWED_MIME_TYPES.VIDEO,
    ...ALLOWED_MIME_TYPES.FILE,
];
let GestionarMediaUseCase = class GestionarMediaUseCase {
    constructor(mediaRepository, storageService) {
        this.mediaRepository = mediaRepository;
        this.storageService = storageService;
        this.MAX_TAMANIO_MB = 50;
    }
    // ─── Subir archivo ──────────────────────────────────────────────────────────
    async subirArchivo(usuarioId, archivo) {
        // Validar MIME type
        if (!exports.ALL_ALLOWED_MIME_TYPES.includes(archivo.mimetype)) {
            throw new Error(`Tipo de archivo no permitido: ${archivo.mimetype}`);
        }
        // Validar tamaño (50 MB)
        const tamanioMB = archivo.size / (1024 * 1024);
        if (tamanioMB > this.MAX_TAMANIO_MB) {
            throw new Error(`El archivo excede el tamaño máximo permitido de ${this.MAX_TAMANIO_MB} MB`);
        }
        // Generar path único en storage
        const ext = archivo.originalname.split('.').pop() ?? 'bin';
        const storagePath = `media/${usuarioId}/${Date.now()}_${archivo.originalname.replace(/\s+/g, '_')}`;
        // Subir al bucket
        const url = await this.storageService.uploadFile(archivo.buffer, storagePath, BUCKET, archivo.mimetype);
        // Crear registro en la DB
        const nuevoMedia = new Media_1.Media(0, url, archivo.originalname, archivo.mimetype, BigInt(archivo.size), 'Activo');
        return this.mediaRepository.crear(nuevoMedia);
    }
    // ─── Obtener por ID ──────────────────────────────────────────────────────────
    async obtenerPorId(id) {
        const media = await this.mediaRepository.obtenerPorId(id);
        if (!media)
            throw new MediaNoEncontradoError_1.MediaNoEncontradoError(id);
        if (!media.esActivo())
            throw new Error('El archivo ha sido eliminado');
        return media;
    }
    // ─── Listar con filtros ──────────────────────────────────────────────────────
    async obtenerTodos(filtros) {
        return this.mediaRepository.obtenerTodos(filtros);
    }
    // ─── Actualizar nombre ───────────────────────────────────────────────────────
    async actualizar(id, dto) {
        const media = await this.mediaRepository.obtenerPorId(id);
        if (!media)
            throw new MediaNoEncontradoError_1.MediaNoEncontradoError(id);
        const actualizado = await this.mediaRepository.actualizar(id, dto);
        if (!actualizado)
            throw new Error('Error al actualizar el archivo');
        return actualizado;
    }
    // ─── Eliminar (soft delete + storage) ───────────────────────────────────────
    async eliminar(id) {
        const media = await this.mediaRepository.obtenerPorId(id);
        if (!media)
            throw new MediaNoEncontradoError_1.MediaNoEncontradoError(id);
        // Intentar eliminar del storage (no bloqueante si falla)
        try {
            // Extraer path relativo de la URL pública
            const url = media.archivo;
            const pathMatch = url.match(/public-assets\/(.+)$/);
            if (pathMatch) {
                await this.storageService.deleteFile(pathMatch[1], BUCKET);
            }
        }
        catch (_) {
            // El soft delete en DB sigue aunque el storage falle
        }
        const eliminado = await this.mediaRepository.eliminar(id);
        if (!eliminado)
            throw new Error('Error al eliminar el archivo');
    }
    // ─── Tipos permitidos (para documentación / validación en cliente) ───────────
    obtenerTiposPermitidos() {
        return ALLOWED_MIME_TYPES;
    }
};
exports.GestionarMediaUseCase = GestionarMediaUseCase;
exports.GestionarMediaUseCase = GestionarMediaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('MediaRepository')),
    __param(1, (0, tsyringe_1.inject)('StorageService')),
    __metadata("design:paramtypes", [Object, Object])
], GestionarMediaUseCase);
