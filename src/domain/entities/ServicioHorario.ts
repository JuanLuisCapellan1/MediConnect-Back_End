/**
 * Entidad ServicioHorario - Dominio
 * Representa la relación entre un Servicio y un Horario
 */
export class ServicioHorario {
  servicioId: number;
  horarioId: number;
  estado: string;
  creadoEn: Date;

  constructor(data: {
    servicioId: number;
    horarioId: number;
    estado?: string;
    creadoEn?: Date;
  }) {
    this.servicioId = data.servicioId;
    this.horarioId = data.horarioId;
    this.estado = data.estado || 'Activo';
    this.creadoEn = data.creadoEn || new Date();
  }

  /**
   * Valida que los IDs sean números válidos y mayores a 0
   */
  isValid(): boolean {
    return (
      this.servicioId > 0 &&
      this.horarioId > 0 &&
      this.estado.length > 0 &&
      this.creadoEn instanceof Date
    );
  }

  /**
   * Verifica si la relación está activa
   */
  isActive(): boolean {
    return this.estado === 'Activo';
  }

  /**
   * Desactiva la relación
   */
  deactivate(): void {
    this.estado = 'Inactivo';
  }

  /**
   * Activa la relación
   */
  activate(): void {
    this.estado = 'Activo';
  }
}
