import { Profesion } from '../entities/Profesion';

export interface IProfesionesRepository {
  crear(nombre: string, estado: string): Promise<Profesion>;
  obtenerPorId(id: number): Promise<Profesion | null>;
  obtenerTodos(
    estado?: string,
    busqueda?: string,
    pagina?: number,
    limite?: number
  ): Promise<{ profesiones: Profesion[]; total: number }>;
  actualizar(id: number, nombre?: string, estado?: string): Promise<Profesion>;
  eliminar(id: number): Promise<void>;
  existePorNombre(nombre: string, excluyendoId?: number): Promise<boolean>;
}
