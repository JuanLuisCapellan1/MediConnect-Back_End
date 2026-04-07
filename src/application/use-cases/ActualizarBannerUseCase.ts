import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { SupabaseStorageService } from '../../infrastructure/external-services/SupabaseStorageService';

@injectable()
export class ActualizarBannerUseCase {
    constructor(
        @inject('IUsuarioRepository')
        private usuarioRepository: IUsuarioRepository,
        @inject(SupabaseStorageService)
        private storageService: SupabaseStorageService
    ) { }

    async execute(
        usuarioId: number,
        file: Express.Multer.File
    ): Promise<{ bannerUrl: string }> {
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
        const nuevoBannerUrl = await this.storageService.uploadFile(
            file.buffer,
            fileName,
            'public-assets',
            file.mimetype
        );

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
            } catch (error) {
                // Si falla la eliminación del banner anterior, solo logueamos pero no bloqueamos
                console.warn('No se pudo eliminar el banner anterior:', error);
            }
        }

        return { bannerUrl: nuevoBannerUrl };
    }
}
