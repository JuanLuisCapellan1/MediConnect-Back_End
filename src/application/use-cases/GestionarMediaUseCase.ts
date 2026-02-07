import { injectable, inject } from 'tsyringe';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';
import { Media } from '../../domain/entities/Media';
import {
  CrearMediaDto,
  ActualizarMediaDto,
  FiltroMediaDto
} from '../dtos/MediaDtos';
import { MediaNoEncontradoError } from '../../domain/errors/Media/MediaNoEncontradoError';

@injectable()
export class GestionarMediaUseCase {
  // Límite de tamaño en MB (configurar según necesidades)
  private readonly MAX_TAMANIO_MB = 50;

  constructor(
    @inject('MediaRepository')
    private mediaRepository: IMediaRepository
  ) {}

  /**
   * Crea un nuevo registro de media
   */
  async crear(dto: CrearMediaDto): Promise<Media> {
    const nuevoMedia = new Media(
      0, // ID será asignado por la base de datos
      dto.archivo,
      dto.nombre,
      dto.tipoMime,
      BigInt(dto.tamanioBytes ?? 0),
      'Activo'
    );

    // Validar tamaño máximo
    if (!nuevoMedia.validarTamanioMaximo(this.MAX_TAMANIO_MB)) {
      throw new Error(`El archivo excede el tamaño máximo permitido de ${this.MAX_TAMANIO_MB}MB`);
    }

    return await this.mediaRepository.crear(nuevoMedia);
  }

  /**
   * Obtiene un media por ID
   */
  async obtenerPorId(id: number): Promise<Media> {
    const media = await this.mediaRepository.obtenerPorId(id);

    if (!media) {
      throw new MediaNoEncontradoError(id);
    }

    if (!media.esActivo()) {
      throw new Error('El archivo ha sido eliminado');
    }

    return media;
  }

  /**
   * Obtiene todos los media con filtros
   */
  async obtenerTodos(filtros: FiltroMediaDto): Promise<Media[]> {
    return await this.mediaRepository.obtenerTodos(filtros);
  }

  /**
   * Actualiza un media
   */
  async actualizar(id: number, dto: ActualizarMediaDto): Promise<Media> {
    const media = await this.mediaRepository.obtenerPorId(id);

    if (!media) {
      throw new MediaNoEncontradoError(id);
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
  async eliminar(id: number): Promise<void> {
    const media = await this.mediaRepository.obtenerPorId(id);

    if (!media) {
      throw new MediaNoEncontradoError(id);
    }

    const eliminado = await this.mediaRepository.eliminar(id);

    if (!eliminado) {
      throw new Error('Error al eliminar el archivo');
    }
  }

  /**
   * Obtiene estadísticas de media por tipo
   */
  async obtenerEstadisticas(): Promise<{
    totalImagenes: number;
    totalVideos: number;
    totalAudios: number;
    totalDocumentos: number;
  }> {
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
}
