import { injectable, inject } from 'tsyringe';
import { IExperienciaLaboralRepository } from '../../domain/repositories/IExperienciaLaboralRepository';
import { ExperienciaLaboralValidator } from '../../domain/validators/ExperienciasLaborales/ExperienciaLaboralValidator';
import { ExperienciaLaboral } from '../../domain/entities/ExperienciaLaboral';
import {
  CrearExperienciaLaboralDto,
  ActualizarExperienciaLaboralDto,
  FiltroExperienciasLaboralesDto,
} from '../dtos/ExperienciaLaboralDtos';
import { ExperienciaLaboralNoEncontradaError } from '../../domain/errors/ExperienciasLaborales/ExperienciaLaboralNoEncontradaError';

@injectable()
export class GestionarExperienciasLaboralesUseCase {
  constructor(
    @inject('IExperienciaLaboralRepository')
    private experienciaLaboralRepository: IExperienciaLaboralRepository,
    @inject(ExperienciaLaboralValidator)
    private validator: ExperienciaLaboralValidator
  ) { }

  async crear(dto: CrearExperienciaLaboralDto): Promise<ExperienciaLaboral> {
    // Validar que doctorId esté presente (viene del JWT en el controller)
    if (!dto.doctorId) {
      throw new Error('El ID del doctor es requerido');
    }

    // Convertir fechas de string a Date
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;

    // Validar campos requeridos
    this.validator.validarCamposRequeridos(
      dto.doctorId,
      dto.institucion,
      dto.posicion,
      fechaInicio
    );

    // Validar institución
    this.validator.validarInstitucion(dto.institucion);

    // Validar posición
    this.validator.validarPosicion(dto.posicion);

    // Validar fechas
    this.validator.validarFechas(
      fechaInicio,
      fechaFinalizacion,
      dto.trabajaActualmente
    );

    // Verificar que el doctor existe
    const doctorExiste = await this.experienciaLaboralRepository.verificarDoctorExiste(dto.doctorId);
    if (!doctorExiste) {
      throw new Error(`No se encontró el doctor con ID: ${dto.doctorId}`);
    }

    // Crear la entidad
    const experiencia = new ExperienciaLaboral(
      0, // El ID se asigna en la base de datos
      dto.doctorId,
      dto.institucion,
      dto.posicion,
      fechaInicio,
      dto.estado || 'Activo',
      new Date(),
      fechaFinalizacion,
      dto.trabajaActualmente || false
    );

    return await this.experienciaLaboralRepository.crear(experiencia);
  }

  async obtenerPorId(id: number): Promise<ExperienciaLaboral> {
    const experiencia = await this.experienciaLaboralRepository.obtenerPorId(id);

    if (!experiencia) {
      throw new ExperienciaLaboralNoEncontradaError(id);
    }

    return experiencia;
  }

  async obtenerTodos(filtro: FiltroExperienciasLaboralesDto): Promise<{
    experiencias: ExperienciaLaboral[];
    total: number;
  }> {
    return await this.experienciaLaboralRepository.obtenerTodos(
      filtro.doctorId,
      filtro.estado,
      filtro.busqueda,
      filtro.pagina,
      filtro.limite
    );
  }

  async actualizar(id: number, dto: ActualizarExperienciaLaboralDto): Promise<ExperienciaLaboral> {
    // Verificar que la experiencia existe
    const experienciaExistente = await this.experienciaLaboralRepository.obtenerPorId(id);
    if (!experienciaExistente) {
      throw new ExperienciaLaboralNoEncontradaError(id);
    }

    // Validar fechas si se están actualizando
    if (dto.fechaInicio || dto.fechaFinalizacion || dto.trabajaActualmente !== undefined) {
      const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : experienciaExistente.fechaInicio;
      const fechaFinalizacion = dto.fechaFinalizacion
        ? new Date(dto.fechaFinalizacion)
        : experienciaExistente.fechaFinalizacion;
      const trabajaActualmente = dto.trabajaActualmente !== undefined
        ? dto.trabajaActualmente
        : experienciaExistente.trabajaActualmente;

      this.validator.validarFechas(fechaInicio, fechaFinalizacion, trabajaActualmente);
    }

    // Validar institución si se está actualizando
    if (dto.institucion) {
      this.validator.validarInstitucion(dto.institucion);
    }

    // Validar posición si se está actualizando
    if (dto.posicion) {
      this.validator.validarPosicion(dto.posicion);
    }

    // Validar estado si se está actualizando
    if (dto.estado) {
      this.validator.validarEstadoValido(dto.estado);
    }

    // Preparar datos para actualizar
    const datosActualizacion: Partial<ExperienciaLaboral> = {
      ...dto,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
      fechaFinalizacion: dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined,
      actualizadoEn: new Date(),
    };

    return await this.experienciaLaboralRepository.actualizar(id, datosActualizacion);
  }

  async eliminar(id: number): Promise<void> {
    // Verificar que la experiencia existe
    const experiencia = await this.experienciaLaboralRepository.obtenerPorId(id);
    if (!experiencia) {
      throw new ExperienciaLaboralNoEncontradaError(id);
    }

    await this.experienciaLaboralRepository.eliminar(id);
  }
}
