import { IBarriosRepository } from '../../domain/repositories/IBarriosRepository';
import { CrearBarrioDto, ActualizarBarrioDto } from '../dtos/BarrioDtos';
import { inject } from 'tsyringe';
import { BarrioValidator } from '../../domain/validators/Barrios/BarrioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

export class GestionarBarriosUseCase {
  constructor(
    private barrioRepo: IBarriosRepository,
    @inject(BarrioValidator) private validator: BarrioValidator,
    @inject(EstadoValidator) private estadoValidator: EstadoValidator
  ) {}

  /**
   * Lista todos los barrios activos
   */
  async listar() {
    return await this.barrioRepo.listarTodas();
  }

  /**
   * Crea un nuevo barrio
   * @param dto - Contiene seccionId y nombre
   */
  async crear(dto: CrearBarrioDto) {
    await this.validator.validarCreacion(dto.nombre, dto.seccionId);
    return await this.barrioRepo.crear(dto.seccionId, dto.nombre);
  }

  /**
   * Busca un barrio por su ID
   * @param id - ID del barrio
   */
  async buscarPorId(id: number) {
    return await this.barrioRepo.buscarPorId(id);
  }

  /**
   * Lista todos los barrios de una sección específica
   * @param seccionId - ID de la sección
   */
  async listarPorSeccion(seccionId: number) {
    return await this.barrioRepo.listarPorSeccion(seccionId);
  }

  /**
   * Busca barrios por nombre en una sección específica
   * @param nombre - Nombre del barrio (búsqueda parcial)
   * @param seccionId - ID de la sección
   * @param estado - Estado del barrio (Activo, Inactivo, Eliminado)
   */
  async buscarPorNombre(nombre: string, seccionId: number, estado: string) {
    return await this.barrioRepo.buscarPorNombre(nombre, seccionId, estado);
  }

  /**
   * Busca barrios por estado
   * @param estado - Estado del barrio (Activo, Inactivo, Eliminado)
   */
  async buscarPorEstado(estado: string) {
    return await this.barrioRepo.buscarPorEstado(estado);
  }

  /**
   * Actualiza un barrio existente
   * @param dto - Contiene id y los campos a actualizar
   */
  async actualizar(dto: ActualizarBarrioDto) {
    // Validar nombre solo si se proporciona
    if (dto.nombre && dto.seccionId) {
      await this.validator.validarCreacion(dto.nombre, dto.seccionId);
    }

    // Validar cambio de sección solo si se proporciona
    if (dto.seccionId) {
      await this.validator.validarActualizacionSeccion(dto.seccionId, dto.id);
    }

    // Validar estado solo si se proporciona
    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.barrioRepo.actualizar(dto.id, dto.seccionId, dto.nombre, dto.estado);
  }

  /**
   * Elimina un barrio (eliminación lógica)
   * @param id - ID del barrio a eliminar
   */
  async eliminar(id: number) {
    return await this.barrioRepo.eliminar(id);
  }
}
