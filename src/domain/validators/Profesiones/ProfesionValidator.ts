import { injectable, inject } from 'tsyringe';
import { IProfesionesRepository } from '../../repositories/IProfesionesRepository';
import { ProfesionYaExisteError } from '../../errors/Profesiones/ProfesionYaExisteError';

@injectable()
export class ProfesionValidator {
  constructor(
    @inject('IProfesionesRepository')
    private profesionesRepository: IProfesionesRepository
  ) {}

  async validarNombreUnico(nombre: string, excluyendoId?: number): Promise<void> {
    const existe = await this.profesionesRepository.existePorNombre(nombre, excluyendoId);
    if (existe) {
      throw new ProfesionYaExisteError(nombre);
    }
  }

  validarNombreRequerido(nombre?: string): void {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la profesión es requerido');
    }
  }

  validarEstadoValido(estado: string): void {
    const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }
  }
}
