import { ITipoServicioRepository } from '../../repositories/ITipoServicioRepository';
import { TipoServicioYaExisteError } from '../../errors/TiposServicios/TipoServicioYaExisteError';

export class TipoServicioValidator {
  constructor(private tipoServicioRepository: ITipoServicioRepository) {}

  async validarCreacion(nombre: string): Promise<void> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre de tipo de servicio es requerido');
    }

    const existe = await this.tipoServicioRepository.existeNombre(nombre);
    if (existe) {
      throw new TipoServicioYaExisteError(nombre);
    }
  }

  async validarActualizacion(id: number, nombre?: string): Promise<void> {
    if (nombre) {
        if (nombre.trim().length === 0) {
            throw new Error('El nombre de tipo de servicio no puede estar vacío');
        }
        
        const existe = await this.tipoServicioRepository.existeNombre(nombre, id);
        if (existe) {
            throw new TipoServicioYaExisteError(nombre);
        }
    }
  }
}
