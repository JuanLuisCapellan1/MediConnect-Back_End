import { Usuario } from "../entities/Usuario";

export interface IUsuarioRepository {
  crear(usuario: Usuario): Promise<Usuario>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  actualizar(id: number, datos: Partial<Usuario>): Promise<Usuario>;
  eliminar(id: number): Promise<void>;
}