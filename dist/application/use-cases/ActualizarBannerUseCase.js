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
exports.ActualizarBannerUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
let ActualizarBannerUseCase = class ActualizarBannerUseCase {
    constructor(usuarioRepository, storageService) {
        this.usuarioRepository = usuarioRepository;
        this.storageService = storageService;
    }
    async execute(usuarioId, file) {
        // 1. Verificar que el usuario existe
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        // 2. Obtener el banner anterior (si existe) para eliminarlo después
        const bannerAnterior = usuario.banner;
        // 3. Determinar la extensión del archivo
        const extension = file.mimetype.split('/')[1];
        const fileName = `users/${usuarioId}/banner.${extension}`;
        // 4. Subir el nuevo banner a Supabase
        const nuevoBannerUrl = await this.storageService.uploadFile(file.buffer, fileName, 'public-assets', file.mimetype);
        // 5. Actualizar la base de datos
        await this.usuarioRepository.updateBanner(usuarioId, nuevoBannerUrl);
        // 6. Eliminar el banner anterior de Supabase (si existe y es diferente)
        if (bannerAnterior && bannerAnterior !== nuevoBannerUrl) {
            try {
                // Extraer el path de la URL anterior
                const url = new URL(bannerAnterior);
                const pathParts = url.pathname.split('/');
                const bucketIndex = pathParts.findIndex(part => part === 'public-assets');
                if (bucketIndex !== -1) {
                    const oldPath = pathParts.slice(bucketIndex + 1).join('/');
                    await this.storageService.deleteFile(oldPath, 'public-assets');
                }
            }
            catch (error) {
                // Si falla la eliminación del banner anterior, solo logueamos pero no bloqueamos
                console.warn('No se pudo eliminar el banner anterior:', error);
            }
        }
        return { bannerUrl: nuevoBannerUrl };
    }
};
exports.ActualizarBannerUseCase = ActualizarBannerUseCase;
exports.ActualizarBannerUseCase = ActualizarBannerUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)(SupabaseStorageService_1.SupabaseStorageService)),
    __metadata("design:paramtypes", [Object, SupabaseStorageService_1.SupabaseStorageService])
], ActualizarBannerUseCase);
