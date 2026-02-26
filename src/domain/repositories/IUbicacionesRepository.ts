/**
 * IUbicacionesRepository.ts
 * Interfaz del repositorio para Ubicaciones — sin subBarrioId tras eliminar sub_barrios
 */

import { Ubicacion } from '../entities/Ubicacion';

export interface IUbicacionesRepository {
  crear(
    barrioId: number,
    direccion: string,
    codigoPostal?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion>;

  listarTodas(): Promise<Ubicacion[]>;
  listarPorBarrio(barrioId: number): Promise<Ubicacion[]>;
  listarPorDoctor(doctorId: number): Promise<Ubicacion[]>;
  buscarPorId(id: number): Promise<Ubicacion | null>;
  buscarPorDireccion(direccion: string): Promise<Ubicacion[]>;
  buscarPorCodigoPostal(codigoPostal: string): Promise<Ubicacion[]>;
  buscarPorEstado(estado: string): Promise<Ubicacion[]>;

  actualizar(
    id: number,
    barrioId?: number,
    direccion?: string,
    codigoPostal?: string,
    estado?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion>;

  crearParaDoctor(
    doctorId: number,
    barrioId: number,
    direccion: string,
    codigoPostal?: string,
    puntoGeografico?: string
  ): Promise<Ubicacion>;

  eliminar(id: number): Promise<Ubicacion>;
}
