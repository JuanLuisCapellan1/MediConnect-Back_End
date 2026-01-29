import { Provincias } from "../entities/Provincias";

export interface IProvinciasRepository {
    crear(nombre: string): Promise<Provincias>;
    listarTodas(): Promise<Provincias[]>;
    buscarPorId(id: number): Promise<Provincias | null>;
    buscarPorNombre(nombre: string, estado: string): Promise<Provincias[]>;
    buscarPorEstado(estado: string): Promise<Provincias[]>;
    actualizar(id: number, nombre?: string, estado?: string): Promise<Provincias>;
    eliminar(id: number): Promise<Provincias>;
}
