/**
 * IServicioRepository.ts
 */
import { Servicio } from '../entities/Servicio';
import { ServicioImagen } from '../entities/ServicioImagen';
import { SedeServicioDto } from '../../application/dtos/ServicioDtos';

export interface FiltrosServicio {
    especialidadId?: number;
    tipoServicioId?: number;
    modalidad?: string;
    estado?: string;
    precioMin?: number;
    precioMax?: number;
}

export interface IServicioRepository {
    crear(
        doctorId: number,
        tipoServicioId: number,
        especialidadId: number,
        nombre: string,
        descripcion: string | null,
        precio: number,
        duracionMinutos: number,
        maxPacientesDia: number | null,
        modalidad: string,
        sedes?: SedeServicioDto[]
    ): Promise<Servicio>;

    buscarPorId(id: number): Promise<Servicio | null>;
    listarPorDoctor(doctorId: number, filtros?: FiltrosServicio): Promise<Servicio[]>;
    /** Obtener todos los servicios ofrecidos en un centro de salud */
    listarPorCentro(centroId: number, filtros?: FiltrosServicio): Promise<Servicio[]>;

    actualizar(
        id: number,
        datos: {
            tipoServicioId?: number;
            especialidadId?: number;
            nombre?: string;
            descripcion?: string;
            precio?: number;
            duracionMinutos?: number;
            maxPacientesDia?: number;
            modalidad?: string;
            estado?: string;
            sedesAgregar?: SedeServicioDto[];
            sedesEliminar?: number[];
            horariosEliminar?: number[];
        }
    ): Promise<Servicio>;

    eliminar(id: number): Promise<Servicio>;
    desactivar(id: number): Promise<Servicio>;

    agregarImagen(servicioId: number, url: string, orden: number): Promise<ServicioImagen>;
    eliminarImagen(imagenId: number): Promise<void>;
    listarImagenes(servicioId: number): Promise<ServicioImagen[]>;
    contarImagenes(servicioId: number): Promise<number>;
}
