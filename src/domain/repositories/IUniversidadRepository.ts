import { Universidad } from '../entities/Universidad';

export interface IUniversidadRepository {
    crear(universidad: Universidad): Promise<Universidad>;
    obtenerPorId(id: number): Promise<Universidad | null>;
    obtenerTodos(paisId?: number, estado?: string, busqueda?: string, pagina?: number, limite?: number): Promise<{ universidades: Universidad[]; total: number }>;
    obtenerPorPais(paisId: number): Promise<Universidad[]>;
    actualizar(id: number, universidad: Partial<Universidad>): Promise<Universidad>;
    eliminar(id: number): Promise<void>;
}
