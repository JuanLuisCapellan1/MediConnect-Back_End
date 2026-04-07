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
exports.ActualizarFotoPerfilUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
let ActualizarFotoPerfilUseCase = class ActualizarFotoPerfilUseCase {
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
        // 2. Obtener la foto anterior (si existe) para eliminarla después
        const fotoAnterior = usuario.foto_perfil;
        // 3. Determinar la extensión del archivo
        const extension = file.mimetype.split('/')[1];
        const fileName = `users/${usuarioId}/profile.${extension}`;
        // 4. Subir la nueva foto a Supabase
        const nuevaFotoUrl = await this.storageService.uploadFile(file.buffer, fileName, 'public-assets', file.mimetype);
        // 5. Actualizar la base de datos
        await this.usuarioRepository.updateProfilePhoto(usuarioId, nuevaFotoUrl);
        // 6. Eliminar la foto anterior de Supabase (si existe y es diferente)
        if (fotoAnterior && fotoAnterior !== nuevaFotoUrl) {
            try {
                // Extraer el path de la URL anterior
                const url = new URL(fotoAnterior);
                const pathParts = url.pathname.split('/');
                const bucketIndex = pathParts.findIndex(part => part === 'public-assets');
                if (bucketIndex !== -1) {
                    const oldPath = pathParts.slice(bucketIndex + 1).join('/');
                    await this.storageService.deleteFile(oldPath, 'public-assets');
                }
            }
            catch (error) {
                // Si falla la eliminación de la foto anterior, solo logueamos pero no bloqueamos
                console.warn('No se pudo eliminar la foto anterior:', error);
            }
        }
        return { fotoPerfilUrl: nuevaFotoUrl };
    }
};
exports.ActualizarFotoPerfilUseCase = ActualizarFotoPerfilUseCase;
exports.ActualizarFotoPerfilUseCase = ActualizarFotoPerfilUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)(SupabaseStorageService_1.SupabaseStorageService)),
    __metadata("design:paramtypes", [Object, SupabaseStorageService_1.SupabaseStorageService])
], ActualizarFotoPerfilUseCase);
