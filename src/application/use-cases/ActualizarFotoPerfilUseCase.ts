import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { SupabaseStorageService } from '../../infrastructure/external-services/SupabaseStorageService';

@injectable()
export class ActualizarFotoPerfilUseCase {
    constructor(
        @inject('IUsuarioRepository')
        private usuarioRepository: IUsuarioRepository,
        @inject(SupabaseStorageService)
        private storageService: SupabaseStorageService
    ) { }

    async execute(
        usuarioId: number,
        file: Express.Multer.File
    ): Promise<{ fotoPerfilUrl: string }> {
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
        const nuevaFotoUrl = await this.storageService.uploadFile(
            file.buffer,
            fileName,
            'public-assets',
            file.mimetype
        );

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
            } catch (error) {
                // Si falla la eliminación de la foto anterior, solo logueamos pero no bloqueamos
                console.warn('No se pudo eliminar la foto anterior:', error);
            }
        }

        return { fotoPerfilUrl: nuevaFotoUrl };
    }
}
