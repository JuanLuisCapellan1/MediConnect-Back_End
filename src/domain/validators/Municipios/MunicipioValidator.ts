import { IMunicipiosRepository } from '../../repositories/IMunicipiosRepository';
import { MunicipioYaExisteError } from '../../errors/Municipios/MunicipioYaExisteError';
import { IProvinciasRepository } from '../../repositories/IProvinciasRepository';

export class MunicipioValidator {
  constructor(
    private municipiosRepository: IMunicipiosRepository,
    private provinciasRepository: IProvinciasRepository
  ) {}

  /**
   * Valida si un municipio puede ser creado (que no exista ya en esa provincia)
   * @param nombre - Nombre del municipio a validar
   * @param provinciaId - ID de la provincia a la que pertenece
   * @throws MunicipioYaExisteError si el municipio ya existe en esa provincia
   * @throws Error si la provincia no existe
   */
  async validarCreacion(nombre: string, provinciaId: number): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del municipio es requerido');
    }

    if (!provinciaId || provinciaId <= 0) {
      throw new Error('El ID de la provincia es requerido y debe ser válido');
    }

    // Validar que la provincia exista
    const provincia = await this.provinciasRepository.buscarPorId(provinciaId);
    if (!provincia) {
      throw new Error(`La provincia con ID ${provinciaId} no existe`);
    }

    // Validar que el municipio no exista en esa provincia
    const municipiosEnProvincia = await this.municipiosRepository.listarPorProvincia(provinciaId);
    const municipioExistente = municipiosEnProvincia.some(
      m => m.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );

    if (municipioExistente) {
      throw new MunicipioYaExisteError(nombre, provinciaId);
    }
  }
}
