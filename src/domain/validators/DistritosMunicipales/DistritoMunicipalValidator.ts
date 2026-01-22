import { IDistritosMunicipalesRepository } from '../../repositories/IDistritosMunicipalesRepository';
import { DistritoMunicipalYaExisteError } from '../../errors/DistritosMunicipales/DistritoMunicipalYaExisteError';
import { IMunicipiosRepository } from '../../repositories/IMunicipiosRepository';

export class DistritoMunicipalValidator {
  constructor(
    private distritosRepository: IDistritosMunicipalesRepository,
    private municipiosRepository: IMunicipiosRepository
  ) {}

  /**
   * Valida si un distrito municipal puede ser creado (que no exista ya en ese municipio)
   * @param nombre - Nombre del distrito a validar
   * @param municipioId - ID del municipio al que pertenece
   * @throws DistritoMunicipalYaExisteError si el distrito ya existe en ese municipio
   * @throws Error si el municipio no existe
   */
  async validarCreacion(nombre: string, municipioId: number): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del distrito municipal es requerido');
    }

    if (!municipioId || municipioId <= 0) {
      throw new Error('El ID del municipio es requerido y debe ser válido');
    }

    // Validar que el municipio exista
    const municipio = await this.municipiosRepository.buscarPorId(municipioId);
    if (!municipio) {
      throw new Error(`El municipio con ID ${municipioId} no existe`);
    }

    // Validar que el distrito no exista en ese municipio
    const distritosEnMunicipio = await this.distritosRepository.listarPorMunicipio(municipioId);
    const distritoExistente = distritosEnMunicipio.some(
      d => d.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );

    if (distritoExistente) {
      throw new DistritoMunicipalYaExisteError(nombre, municipioId);
    }
  }
}
