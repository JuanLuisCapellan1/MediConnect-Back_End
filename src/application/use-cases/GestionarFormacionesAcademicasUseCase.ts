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

        // Convertir fechas de string a Date
        const fechaInicio = new Date(dto.fechaInicio);
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;

        // Validar campos requeridos
        this.formacionAcademicaValidator.validarCamposRequeridos(
            dto.doctorId,
            dto.universidadId,
            dto.especialidadId,
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

        // Validar que la especialidad existe
        const especialidadExiste = await this.formacionAcademicaRepository.verificarEspecialidadExiste(
            dto.especialidadId
        );
        if (!especialidadExiste) {
            throw new Error(`No se encontró la especialidad con ID: ${dto.especialidadId}`);
        }

        // Validar fechas
        this.formacionAcademicaValidator.validarFechas(fechaInicio, fechaFinalizacion);

        // Validar que no exista una formación duplicada
        const esDuplicada = await this.formacionAcademicaRepository.verificarFormacionDuplicada(
            dto.doctorId,
            dto.universidadId,
            dto.especialidadId
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
            dto.especialidadId,
            fechaInicio,
            estado,
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
            undefined, // universidadId - no se usa en filtros públicos
            undefined, // especialidadId - no se usa en filtros públicos
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

        // Validar especialidad si se proporciona
        if (dto.especialidadId !== undefined) {
            if (dto.especialidadId <= 0) {
                throw new Error('El ID de la especialidad debe ser válido');
            }

            const especialidadExiste = await this.formacionAcademicaRepository.verificarEspecialidadExiste(
                dto.especialidadId
            );
            if (!especialidadExiste) {
                throw new Error(`No se encontró la especialidad con ID: ${dto.especialidadId}`);
            }
        }

        // Validar que no se cree una formación duplicada con la actualización
        const universidadIdFinal = dto.universidadId ?? formacionExistente.universidadId;
        const especialidadIdFinal = dto.especialidadId ?? formacionExistente.especialidadId;

        const esDuplicada = await this.formacionAcademicaRepository.verificarFormacionDuplicada(
            formacionExistente.doctorId,
            universidadIdFinal,
            especialidadIdFinal,
            id // Excluir el registro actual de la validación
        );
        if (esDuplicada) {
            throw new FormacionDuplicadaError();
        }

        // Validar fechas si se están actualizando
        if (fechaInicio !== undefined || fechaFinalizacion !== undefined) {
            const fechaInicioFinal = fechaInicio ?? formacionExistente.fechaInicio;
            const fechaFinalizacionFinal = fechaFinalizacion ?? formacionExistente.fechaFinalizacion;

            this.formacionAcademicaValidator.validarFechas(
                fechaInicioFinal,
                fechaFinalizacionFinal
            );
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
            dto.especialidadId,
            fechaInicio,
            fechaFinalizacion,
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
