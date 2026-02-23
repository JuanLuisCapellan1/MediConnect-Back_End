import { Barrio } from "../entities/Barrio";

export interface IBarriosRepository {
    crear(seccionId: number, nombre: string): Promise<Barrio>;
    listarTodas(): Promise<Barrio[]>;
    listarPorSeccion(seccionId: number): Promise<Barrio[]>;
    buscarPorId(id: number): Promise<Barrio | null>;
    buscarPorNombre(nombre: string, seccionId: number, estado: string): Promise<Barrio[]>;
    buscarPorEstado(estado: string): Promise<Barrio[]>;
    actualizar(id: number, seccionId?: number, nombre?: string, estado?: string): Promise<Barrio>;
    eliminar(id: number): Promise<Barrio>;
    /** Devuelve el barrio (sin geom) cuyo polígono contiene el punto dado. */
    buscarPorCoordenadas(longitud: number, latitud: number): Promise<Barrio | null>;
    /** Devuelve el barrio con su geometría completa en GeoJSON. */
    obtenerGeometria(id: number): Promise<Barrio | null>;
}
