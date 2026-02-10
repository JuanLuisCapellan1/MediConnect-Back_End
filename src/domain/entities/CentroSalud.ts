export class CentroSalud {
  constructor(
    public id: number,
    public usuarioId: number,
    public nombreComercial: string,
    public rnc: string,
    public tipoCentroId: number,
    public ubicacionId: number,
    public telefono?: string,
    public sitio_web?: string,
    public descripcion?: string,
    public certificacion_sanitaria?: string,
    public estado: string = 'Activo',
    public estadoVerificacion: string = 'Pendiente',
    public creadoEn?: Date,
    public actualizadoEn?: Date
  ) {}

  public esActivo(): boolean {
    return this.estado === 'Activo';
  }

  public estaEnRevision(): boolean {
    return this.estadoVerificacion === 'En revisión';
  }

  public esAprobado(): boolean {
    return this.estadoVerificacion === 'Aprobado';
  }

  public estaRechazado(): boolean {
    return this.estadoVerificacion === 'Rechazado';
  }

  public actualizarEstado(nuevoEstado: string): void {
    this.estado = nuevoEstado;
    this.actualizadoEn = new Date();
  }

  public actualizarEstadoVerificacion(nuevoEstado: string): void {
    this.estadoVerificacion = nuevoEstado;
    this.actualizadoEn = new Date();
  }
}
