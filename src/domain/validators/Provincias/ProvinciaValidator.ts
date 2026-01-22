import { IProvinciasRepository } from '../../repositories/IProvinciasRepository';
import { ProvinciaYaExisteError } from '../../errors/Provincias/ProvinciaYaExisteError';

export class ProvinciaValidator {
  constructor(private provinciasRepository: IProvinciasRepository) {}

  /**
   * Valida si una provincia puede ser creada (que no exista ya)
   * @param nombre - Nombre de la provincia a validar
   * @throws ProvinciaYaExisteError si la provincia ya existe
   */
  async validarCreacion(nombre: string): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre de la provincia es requerido');
    }

    const todasLasProvincias = await this.provinciasRepository.listarTodas();
    const provinciaExistente = todasLasProvincias.some(
      p => p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );

    if (provinciaExistente) {
      throw new ProvinciaYaExisteError(nombre);
    }
  }
}
