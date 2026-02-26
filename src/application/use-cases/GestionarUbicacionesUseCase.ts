/**
 * GestionarUbicacionesUseCase.ts — sin subBarrioId tras eliminar sub_barrios
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
  ) { }

  async crear(dto: CrearUbicacionDto): Promise<Ubicacion> {
    await this.validator.validarCreacion(dto.barrioId, dto.direccion);

    if (dto.codigoPostal) {
      this.validator.validarCodigoPostal(dto.codigoPostal);
    }

    if (dto.puntoGeografico) {
      this.validator.validarPuntoGeografico(dto.puntoGeografico);
    }

    return await this.repository.crear(
      dto.barrioId,
      dto.direccion,
      dto.codigoPostal,
      dto.puntoGeografico,
      dto.nombre
    );
  }

  async listarTodas(): Promise<Ubicacion[]> {
    return await this.repository.listarTodas();
  }

  async listarPorBarrio(barrioId: number): Promise<Ubicacion[]> {
    return await this.repository.listarPorBarrio(barrioId);
  }

  async buscarPorId(id: number): Promise<Ubicacion | null> {
    return await this.repository.buscarPorId(id);
  }

  async buscarPorDireccion(direccion: string): Promise<Ubicacion[]> {
    return await this.repository.buscarPorDireccion(direccion);
  }

  async buscarPorCodigoPostal(codigoPostal: string): Promise<Ubicacion[]> {
    return await this.repository.buscarPorCodigoPostal(codigoPostal);
  }

  async buscarPorEstado(estado: string): Promise<Ubicacion[]> {
    return await this.repository.buscarPorEstado(estado);
  }

  async actualizar(dto: ActualizarUbicacionDto): Promise<Ubicacion> {
    const ubicacionExistente = await this.repository.buscarPorId(dto.id);
    if (!ubicacionExistente) {
      throw new Error(`Ubicacion con ID ${dto.id} no existe`);
    }

    if (dto.barrioId !== undefined) {
      await this.validator.validarActualizacionUbicacion(dto.barrioId, undefined, dto.id);
    }

    if (dto.codigoPostal !== undefined) {
      this.validator.validarCodigoPostal(dto.codigoPostal);
    }

    if (dto.puntoGeografico !== undefined) {
      this.validator.validarPuntoGeografico(dto.puntoGeografico);
    }

    return await this.repository.actualizar(
      dto.id,
      dto.barrioId,
      dto.direccion,
      dto.codigoPostal,
      dto.estado,
      dto.puntoGeografico,
      dto.nombre
    );
  }

  async eliminar(id: number): Promise<Ubicacion> {
    return await this.repository.eliminar(id);
  }

  async listarPorDoctor(doctorId: number): Promise<Ubicacion[]> {
    return await this.repository.listarPorDoctor(doctorId);
  }

  async crearParaDoctor(doctorId: number, dto: CrearUbicacionDto): Promise<Ubicacion> {
    await this.validator.validarCreacion(dto.barrioId, dto.direccion);

    if (dto.codigoPostal) {
      this.validator.validarCodigoPostal(dto.codigoPostal);
    }

    if (dto.puntoGeografico) {
      this.validator.validarPuntoGeografico(dto.puntoGeografico);
    }

    return await this.repository.crearParaDoctor(
      doctorId,
      dto.barrioId,
      dto.direccion,
      dto.codigoPostal,
      dto.puntoGeografico,
      dto.nombre
    );
  }
}

