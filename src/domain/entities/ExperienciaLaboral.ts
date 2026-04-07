export class ExperienciaLaboral {
  constructor(
    public readonly id: number,
    public readonly doctorId: number,
    public readonly institucion: string,
    public readonly posicion: string,
    public readonly fechaInicio: Date,
    public readonly estado: string,
    public readonly creadoEn: Date,
    public readonly fechaFinalizacion?: Date,
    public readonly trabajaActualmente: boolean = false,
    public readonly actualizadoEn?: Date
  ) { }

  /**
   * Valida si la experiencia está actualmente activa
   */
  estaActiva(): boolean {
    return this.trabajaActualmente || !this.fechaFinalizacion;
  }

  /**
   * Calcula la duración en meses de la experiencia
   */
  calcularDuracionMeses(): number {
    const fechaFin = this.trabajaActualmente ? new Date() : (this.fechaFinalizacion || new Date());
    const diffTime = Math.abs(fechaFin.getTime() - this.fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 30);
  }
}
