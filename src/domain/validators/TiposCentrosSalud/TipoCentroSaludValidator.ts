import { ITipoCentroSaludRepository } from '../../repositories/ITipoCentroSaludRepository';
import { TipoCentroSaludYaExisteError } from '../../errors/TiposCentrosSalud/TipoCentroSaludYaExisteError';

export class TipoCentroSaludValidator {
  constructor(private tipoCentroSaludRepository: ITipoCentroSaludRepository) {}

  async validarCreacion(nombre: string): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del tipo de centro de salud es requerido');
    }

    const existe = await this.tipoCentroSaludRepository.existeNombre(nombre);
    if (existe) {
      throw new TipoCentroSaludYaExisteError(nombre);
    }
  }

  async validarActualizacion(id: number, nombre?: string): Promise<void> {
    if (nombre) {
      if (nombre.trim().length === 0) {
        throw new Error('El nombre del tipo de centro de salud no puede estar vacío');
      }

      const existe = await this.tipoCentroSaludRepository.existeNombre(nombre, id);
      if (existe) {
        throw new TipoCentroSaludYaExisteError(nombre);
      }
    }
  }
}
