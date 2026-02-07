import { DistritoMunicipal } from "../entities/DistritoMunicipal";

export interface IDistritosMunicipalesRepository {
    crear(municipioId: number, nombre: string): Promise<DistritoMunicipal>;
    listarTodas(): Promise<DistritoMunicipal[]>;
    listarPorMunicipio(municipioId: number): Promise<DistritoMunicipal[]>;
    buscarPorId(id: number): Promise<DistritoMunicipal | null>;
    buscarPorNombre(nombre: string, municipioId: number, estado: string): Promise<DistritoMunicipal[]>;
    buscarPorEstado(estado: string): Promise<DistritoMunicipal[]>;
    actualizar(id: number, municipioId?: number, nombre?: string, estado?: string): Promise<DistritoMunicipal>;
    eliminar(id: number): Promise<DistritoMunicipal>;
}
