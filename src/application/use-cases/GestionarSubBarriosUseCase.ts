/**
 * GestionarSubBarriosUseCase.ts
 * Casos de uso para operaciones con SubBarrios
 * Orquesta la lógica de negocio y coordina entre validadores y repositorio
 */

import { injectable, inject } from 'tsyringe';
import { ISubBarriosRepository } from '../../domain/repositories/ISubBarriosRepository';
import { SubBarrioValidator } from '../../domain/validators/SubBarrios/SubBarrioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { CrearSubBarrioDto, ActualizarSubBarrioDto } from '../dtos/SubBarrioDtos';

@injectable()
export class GestionarSubBarriosUseCase {
  constructor(
    @inject('ISubBarriosRepository') private subBarrioRepo: ISubBarriosRepository,
    @inject(SubBarrioValidator) private validator: SubBarrioValidator,
    @inject(EstadoValidator) private estadoValidator: EstadoValidator
  ) {}

  /**
   * Lista todos los SubBarrios
   */
  async listar() {
    return await this.subBarrioRepo.listarTodos();
  }

  /**
   * Crea un nuevo SubBarrio
   * @param dto - Contiene barrioId y nombre
   */
  async crear(dto: CrearSubBarrioDto) {
    // Validar que el nombre no esté vacío y que no exista otro SubBarrio con el mismo nombre en el barrio
    await this.validator.validarCreacion(dto.nombre, dto.barrioId);

    return await this.subBarrioRepo.crear(dto.barrioId, dto.nombre);
  }

  /**
   * Obtiene un SubBarrio por ID
   * @param id - ID del SubBarrio
   */
  async buscarPorId(id: number) {
    return await this.subBarrioRepo.buscarPorId(id);
  }

  /**
   * Lista todos los SubBarrios de un barrio específico
   * @param barrioId - ID del barrio
   */
  async listarPorBarrio(barrioId: number) {
    return await this.subBarrioRepo.listarPorBarrio(barrioId);
  }

  /**
   * Busca SubBarrios por nombre
   * @param nombre - Nombre del SubBarrio a buscar
   */
  async buscarPorNombre(nombre: string) {
    return await this.subBarrioRepo.buscarPorNombre(nombre);
  }

  /**
   * Busca SubBarrios por estado
   * @param estado - Estado del SubBarrio (Activo, Inactivo, Eliminado)
   */
  async buscarPorEstado(estado: string) {
    return await this.subBarrioRepo.buscarPorEstado(estado);
  }

  /**
   * Actualiza un SubBarrio existente
   * @param dto - Contiene id y los campos a actualizar
   */
  async actualizar(dto: ActualizarSubBarrioDto) {
    // Validar nombre y barrio solo si se proporcionan
    if (dto.nombre && dto.barrioId) {
      await this.validator.validarCreacion(dto.nombre, dto.barrioId);
    }

    // Validar cambio de barrio solo si se proporciona
    if (dto.barrioId) {
      await this.validator.validarActualizacionBarrio(dto.barrioId, dto.id);
    }

    // Validar estado solo si se proporciona
    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.subBarrioRepo.actualizar(dto.id, dto.barrioId, dto.nombre, dto.estado);
  }

  /**
   * Elimina un SubBarrio (eliminación lógica)
   * @param id - ID del SubBarrio a eliminar
   */
  async eliminar(id: number) {
    return await this.subBarrioRepo.eliminar(id);
  }
}
