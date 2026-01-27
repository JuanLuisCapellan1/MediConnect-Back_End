/**
 * IUbicacionesRepository.ts
 * Interfaz del repositorio para operaciones de persistencia de Ubicaciones
 * Define el contrato que debe cumplir cualquier implementación de repositorio
 */

import { Ubicacion } from '../entities/Ubicacion';

export interface IUbicacionesRepository {
  /**
   * Crea una nueva Ubicacion en la base de datos
   */
  crear(
    barrioId: number,
    direccion: string,
    subBarrioId?: number,
    codigoPostal?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion>;

  /**
   * Obtiene todas las Ubicaciones
   */
  listarTodas(): Promise<Ubicacion[]>;

  /**
   * Obtiene todas las Ubicaciones de un barrio específico
   */
  listarPorBarrio(barrioId: number): Promise<Ubicacion[]>;

  /**
   * Obtiene todas las Ubicaciones de un SubBarrio específico
   */
  listarPorSubBarrio(subBarrioId: number): Promise<Ubicacion[]>;

  /**
   * Busca una Ubicacion por su ID
   */
  buscarPorId(id: number): Promise<Ubicacion | null>;

  /**
   * Busca Ubicaciones por dirección (búsqueda parcial)
   */
  buscarPorDireccion(direccion: string): Promise<Ubicacion[]>;

  /**
   * Busca Ubicaciones por código postal
   */
  buscarPorCodigoPostal(codigoPostal: string): Promise<Ubicacion[]>;

  /**
   * Busca Ubicaciones por estado
   */
  buscarPorEstado(estado: string): Promise<Ubicacion[]>;

  /**
   * Actualiza una Ubicacion existente
   */
  actualizar(
    id: number,
    barrioId?: number,
    subBarrioId?: number,
    direccion?: string,
    codigoPostal?: string,
    estado?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion>;

  /**
   * Elimina una Ubicacion (eliminación lógica)
   */
  eliminar(id: number): Promise<Ubicacion>;
}
