/**
 * IHorariosRepository.ts
 * Interfaz del repositorio para operaciones de persistencia de Horarios
 */

import { Horario } from '../entities/Horario';

export interface IHorariosRepository {
  crear(
    doctorId: number,
    nombre: string,
    diaSemana: number,
    horaInicio: Date,
    horaFin: Date,
    ubicacionId: number
  ): Promise<Horario>;

  listarTodos(): Promise<Horario[]>;

  listarPorDoctor(doctorId: number): Promise<Horario[]>;

  listarPorDia(diaSemana: number): Promise<Horario[]>;

  buscarPorId(id: number): Promise<Horario | null>;

  actualizar(
    id: number,
    doctorId?: number,
    nombre?: string,
    diaSemana?: number,
    horaInicio?: Date,
    horaFin?: Date,
    ubicacionId?: number,
    estado?: string
  ): Promise<Horario>;

  eliminar(id: number): Promise<Horario>;

  existeConflicto(
    doctorId: number,
    diaSemana: number,
    horaInicio: Date,
    horaFin: Date,
    excluirId?: number
  ): Promise<boolean>;
}