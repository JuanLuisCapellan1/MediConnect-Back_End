/**
 * IServicioRepository.ts
 */
import { Servicio } from '../entities/Servicio';
import { ServicioImagen } from '../entities/ServicioImagen';

export interface FiltrosServicio {
    especialidadId?: number;
    modalidad?: string;
    estado?: string;
    precioMin?: number;
    precioMax?: number;
    diaSemana?: number;
}

export interface FiltrosCercania {
    especialidadId?: number;
    modalidad?: string;
    precioMin?: number;
    precioMax?: number;
}

export interface IServicioRepository {
    crear(
        doctorId: number,
        especialidadId: number,
        nombre: string,
        descripcion: string | null,
        precio: number,
        duracionMinutos: number,
        sesiones: number,
        maxPacientesDia: number | null,
        modalidad: string,
        centroSaludIds?: number[],
        ubicacionIds?: number[],
        horarioIds?: number[]
    ): Promise<Servicio>;

    buscarPorId(id: number): Promise<Servicio | null>;
    listarPorDoctor(doctorId: number, filtros?: FiltrosServicio): Promise<Servicio[]>;
    listarPorCentro(centroId: number, filtros?: FiltrosServicio): Promise<Servicio[]>;
    buscarCercanos(
        lat: number,
        lng: number,
        radioKm: number,
        filtros?: FiltrosCercania
    ): Promise<(Servicio & { distanciaMetros: number })[]>;

    actualizar(
        id: number,
        datos: {
            especialidadId?: number;
            nombre?: string;
            descripcion?: string;
            precio?: number;
            duracionMinutos?: number;
            sesiones?: number;
            maxPacientesDia?: number;
            modalidad?: string;
            estado?: string;
            centroSaludIds?: number[];
            ubicacionIds?: number[];
            horarioIds?: number[];
        }
    ): Promise<Servicio>;

    eliminar(id: number): Promise<Servicio>;
    desactivar(id: number): Promise<Servicio>;

    agregarImagen(servicioId: number, url: string, orden: number): Promise<ServicioImagen>;
    eliminarImagen(imagenId: number): Promise<void>;
    listarImagenes(servicioId: number): Promise<ServicioImagen[]>;
    contarImagenes(servicioId: number): Promise<number>;
}
