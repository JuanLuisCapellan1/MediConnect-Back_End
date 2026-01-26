import { IBarriosRepository } from '../../repositories/IBarriosRepository';
import { BarrioYaExisteError } from '../../errors/Barrios/BarrioYaExisteError';
import { ISeccionesRepository } from '../../repositories/ISeccionesRepository';

export class BarrioValidator {
  constructor(
    private barriosRepository: IBarriosRepository,
    private seccionesRepository: ISeccionesRepository
  ) {}

  /**
   * Valida si un barrio puede ser creado (que no exista ya en esa sección)
   * @param nombre - Nombre del barrio a validar
   * @param seccionId - ID de la sección a la que pertenece
   * @throws BarrioYaExisteError si el barrio ya existe en esa sección
   * @throws Error si la sección no existe
   */
  async validarCreacion(nombre: string, seccionId: number): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del barrio es requerido');
    }

    if (!seccionId || seccionId <= 0) {
      throw new Error('El ID de la sección es requerido y debe ser válido');
    }

    // Validar que la sección exista
    const seccion = await this.seccionesRepository.obtenerPorId(seccionId);
    if (!seccion) {
      throw new Error(`La sección con ID ${seccionId} no existe`);
    }

    // Validar que el barrio no exista en esa sección
    const barriosEnSeccion = await this.barriosRepository.listarPorSeccion(seccionId);
    const barrioExistente = barriosEnSeccion.some(
      b => b.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );

    if (barrioExistente) {
      throw new BarrioYaExisteError(nombre, seccionId);
    }
  }

  /**
   * Valida si un barrio puede cambiar de sección
   * @param seccionId - ID de la nueva sección
   * @param barrioId - ID del barrio a actualizar
   * @throws Error si el barrio o la sección no existen
   * @throws BarrioYaExisteError si existe otro barrio con el mismo nombre en la nueva sección
   */
  async validarActualizacionSeccion(seccionId: number, barrioId: number): Promise<void> {
    // Validar que el ID del barrio sea válido
    if (!barrioId || barrioId <= 0) {
      throw new Error('El ID del barrio es requerido y debe ser válido');
    }

    // Verificar que el barrio exista
    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }

    // Validar que el ID de la sección sea válido
    if (!seccionId || seccionId <= 0) {
      throw new Error('El ID de la sección es requerido y debe ser válido');
    }

    // Verificar que la sección exista
    const seccion = await this.seccionesRepository.obtenerPorId(seccionId);
    if (!seccion) {
      throw new Error(`La sección con ID ${seccionId} no existe`);
    }

    // Si se está cambiando de sección, validar que no exista otro barrio con el mismo nombre
    if (barrio.seccionId !== seccionId) {
      const barriosEnNuevaSeccion = await this.barriosRepository.listarPorSeccion(seccionId);
      const barrioExistente = barriosEnNuevaSeccion.some(
        b => b.nombre.toLowerCase().trim() === barrio.nombre.toLowerCase().trim()
      );

      if (barrioExistente) {
        throw new BarrioYaExisteError(barrio.nombre, seccionId);
      }
    }
  }
}
