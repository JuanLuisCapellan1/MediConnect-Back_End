/**
 * IGrupoCitaRepository.ts
 * Interfaz de repositorio para grupos de citas recurrentes
 */

import { GrupoCita } from '../entities/GrupoCita';

export interface ICrearGrupoCitaData {
    pacienteId: number;
    servicioId: number;
    horarioId: number;
    fechaInicio: Date;
    fechaFin?: Date | null;
    descripcion?: string | null;
}

export interface IGrupoCitaRepository {
    crear(datos: ICrearGrupoCitaData): Promise<GrupoCita>;
    buscarPorId(id: number): Promise<GrupoCita | null>;
    listarPorPaciente(pacienteId: number, pagina?: number, limite?: number): Promise<{ datos: GrupoCita[]; total: number }>;
    cancelarGrupo(grupoId: number): Promise<GrupoCita>;
}
