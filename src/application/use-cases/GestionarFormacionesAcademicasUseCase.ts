import { injectable, inject } from 'tsyringe';
import { IFormacionAcademicaRepository } from '../../domain/repositories/IFormacionAcademicaRepository';
import { FormacionAcademicaValidator } from '../../domain/validators/FormacionesAcademicas/FormacionAcademicaValidator';
import { FormacionAcademica } from '../../domain/entities/FormacionAcademica';
import {
    CrearFormacionAcademicaDto,
    ActualizarFormacionAcademicaDto,
    FiltroFormacionesAcademicasDto,
} from '../dtos/FormacionAcademicaDtos';
import { FormacionAcademicaNoEncontradaError } from '../../domain/errors/FormacionesAcademicas/FormacionAcademicaNoEncontradaError';
import { UniversidadNoEncontradaError } from '../../domain/errors/FormacionesAcademicas/UniversidadNoEncontradaError';
import { FormacionDuplicadaError } from '../../domain/errors/FormacionesAcademicas/FormacionDuplicadaError';

@injectable()
export class GestionarFormacionesAcademicasUseCase {
    constructor(
        @inject('IFormacionAcademicaRepository')
        private formacionAcademicaRepository: IFormacionAcademicaRepository,
        @inject('FormacionAcademicaValidator')
        private formacionAcademicaValidator: FormacionAcademicaValidator
    ) { }

    async crear(dto: CrearFormacionAcademicaDto): Promise<FormacionAcademica> {
        // Validar que doctorId esté presente (viene del JWT en el controller)
        if (!dto.doctorId) {
            throw new Error('El ID del doctor es requerido');
        }

        // Validar que nombre esté presente
        if (!dto.nombre || dto.nombre.trim() === '') {
            throw new Error('El nombre de la formación es requerido');
        }

        // Convertir fechas de string a Date
        const fechaInicio = new Date(dto.fechaInicio);
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;
        const enCurso = dto.enCurso ?? false;

        // Validar campos requeridos
        this.formacionAcademicaValidator.validarCamposRequeridos(
            dto.doctorId,
            dto.universidadId,
            fechaInicio
        );

        // Validar que el doctor existe
        const doctorExiste = await this.formacionAcademicaRepository.verificarDoctorExiste(
            dto.doctorId
        );
        if (!doctorExiste) {
            throw new Error(`No se encontró el doctor con ID: ${dto.doctorId}`);
        }

        // Validar que la universidad existe
        const universidadExiste = await this.formacionAcademicaRepository.verificarUniversidadExiste(
            dto.universidadId
        );
        if (!universidadExiste) {
            throw new UniversidadNoEncontradaError(dto.universidadId);
        }

        // Validar fechas
        // Si enCurso es true, no requiere fechaFinalizacion
        if (enCurso && fechaFinalizacion) {
            throw new Error('Si la formación está en curso, no puede tener fecha de finalización');
        }

        if (!enCurso && !fechaFinalizacion) {
            throw new Error('Si la formación no está en curso, debe proporcionar la fecha de finalización');
        }

        this.formacionAcademicaValidator.validarFechas(fechaInicio, fechaFinalizacion);

        // Validar que no exista una formación duplicada
        const esDuplicada = await this.formacionAcademicaRepository.verificarFormacionDuplicada(
            dto.doctorId,
            dto.universidadId,
            dto.nombre
        );
        if (esDuplicada) {
            throw new FormacionDuplicadaError();
        }

        // Normalizar estado
        const estado = dto.estado
            ? dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase()
            : 'Activo';

        // Validar estado
        this.formacionAcademicaValidator.validarEstadoValido(estado);

        // Crear formación académica
        return await this.formacionAcademicaRepository.crear(
            dto.doctorId,
            dto.universidadId,
            dto.nombre,
            fechaInicio,
            estado,
            enCurso,
            fechaFinalizacion
        );
    }

    async obtenerPorId(id: number): Promise<FormacionAcademica> {
        const formacion = await this.formacionAcademicaRepository.obtenerPorId(id);

        if (!formacion) {
            throw new FormacionAcademicaNoEncontradaError(id);
        }

        return formacion;
    }

    async obtenerTodos(
        filtro: FiltroFormacionesAcademicasDto
    ): Promise<{ formaciones: FormacionAcademica[]; total: number }> {
        const pagina = filtro.pagina && filtro.pagina > 0 ? filtro.pagina : 1;
        const limite = filtro.limite && filtro.limite > 0 ? filtro.limite : 10;

        // Normalizar estado si se proporciona
        let estadoNormalizado: string | undefined;
        if (filtro.estado) {
            estadoNormalizado =
                filtro.estado.charAt(0).toUpperCase() + filtro.estado.slice(1).toLowerCase();
            this.formacionAcademicaValidator.validarEstadoValido(estadoNormalizado);
        }

        return await this.formacionAcademicaRepository.obtenerTodos(
            filtro.doctorId,
            estadoNormalizado,
            filtro.busqueda,
            pagina,
            limite
        );
    }

