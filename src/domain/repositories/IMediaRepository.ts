import { Media } from '../entities/Media';
import { FiltroMediaDto } from '../../application/dtos/MediaDtos';

export interface IMediaRepository {
  crear(media: Media): Promise<Media>;
  obtenerPorId(id: number): Promise<Media | null>;
  obtenerTodos(filtros: FiltroMediaDto): Promise<Media[]>;
  actualizar(id: number, media: Partial<Media>): Promise<Media | null>;
  eliminar(id: number): Promise<boolean>;
  contarPorTipo(tipoMime: string): Promise<number>;
}
