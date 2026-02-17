import { injectable } from 'tsyringe';
import { FechasFormacionInvalidasError } from '../../errors/FormacionesAcademicas/FechasFormacionInvalidasError';

@injectable()
export class FormacionAcademicaValidator {
    /**
     * Valida que todos los campos requeridos estén presentes
     */
    validarCamposRequeridos(
        doctorId: number,
        universidadId: number,
        especialidadId: number,
        fechaInicio: Date
    ): void {
        if (!doctorId || doctorId <= 0) {
            throw new Error('El ID del doctor es requerido y debe ser válido');
        }

        if (!universidadId || universidadId <= 0) {
            throw new Error('El ID de la universidad es requerido y debe ser válido');
        }

        if (!especialidadId || especialidadId <= 0) {
            throw new Error('El ID de la especialidad es requerido y debe ser válido');
        }

        if (!fechaInicio || !(fechaInicio instanceof Date) || isNaN(fechaInicio.getTime())) {
            throw new Error('La fecha de inicio es requerida y debe ser válida');
        }
    }

    /**
     * Valida que las fechas sean coherentes
     */
    validarFechas(fechaInicio: Date, fechaFinalizacion?: Date): void {
        // Validar que la fecha de inicio no sea futura
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaInicio > hoy) {
            throw new FechasFormacionInvalidasError(
                'La fecha de inicio no puede ser futura'
            );
        }

        // Si hay fecha de finalización, validar que sea posterior a la de inicio
        if (fechaFinalizacion) {
            if (!(fechaFinalizacion instanceof Date) || isNaN(fechaFinalizacion.getTime())) {
                throw new FechasFormacionInvalidasError('La fecha de finalización debe ser válida');
            }

            if (fechaFinalizacion <= fechaInicio) {
                throw new FechasFormacionInvalidasError(
                    'La fecha de finalización debe ser posterior a la fecha de inicio'
                );
            }

            // Validar que la fecha de finalización no sea muy futura (máximo 1 año en el futuro)
            const maxFechaFutura = new Date();
            maxFechaFutura.setFullYear(maxFechaFutura.getFullYear() + 1);

            if (fechaFinalizacion > maxFechaFutura) {
                throw new FechasFormacionInvalidasError(
                    'La fecha de finalización no puede ser más de un año en el futuro'
                );
            }
        }
    }

    /**
     * Valida que el estado sea válido
     */
    validarEstadoValido(estado: string): void {
        const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
        if (!estadosValidos.includes(estado)) {
            throw new Error(
                `Estado inválido. Los estados válidos son: ${estadosValidos.join(', ')}`
            );
        }
    }
}
