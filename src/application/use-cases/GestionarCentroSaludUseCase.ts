import { injectable, inject } from 'tsyringe';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { SupabaseStorageService } from '../../infrastructure/external-services/SupabaseStorageService';
import { ActualizarCentroSaludDto, ActualizarUbicacionCentroDto } from '../dtos/ActualizarCentroSaludDto';

@injectable()
export class GestionarCentroSaludUseCase {
    constructor(
        @inject('CentroSaludRepository') private centroRepo: ICentroSaludRepository,
        @inject(SupabaseStorageService) private supabase: SupabaseStorageService
    ) { }

    // ─── Perfil ────────────────────────────────────────────────────────────────

    async obtenerPerfil(centroId: number): Promise<any> {
        const centro = await this.centroRepo.obtenerPerfilCompleto(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return centro;
    }

    async actualizarPerfil(centroId: number, dto: ActualizarCentroSaludDto): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');

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

    async actualizarFoto(centroId: number, file: Express.Multer.File): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');

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

    async obtenerUbicacion(centroId: number): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.obtenerUbicacion(centroId);
    }

    async actualizarUbicacion(centroId: number, dto: ActualizarUbicacionCentroDto): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.actualizarUbicacion(centroId, dto);
    }

    // ─── Doctores asociados ────────────────────────────────────────────────────

    async listarDoctoresAsociados(centroId: number): Promise<any[]> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.listarDoctoresAsociados(centroId);
    }
}
