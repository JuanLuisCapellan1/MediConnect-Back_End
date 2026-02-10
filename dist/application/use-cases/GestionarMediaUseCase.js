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
exports.GestionarMediaUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Media_1 = require("../../domain/entities/Media");
const MediaNoEncontradoError_1 = require("../../domain/errors/Media/MediaNoEncontradoError");
let GestionarMediaUseCase = class GestionarMediaUseCase {
    constructor(mediaRepository) {
        this.mediaRepository = mediaRepository;
        // Límite de tamaño en MB (configurar según necesidades)
        this.MAX_TAMANIO_MB = 50;
    }
    /**
     * Crea un nuevo registro de media
     */
    async crear(dto) {
        const nuevoMedia = new Media_1.Media(0, // ID será asignado por la base de datos
        dto.archivo, dto.nombre, dto.tipoMime, BigInt(dto.tamanioBytes ?? 0), 'Activo');
        // Validar tamaño máximo
        if (!nuevoMedia.validarTamanioMaximo(this.MAX_TAMANIO_MB)) {
            throw new Error(`El archivo excede el tamaño máximo permitido de ${this.MAX_TAMANIO_MB}MB`);
        }
        return await this.mediaRepository.crear(nuevoMedia);
    }
    /**
     * Obtiene un media por ID
     */
    async obtenerPorId(id) {
        const media = await this.mediaRepository.obtenerPorId(id);
        if (!media) {
            throw new MediaNoEncontradoError_1.MediaNoEncontradoError(id);
        }
        if (!media.esActivo()) {
            throw new Error('El archivo ha sido eliminado');
        }
        return media;
    }
    /**
     * Obtiene todos los media con filtros
     */
    async obtenerTodos(filtros) {
        return await this.mediaRepository.obtenerTodos(filtros);
    }
    /**
     * Actualiza un media
     */
    async actualizar(id, dto) {
        const media = await this.mediaRepository.obtenerPorId(id);
        if (!media) {
            throw new MediaNoEncontradoError_1.MediaNoEncontradoError(id);
        }
        const mediaActualizado = await this.mediaRepository.actualizar(id, dto);
        if (!mediaActualizado) {
            throw new Error('Error al actualizar el archivo');
        }
        return mediaActualizado;
    }
    /**
     * Elimina un media (soft delete)
     */
    async eliminar(id) {
        const media = await this.mediaRepository.obtenerPorId(id);
        if (!media) {
            throw new MediaNoEncontradoError_1.MediaNoEncontradoError(id);
        }
        const eliminado = await this.mediaRepository.eliminar(id);
        if (!eliminado) {
            throw new Error('Error al eliminar el archivo');
        }
    }
    /**
     * Obtiene estadísticas de media por tipo
     */
    async obtenerEstadisticas() {
        const [totalImagenes, totalVideos, totalAudios, totalDocumentos] = await Promise.all([
            this.mediaRepository.contarPorTipo('image/'),
            this.mediaRepository.contarPorTipo('video/'),
            this.mediaRepository.contarPorTipo('audio/'),
            this.mediaRepository.contarPorTipo('application/')
        ]);
        return {
            totalImagenes,
            totalVideos,
            totalAudios,
            totalDocumentos
        };
    }
};
exports.GestionarMediaUseCase = GestionarMediaUseCase;
exports.GestionarMediaUseCase = GestionarMediaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('MediaRepository')),
    __metadata("design:paramtypes", [Object])
], GestionarMediaUseCase);
