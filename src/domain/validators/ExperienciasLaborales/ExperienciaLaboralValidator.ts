import { injectable, inject } from 'tsyringe';
import { IExperienciasLaboralesRepository } from '../../repositories/IExperienciasLaboralesRepository';
import { FechasInvalidasError } from '../../errors/ExperienciasLaborales/FechasInvalidasError';
import { InstitucionRequeridaError } from '../../errors/ExperienciasLaborales/InstitucionRequeridaError';

@injectable()
export class ExperienciaLaboralValidator {
  constructor(
    @inject('IExperienciasLaboralesRepository')
    private experienciasLaboralesRepository: IExperienciasLaboralesRepository
  ) {}

  validarCamposRequeridos(
    doctorId?: number,
    profesionId?: number,
    descripcionCargo?: string,
    fechaInicio?: Date
  ): void {
    if (!doctorId || doctorId <= 0) {
      throw new Error('El ID del doctor es requerido y debe ser válido');
    }

    if (!profesionId || profesionId <= 0) {
      throw new Error('El ID de la profesión es requerido y debe ser válido');
    }

    if (!descripcionCargo || descripcionCargo.trim() === '') {
      throw new Error('La descripción del cargo es requerida');
    }

    if (!fechaInicio) {
      throw new Error('La fecha de inicio es requerida');
    }
  }

  validarInstitucion(centroSaludId?: number, institucionExterna?: string): void {
    // Al menos uno debe estar presente
    if (!centroSaludId && (!institucionExterna || institucionExterna.trim() === '')) {
      throw new InstitucionRequeridaError();
    }

    // No pueden estar ambos presentes
    if (centroSaludId && institucionExterna && institucionExterna.trim() !== '') {
      throw new Error('Solo puede especificar un centro de salud o una institución externa, no ambos');
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

  validarDescripcionCargo(descripcion: string): void {
    if (descripcion.length < 5) {
      throw new Error('La descripción del cargo debe tener al menos 5 caracteres');
    }

    if (descripcion.length > 200) {
      throw new Error('La descripción del cargo no puede exceder 200 caracteres');
    }
  }

  validarInstitucionExterna(institucion: string): void {
    if (institucion.length > 150) {
      throw new Error('El nombre de la institución externa no puede exceder 150 caracteres');
    }
  }
}
