import { inject, injectable } from 'tsyringe';
import { IBarriosRepository } from '../../repositories/IBarriosRepository';

@injectable()
export class UbicacionValidator {
  constructor(
    @inject('IBarriosRepository') private barriosRepository: IBarriosRepository
  ) { }

  /**
   * Valida si una Ubicacion puede ser creada
   * @param barrioId - ID del barrio
   * @param direccion - Dirección de la ubicación
   * @throws Error si la dirección está vacía o el barrio no existe
   */
  async validarCreacion(
    barrioId: number,
    direccion: string
  ): Promise<void> {
    if (!direccion || direccion.trim().length === 0) {
      throw new Error('La dirección es requerida');
    }

    if (direccion.trim().length > 255) {
      throw new Error('La dirección no puede exceder 255 caracteres');
    }

    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }
  }

  /**
   * Valida si una Ubicacion puede cambiar de barrio
   * @param barrioId - ID del nuevo barrio
   * @param ubicacionId - ID de la Ubicacion a actualizar
   * @throws Error si el barrio no existe
   */
  async validarActualizacionUbicacion(
    barrioId: number,
    subBarrioId: number | undefined, // mantenido por compatibilidad, ignorado
    ubicacionId: number
  ): Promise<void> {
    if (!ubicacionId || ubicacionId <= 0) {
      throw new Error('El ID de la ubicación es requerido y debe ser válido');
    }

    const barrio = await this.barriosRepository.buscarPorId(barrioId);
    if (!barrio) {
      throw new Error(`El barrio con ID ${barrioId} no existe`);
    }
  }

  validarCodigoPostal(codigoPostal?: string): void {
    if (codigoPostal && codigoPostal.trim().length > 10) {
      throw new Error('El código postal no puede exceder 10 caracteres');
    }
  }

  validarPuntoGeografico(puntoGeografico?: string): void {
    if (!puntoGeografico) return;

    try {
      const geoJson = JSON.parse(puntoGeografico);

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
      if (error instanceof Error) throw error;
      throw new Error('El formato del punto geográfico debe ser GeoJSON válido');
    }
  }
}
