/**
 * UbicacionValidator.ts
 * Validador de reglas de negocio para Ubicaciones
 * Valida la creación y actualización de Ubicaciones
 */

import { inject, injectable } from 'tsyringe';
import { IBarriosRepository } from '../../repositories/IBarriosRepository';
import { ISubBarriosRepository } from '../../repositories/ISubBarriosRepository';
import { Barrio } from '../../entities/Barrio';
import { SubBarrio } from '../../entities/SubBarrio';

@injectable()
export class UbicacionValidator {
  constructor(
    @inject('IBarriosRepository') private barriosRepository: IBarriosRepository,
    @inject('ISubBarriosRepository') private subBarriosRepository: ISubBarriosRepository
  ) {}

  /**
   * Valida si una Ubicacion puede ser creada
   * @param barrioId - ID del barrio
   * @param subBarrioId - ID del SubBarrio (opcional)
   * @param direccion - Dirección de la ubicación
   * @throws Error si la dirección está vacía, barrio no existe o SubBarrio no existe
   */
  async validarCreacion(
    barrioId: number,
    direccion: string,
    subBarrioId?: number
  ): Promise<void> {
    // Validar que la dirección no esté vacía
    if (!direccion || direccion.trim().length === 0) {
      throw new Error('La dirección es requerida');
    }

    // Validar que la dirección no sea demasiado larga
    if (direccion.trim().length > 255) {
      throw new Error('La dirección no puede exceder 255 caracteres');
    }

    // Validar que el barrio exista
    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }

    // Si se proporciona subBarrioId, validar que existe y pertenece al barrio
    if (subBarrioId !== undefined && subBarrioId !== null && subBarrioId > 0) {
      const subBarrio = await this.subBarriosRepository.buscarPorId(subBarrioId);
      if (!subBarrio) {
        throw new Error(`El SubBarrio con ID ${subBarrioId} no existe`);
      }

      // Verificar que el SubBarrio pertenece al barrio especificado
      if (subBarrio.barrioId !== barrioId) {
        throw new Error(
          `El SubBarrio con ID ${subBarrioId} no pertenece al barrio con ID ${barrioId}`
        );
      }
    }
  }

  /**
   * Valida si una Ubicacion puede cambiar de barrio o SubBarrio
   * @param barrioId - ID del nuevo barrio
   * @param subBarrioId - ID del nuevo SubBarrio (opcional)
   * @param ubicacionId - ID de la Ubicacion a actualizar
   * @throws Error si el barrio o SubBarrio no existen
   */
  async validarActualizacionUbicacion(
    barrioId: number,
    subBarrioId: number | undefined,
    ubicacionId: number
  ): Promise<void> {
    // Validar que el ID de la ubicación sea válido
    if (!ubicacionId || ubicacionId <= 0) {
      throw new Error('El ID de la ubicación es requerido y debe ser válido');
    }

    // Validar que el barrio exista
    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }

    // Si se proporciona subBarrioId, validar que existe y pertenece al barrio
    if (subBarrioId !== undefined && subBarrioId !== null && subBarrioId > 0) {
      const subBarrio = await this.subBarriosRepository.buscarPorId(subBarrioId);
      if (!subBarrio) {
        throw new Error(`El SubBarrio con ID ${subBarrioId} no existe`);
      }

      // Verificar que el SubBarrio pertenece al barrio especificado
      if (subBarrio.barrioId !== barrioId) {
        throw new Error(
          `El SubBarrio con ID ${subBarrioId} no pertenece al barrio con ID ${barrioId}`
        );
      }
    }
  }

  /**
   * Valida que un código postal sea válido (si se proporciona)
   * @param codigoPostal - Código postal a validar
   * @throws Error si el código postal excede 10 caracteres
   */
  validarCodigoPostal(codigoPostal?: string): void {
    if (codigoPostal && codigoPostal.trim().length > 10) {
      throw new Error('El código postal no puede exceder 10 caracteres');
    }
  }

  /**
   * Valida que un punto geográfico sea válido en formato GeoJSON (si se proporciona)
   * @param puntoGeografico - Punto geográfico en formato GeoJSON
   * @throws Error si el formato GeoJSON es inválido
   */
  validarPuntoGeografico(puntoGeografico?: string): void {
    if (!puntoGeografico) {
      return; // Optional field
    }

    try {
      const geoJson = JSON.parse(puntoGeografico);
      
      // Validar estructura GeoJSON básica
      if (!geoJson.type || geoJson.type !== 'Point') {
        throw new Error('El punto geográfico debe ser de tipo Point');
      }

      if (!geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
        throw new Error('Las coordenadas del punto geográfico son requeridas');
      }

      if (geoJson.coordinates.length !== 2) {
        throw new Error('Las coordenadas deben contener [longitude, latitude]');
      }

      const [longitude, latitude] = geoJson.coordinates;

      // Validar rangos de coordenadas
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        throw new Error('Las coordenadas deben ser números');
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error('La longitud debe estar entre -180 y 180');
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error('La latitud debe estar entre -90 y 90');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('El formato del punto geográfico debe ser GeoJSON válido');
    }
  }
}
