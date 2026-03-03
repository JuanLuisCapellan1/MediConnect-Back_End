import { injectable, inject } from 'tsyringe';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';
import { IStorageService } from '../interfaces/IStorageService';
import { Media } from '../../domain/entities/Media';
import {
  ActualizarMediaDto,
  FiltroMediaDto
} from '../dtos/MediaDtos';
import { MediaNoEncontradoError } from '../../domain/errors/Media/MediaNoEncontradoError';

const BUCKET = 'public-assets' as const;

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
} as const;

export const ALL_ALLOWED_MIME_TYPES: string[] = [
  ...ALLOWED_MIME_TYPES.IMAGE,
  ...ALLOWED_MIME_TYPES.AUDIO,
  ...ALLOWED_MIME_TYPES.VIDEO,
  ...ALLOWED_MIME_TYPES.FILE,
];

export interface ArchivoUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@injectable()
export class GestionarMediaUseCase {
  private readonly MAX_TAMANIO_MB = 50;

  constructor(
    @inject('MediaRepository')
    private mediaRepository: IMediaRepository,
    @inject('StorageService')
    private storageService: IStorageService
  ) { }

  // ─── Subir archivo ──────────────────────────────────────────────────────────
  async subirArchivo(usuarioId: number, archivo: ArchivoUpload): Promise<Media> {
    // Validar MIME type
    if (!ALL_ALLOWED_MIME_TYPES.includes(archivo.mimetype)) {
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
    const url = await this.storageService.uploadFile(
      archivo.buffer,
      storagePath,
      BUCKET,
      archivo.mimetype
    );

    // Crear registro en la DB
    const nuevoMedia = new Media(
      0,
      url,
      archivo.originalname,
      archivo.mimetype,
      BigInt(archivo.size),
      'Activo'
    );

    return this.mediaRepository.crear(nuevoMedia);
  }

  // ─── Obtener por ID ──────────────────────────────────────────────────────────
  async obtenerPorId(id: number): Promise<Media> {
    const media = await this.mediaRepository.obtenerPorId(id);
    if (!media) throw new MediaNoEncontradoError(id);
    if (!media.esActivo()) throw new Error('El archivo ha sido eliminado');
    return media;
  }

  // ─── Listar con filtros ──────────────────────────────────────────────────────
  async obtenerTodos(filtros: FiltroMediaDto): Promise<Media[]> {
    return this.mediaRepository.obtenerTodos(filtros);
  }

  // ─── Actualizar nombre ───────────────────────────────────────────────────────
  async actualizar(id: number, dto: ActualizarMediaDto): Promise<Media> {
    const media = await this.mediaRepository.obtenerPorId(id);
    if (!media) throw new MediaNoEncontradoError(id);

    const actualizado = await this.mediaRepository.actualizar(id, dto);
    if (!actualizado) throw new Error('Error al actualizar el archivo');
    return actualizado;
  }

  // ─── Eliminar (soft delete + storage) ───────────────────────────────────────
  async eliminar(id: number): Promise<void> {
    const media = await this.mediaRepository.obtenerPorId(id);
    if (!media) throw new MediaNoEncontradoError(id);

    // Intentar eliminar del storage (no bloqueante si falla)
    try {
      // Extraer path relativo de la URL pública
      const url = media.archivo;
      const pathMatch = url.match(/public-assets\/(.+)$/);
      if (pathMatch) {
        await this.storageService.deleteFile(pathMatch[1], BUCKET);
      }
    } catch (_) {
      // El soft delete en DB sigue aunque el storage falle
    }

    const eliminado = await this.mediaRepository.eliminar(id);
    if (!eliminado) throw new Error('Error al eliminar el archivo');
  }

  // ─── Tipos permitidos (para documentación / validación en cliente) ───────────
  obtenerTiposPermitidos() {
    return ALLOWED_MIME_TYPES;
  }
}
