import { Pais } from '../entities/Pais';

export interface IPaisRepository {
    crear(pais: Pais): Promise<Pais>;
    obtenerPorId(id: number): Promise<Pais | null>;
    obtenerTodos(estado?: string, busqueda?: string, pagina?: number, limite?: number): Promise<{ paises: Pais[]; total: number }>;
    actualizar(id: number, pais: Partial<Pais>): Promise<Pais>;
    eliminar(id: number): Promise<void>;
}
