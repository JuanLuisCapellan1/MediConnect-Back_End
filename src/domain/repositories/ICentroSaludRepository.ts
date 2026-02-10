export interface ICentroSaludRepository {
  obtenerPorId(id: number): Promise<any | null>;
  obtenerPorUsuarioId(usuarioId: number): Promise<any | null>;
  crear(datos: any): Promise<any>;
  actualizar(id: number, datos: any): Promise<any>;
  listar(): Promise<any[]>;
}
