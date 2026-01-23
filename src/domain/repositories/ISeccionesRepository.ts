import { Seccion } from '../entities/Seccion';
import { ActualizarSeccionDto } from '../../application/dtos/SeccionDtos';

export interface ISeccionesRepository {
  obtenerTodas(estado?: string): Promise<Seccion[]>;
  obtenerPorId(id: number): Promise<Seccion | null>;
  obtenerPorDistrito(distritoMunicipalId: number, estado?: string): Promise<Seccion[]>;
  buscarPorNombre(nombre: string, distritoMunicipalId?: number, estado?: string): Promise<Seccion[]>;
  buscarPorNombreSensitive(nombre: string, distritoMunicipalId?: number, estado?: string): Promise<Seccion[]>;
  crear(seccion: Seccion): Promise<Seccion>;
  actualizar(id: number, datos: ActualizarSeccionDto): Promise<Seccion>;
  eliminar(id: number): Promise<Seccion>;
}
