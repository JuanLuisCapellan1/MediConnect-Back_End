/**
 * SubBarrioValidator.ts
 * Validador de reglas de negocio para SubBarrios
 * Valida la creación y actualización de SubBarrios
 */

import { inject, injectable } from 'tsyringe';
import { ISubBarriosRepository } from '../../repositories/ISubBarriosRepository';
import { IBarriosRepository } from '../../repositories/IBarriosRepository';
import { SubBarrioYaExisteError } from '../../errors/SubBarrios/SubBarrioYaExisteError';
import { SubBarrio } from '../../entities/SubBarrio';

@injectable()
export class SubBarrioValidator {
  constructor(
    @inject('ISubBarriosRepository') private subBarriosRepository: ISubBarriosRepository,
    @inject('IBarriosRepository') private barriosRepository: IBarriosRepository
  ) {}

  /**
   * Valida si un SubBarrio puede ser creado
   * @param nombre - Nombre del SubBarrio
   * @param barrioId - ID del barrio al que pertenecerá
   * @throws Error si el nombre está vacío o el barrio no existe
   * @throws SubBarrioYaExisteError si ya existe un SubBarrio con el mismo nombre en el barrio
   */
  async validarCreacion(nombre: string, barrioId: number): Promise<void> {
    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del SubBarrio es requerido');
    }

    // Validar que el barrio exista
    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }

    // Validar que no exista otro SubBarrio con el mismo nombre en este barrio
    const subBarriosEnBarrio = await this.subBarriosRepository.listarPorBarrio(barrioId);
    const subBarrioExistente = subBarriosEnBarrio.some(
      (sb: SubBarrio) => sb.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );

    if (subBarrioExistente) {
      throw new SubBarrioYaExisteError(nombre, barrioId);
    }
  }

  /**
   * Valida si un SubBarrio puede cambiar de barrio
   * @param barrioId - ID del nuevo barrio
   * @param subBarrioId - ID del SubBarrio a actualizar
   * @throws Error si el SubBarrio o el barrio no existen
   * @throws SubBarrioYaExisteError si existe otro SubBarrio con el mismo nombre en el nuevo barrio
   */
  async validarActualizacionBarrio(
    barrioId: number,
    subBarrioId: number
  ): Promise<void> {
    // Validar que el ID del SubBarrio sea válido
    if (!subBarrioId || subBarrioId <= 0) {
      throw new Error('El ID del SubBarrio es requerido y debe ser válido');
    }

    // Verificar que el SubBarrio exista
    const subBarrio = await this.subBarriosRepository.buscarPorId(subBarrioId);
    if (!subBarrio) {
      throw new Error(`El SubBarrio con ID ${subBarrioId} no existe`);
    }

    // Validar que el ID del barrio sea válido
    if (!barrioId || barrioId <= 0) {
      throw new Error('El ID del barrio es requerido y debe ser válido');
    }

    // Verificar que el barrio exista
    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }

    // Si se está cambiando de barrio, validar que no exista otro SubBarrio con el mismo nombre
    if (subBarrio.barrioId !== barrioId) {
      const subBarriosEnNuevoBarrio = await this.subBarriosRepository.listarPorBarrio(
        barrioId
      );
      const subBarrioExistente = subBarriosEnNuevoBarrio.some(
        (sb: SubBarrio) => sb.nombre.toLowerCase().trim() === subBarrio.nombre.toLowerCase().trim()
      );

      if (subBarrioExistente) {
        throw new SubBarrioYaExisteError(subBarrio.nombre, barrioId);
      }
    }
  }
}
