/**
 * IResenaRepository.ts — Puerto de dominio para Reseñas
 */
import { Resena } from '../entities/Resena';

export interface CrearResenaData {
    servicioId: number;
    pacienteId: number;
    doctorId: number;
    calificacion: number;
    comentario?: string | null;
    citaId?: number | null;
}

export interface IResenaRepository {
    crear(data: CrearResenaData): Promise<Resena>;

    buscarPorId(id: number): Promise<Resena | null>;

    listarPorServicio(
        servicioId: number,
        pagina?: number,
        limite?: number
    ): Promise<{ datos: Resena[]; total: number }>;

    listarPorDoctor(
        doctorId: number,
        pagina?: number,
        limite?: number
    ): Promise<{ datos: Resena[]; total: number }>;

    listarMias(pacienteId: number): Promise<Resena[]>;

    existeResena(pacienteId: number, servicioId: number): Promise<boolean>;

    eliminar(id: number): Promise<void>;
}
