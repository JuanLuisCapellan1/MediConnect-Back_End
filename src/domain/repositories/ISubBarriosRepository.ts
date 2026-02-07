/**
 * ISubBarriosRepository.ts
 * Interfaz del repositorio para operaciones de persistencia de SubBarrios
 * Define el contrato que debe cumplir cualquier implementación de repositorio
 */

import { SubBarrio } from '../entities/SubBarrio';

export interface ISubBarriosRepository {
  /**
   * Crea un nuevo SubBarrio en la base de datos
   */
  crear(barrioId: number, nombre: string): Promise<SubBarrio>;

  /**
   * Obtiene todos los SubBarrios
   */
  listarTodos(): Promise<SubBarrio[]>;

  /**
   * Obtiene todos los SubBarrios de un barrio específico
   */
  listarPorBarrio(barrioId: number): Promise<SubBarrio[]>;

  /**
   * Busca un SubBarrio por su ID
   */
  buscarPorId(id: number): Promise<SubBarrio | null>;

  /**
   * Busca SubBarrios por nombre
   */
  buscarPorNombre(nombre: string): Promise<SubBarrio[]>;

  /**
   * Busca SubBarrios por estado
   */
  buscarPorEstado(estado: string): Promise<SubBarrio[]>;

  /**
   * Actualiza un SubBarrio existente
   */
  actualizar(
    id: number,
    barrioId?: number,
    nombre?: string,
    estado?: string
  ): Promise<SubBarrio>;

  /**
   * Elimina un SubBarrio (eliminación lógica)
   */
  eliminar(id: number): Promise<SubBarrio>;
}
