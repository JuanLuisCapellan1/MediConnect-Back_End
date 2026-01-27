/**
 * GestionarUbicacionesUseCase.ts
 * Casos de uso para la gestión de Ubicaciones
 */

import { injectable, inject } from 'tsyringe';
import { CrearUbicacionDto, ActualizarUbicacionDto } from '../../application/dtos/UbicacionDtos';
import { Ubicacion } from '../../domain/entities/Ubicacion';
import { UbicacionValidator } from '../../domain/validators/Ubicaciones/UbicacionValidator';
import { IUbicacionesRepository } from '../../domain/repositories/IUbicacionesRepository';

@injectable()
export class GestionarUbicacionesUseCase {
  constructor(
    @inject('UbicacionValidator') private validator: UbicacionValidator,
    @inject('IUbicacionesRepository') private repository: IUbicacionesRepository
  ) {}

  /**
   * Crea una nueva Ubicacion
   */
  async crear(dto: CrearUbicacionDto): Promise<Ubicacion> {
    await this.validator.validarCreacion(dto.barrioId, dto.direccion, dto.subBarrioId);

    if (dto.codigoPostal) {
      this.validator.validarCodigoPostal(dto.codigoPostal);
    }

    if (dto.puntoGeografico) {
      this.validator.validarPuntoGeografico(dto.puntoGeografico);
    }

    return await this.repository.crear(
      dto.barrioId,
      dto.direccion,
      dto.subBarrioId,
      dto.codigoPostal,
      dto.puntoGeografico
    );
  }

  /**
   * Lista todas las Ubicaciones
   */
  async listarTodas(): Promise<Ubicacion[]> {
    return await this.repository.listarTodas();
  }

  /**
   * Lista Ubicaciones por barrio
   */
  async listarPorBarrio(barrioId: number): Promise<Ubicacion[]> {
    return await this.repository.listarPorBarrio(barrioId);
  }

  /**
   * Lista Ubicaciones por SubBarrio
   */
  async listarPorSubBarrio(subBarrioId: number): Promise<Ubicacion[]> {
    return await this.repository.listarPorSubBarrio(subBarrioId);
  }

  /**
   * Busca una Ubicacion por ID
   */
  async buscarPorId(id: number): Promise<Ubicacion | null> {
    return await this.repository.buscarPorId(id);
  }

  /**
   * Busca Ubicaciones por dirección
   */
  async buscarPorDireccion(direccion: string): Promise<Ubicacion[]> {
    return await this.repository.buscarPorDireccion(direccion);
  }

  /**
   * Busca Ubicaciones por código postal
   */
  async buscarPorCodigoPostal(codigoPostal: string): Promise<Ubicacion[]> {
    return await this.repository.buscarPorCodigoPostal(codigoPostal);
  }

  /**
   * Busca Ubicaciones por estado
   */
  async buscarPorEstado(estado: string): Promise<Ubicacion[]> {
    return await this.repository.buscarPorEstado(estado);
  }

  /**
   * Actualiza una Ubicacion
   */
  async actualizar(dto: ActualizarUbicacionDto): Promise<Ubicacion> {
    // Validar que la ubicación exista
    const ubicacionExistente = await this.repository.buscarPorId(dto.id);
    if (!ubicacionExistente) {
      throw new Error(`Ubicacion con ID ${dto.id} no existe`);
    }

    // Validar cambios de barrio si es necesario
    if (dto.barrioId !== undefined || dto.subBarrioId !== undefined) {
      const barrioId = dto.barrioId !== undefined ? dto.barrioId : ubicacionExistente.barrioId;
      const subBarrioId = dto.subBarrioId !== undefined ? dto.subBarrioId : (ubicacionExistente.subBarrioId || undefined);

      await this.validator.validarActualizacionUbicacion(barrioId, subBarrioId, dto.id);
    }

    // Validar código postal si es proporcionado
    if (dto.codigoPostal !== undefined) {
      this.validator.validarCodigoPostal(dto.codigoPostal);
    }

    // Validar punto geográfico si es proporcionado
    if (dto.puntoGeografico !== undefined) {
      this.validator.validarPuntoGeografico(dto.puntoGeografico);
    }

    return await this.repository.actualizar(
      dto.id,
      dto.barrioId,
      dto.subBarrioId,
      dto.direccion,
      dto.codigoPostal,
      dto.estado,
      dto.puntoGeografico
    );
  }

  /**
   * Elimina una Ubicacion
   */
  async eliminar(id: number): Promise<Ubicacion> {
    return await this.repository.eliminar(id);
  }
}
