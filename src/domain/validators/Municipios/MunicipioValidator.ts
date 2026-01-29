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

  /**
   * Valida si un municipio puede cambiar de provincia
   * @param provinciaId - ID de la nueva provincia
   * @param municipioId - ID del municipio a actualizar
   * @throws Error si el municipio o la provincia no existen
   * @throws MunicipioYaExisteError si existe otro municipio con el mismo nombre en la nueva provincia
   */
  async validarActualizacionProvincia(provinciaId: number, municipioId: number): Promise<void> {
    // Validar que el ID del municipio sea válido
    if (!municipioId || municipioId <= 0) {
      throw new Error('El ID del municipio es requerido y debe ser válido');
    }
  
    // Verificar que el municipio exista
    const municipio = await this.municipiosRepository.buscarPorId(municipioId);
    if (!municipio) {
      throw new Error(`El municipio con ID ${municipioId} no existe`);
    }

    // Validar que el ID de la provincia sea válido
    if (!provinciaId || provinciaId <= 0) {
      throw new Error('El ID de la provincia es requerido y debe ser válido');
    }
    // Validar que la provincia exista
    const provincia = await this.provinciasRepository.buscarPorId(provinciaId);
    if (!provincia) {
      throw new Error(`La provincia con ID ${provinciaId} no existe`);
    }
    // Verificar que no exista otro municipio con el mismo nombre en la nueva provincia
    const municipiosEnProvincia = await this.municipiosRepository.listarPorProvincia(provinciaId);
    const municipioExistente = municipiosEnProvincia.some(
      m => m.nombre.toLowerCase().trim() === municipio.nombre.toLowerCase().trim()
    );
    if (municipioExistente) {
      throw new MunicipioYaExisteError(municipio.nombre, provinciaId);
    }
  }
}