    async obtenerPorDoctor(
        doctorId: number,
        pagina?: number,
        limite?: number
    ): Promise<{ formaciones: FormacionAcademica[]; total: number }> {
        // Validar que el doctor existe
        const doctorExiste = await this.formacionAcademicaRepository.verificarDoctorExiste(
            doctorId
        );
        if (!doctorExiste) {
            throw new Error(`No se encontró el doctor con ID: ${doctorId}`);
        }

        const paginaFinal = pagina && pagina > 0 ? pagina : 1;
        const limiteFinal = limite && limite > 0 ? limite : 20;

        return await this.formacionAcademicaRepository.obtenerPorDoctor(
            doctorId,
            paginaFinal,
            limiteFinal
        );
    }

    async actualizar(
        id: number,
        dto: ActualizarFormacionAcademicaDto
    ): Promise<FormacionAcademica> {
        // Verificar que la formación académica existe
        const formacionExistente = await this.formacionAcademicaRepository.obtenerPorId(id);
        if (!formacionExistente) {
            throw new FormacionAcademicaNoEncontradaError(id);
        }

        // Convertir fechas si se proporcionan
        const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : undefined;
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;
        const enCurso = dto.enCurso !== undefined ? dto.enCurso : formacionExistente.enCurso;

        // Validar universidad si se proporciona
        if (dto.universidadId !== undefined) {
            if (dto.universidadId <= 0) {
                throw new Error('El ID de la universidad debe ser válido');
            }

            const universidadExiste = await this.formacionAcademicaRepository.verificarUniversidadExiste(
                dto.universidadId
            );
            if (!universidadExiste) {
                throw new UniversidadNoEncontradaError(dto.universidadId);
            }
        }

        // Validar que nombre no esté vacío si se proporciona
        if (dto.nombre !== undefined && (!dto.nombre || dto.nombre.trim() === '')) {
            throw new Error('El nombre de la formación no puede estar vacío');
        }

        // Validar fechas si se están actualizando
        // Si enCurso es true, no requiere fechaFinalizacion
        if (enCurso && (fechaFinalizacion !== undefined || formacionExistente.fechaFinalizacion)) {
            throw new Error('Si la formación está en curso, no puede tener fecha de finalización');
        }

        if (!enCurso && fechaFinalizacion === undefined && !formacionExistente.fechaFinalizacion) {
            // Verifica si se updated fechaInicio o se mantiene la actual
            const fechaInicioFinal = fechaInicio ?? formacionExistente.fechaInicio;
            throw new Error('Si la formación no está en curso, debe proporcionar la fecha de finalización');
        }

        if (fechaInicio !== undefined || fechaFinalizacion !== undefined) {
            const fechaInicioFinal = fechaInicio ?? formacionExistente.fechaInicio;
            const fechaFinalizacionFinal = fechaFinalizacion ?? formacionExistente.fechaFinalizacion;

            this.formacionAcademicaValidator.validarFechas(
                fechaInicioFinal,
                fechaFinalizacionFinal
            );
        }

        // Validar que no se cree una formación duplicada con la actualización
        const universidadIdFinal = dto.universidadId ?? formacionExistente.universidadId;
        const nombreFinal = dto.nombre ?? formacionExistente.nombre;

        const esDuplicada = await this.formacionAcademicaRepository.verificarFormacionDuplicada(
            formacionExistente.doctorId,
            universidadIdFinal,
            nombreFinal,
            id // Excluir el registro actual de la validación
        );
        if (esDuplicada) {
            throw new FormacionDuplicadaError();
        }

        // Normalizar estado si se proporciona
        let estadoNormalizado: string | undefined;
        if (dto.estado !== undefined) {
            estadoNormalizado = dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase();
            this.formacionAcademicaValidator.validarEstadoValido(estadoNormalizado);
        }

        return await this.formacionAcademicaRepository.actualizar(
            id,
            dto.universidadId,
            dto.nombre,
            fechaInicio,
            fechaFinalizacion,
            enCurso,
            estadoNormalizado
        );
    }

    async eliminar(id: number): Promise<void> {
        // Verificar que la formación académica existe
        const formacionExistente = await this.formacionAcademicaRepository.obtenerPorId(id);
        if (!formacionExistente) {
            throw new FormacionAcademicaNoEncontradaError(id);
        }

        await this.formacionAcademicaRepository.eliminar(id);
    }
}
