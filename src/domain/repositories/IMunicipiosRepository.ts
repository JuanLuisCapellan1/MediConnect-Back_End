import { Municipio } from "../entities/Municipio";

export interface IMunicipiosRepository {
    crear(provinciaId: number, nombre: string): Promise<Municipio>;
    listarTodas(): Promise<Municipio[]>;
    listarPorProvincia(provinciaId: number): Promise<Municipio[]>;
    buscarPorId(id: number): Promise<Municipio | null>;
    buscarPorNombre(nombre: string, provinciaId: number, estado: string): Promise<Municipio[]>;
    buscarPorEstado(estado: string): Promise<Municipio[]>;
    actualizar(id: number, provinciaId?: number, nombre?: string, estado?: string): Promise<Municipio>;
    eliminar(id: number): Promise<Municipio>;
}
