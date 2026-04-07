import { injectable, inject } from 'tsyringe';
import { IExperienciaLaboralRepository } from '../../repositories/IExperienciaLaboralRepository';
import { FechasInvalidasError } from '../../errors/ExperienciasLaborales/FechasInvalidasError';

@injectable()
export class ExperienciaLaboralValidator {
  constructor(
    @inject('IExperienciaLaboralRepository')
    private experienciaLaboralRepository: IExperienciaLaboralRepository
  ) { }

  validarCamposRequeridos(
    doctorId?: number,
    institucion?: string,
    posicion?: string,
    fechaInicio?: Date
  ): void {
    if (!doctorId || doctorId <= 0) {
      throw new Error('El ID del doctor es requerido y debe ser válido');
    }

    if (!institucion || institucion.trim() === '') {
      throw new Error('La institución es requerida');
    }

    if (!posicion || posicion.trim() === '') {
      throw new Error('La posición es requerida');
    }

    if (!fechaInicio) {
      throw new Error('La fecha de inicio es requerida');
    }
  }

  validarInstitucion(institucion: string): void {
    if (institucion.trim().length < 2) {
      throw new Error('El nombre de la institución debe tener al menos 2 caracteres');
    }

    if (institucion.length > 150) {
      throw new Error('El nombre de la institución no puede exceder 150 caracteres');
    }
  }

  validarPosicion(posicion: string): void {
    if (posicion.trim().length < 2) {
      throw new Error('La posición debe tener al menos 2 caracteres');
    }

    if (posicion.length > 100) {
      throw new Error('La posición no puede exceder 100 caracteres');
    }
  }

  validarFechas(
    fechaInicio: Date,
    fechaFinalizacion?: Date,
    trabajaActualmente?: boolean
  ): void {
    const ahora = new Date();

    // Validar que la fecha de inicio no sea futura
    if (fechaInicio > ahora) {
      throw new FechasInvalidasError('La fecha de inicio no puede ser futura');
    }

    // Si trabaja actualmente, no debe haber fecha de finalización
    if (trabajaActualmente && fechaFinalizacion) {
      throw new FechasInvalidasError(
        'Si el doctor trabaja actualmente en este puesto, no debe especificar fecha de finalización'
      );
    }

    // Si no trabaja actualmente, debe haber fecha de finalización
    if (!trabajaActualmente && !fechaFinalizacion) {
      throw new FechasInvalidasError(
        'Si el doctor no trabaja actualmente en este puesto, debe especificar fecha de finalización'
      );
    }

    // Si hay fecha de finalización, validar que sea posterior a la fecha de inicio
    if (fechaFinalizacion) {
      if (fechaFinalizacion <= fechaInicio) {
        throw new FechasInvalidasError(
          'La fecha de finalización debe ser posterior a la fecha de inicio'
        );
      }

      // Validar que la fecha de finalización no sea futura
      if (fechaFinalizacion > ahora) {
        throw new FechasInvalidasError('La fecha de finalización no puede ser futura');
      }
    }
  }

  validarEstadoValido(estado: string): void {
    const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }
  }
}
