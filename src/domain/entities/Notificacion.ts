export type TipoAlerta = 'Informacion' | 'Advertencia' | 'Error' | 'Exito';
export type TipoEntidad = 'Cita' | 'Mensaje' | 'Resena' | 'Usuario' | 'Sistema';

export class Notificacion {
  constructor(
    public id: number,
    public usuarioId: number,
    public titulo: string,
    public mensaje: string,
    public tipoAlerta: TipoAlerta = 'Informacion',
    public tipoEntidad?: TipoEntidad,
    public entidadId?: number,
    public leidaEn?: Date,
    public estado: string = 'Activo',
    public creadoEn: Date = new Date()
  ) {}

  public esLeida(): boolean {
    return this.leidaEn !== undefined && this.leidaEn !== null;
  }

  public esActiva(): boolean {
    return this.estado === 'Activo';
  }

  public marcarComoLeida(): void {
    if (!this.esLeida()) {
      this.leidaEn = new Date();
    }
  }

  public desactivar(): void {
    this.estado = 'Inactivo';
  }

  public toJSON() {
    return {
      id: this.id,
      usuarioId: this.usuarioId,
      titulo: this.titulo,
      mensaje: this.mensaje,
      tipoAlerta: this.tipoAlerta,
      tipoEntidad: this.tipoEntidad,
      entidadId: this.entidadId,
      leida: this.esLeida(),
      leidaEn: this.leidaEn,
      estado: this.estado,
      creadoEn: this.creadoEn
    };
  }
}
