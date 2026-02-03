/**
 * Entidad ServicioHorario - Dominio
 * Representa la relación entre un Servicio y un Horario
 */
export class ServicioHorario {
  servicioId: number;
  horarioId: number;
  estado: string;
  creadoEn: Date;
  
  // Relaciones opcionales (se populan mediante JOINs)
  servicio?: {
    id: number;
    nombre: string;
    descripcion?: string;
    estado: string;
  };
  horario?: {
    id: number;
    nombre: string;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    estado: string;
  };

  constructor(data: {
    servicioId: number;
    horarioId: number;
    estado?: string;
    creadoEn?: Date;
    servicio?: any;
    horario?: any;
  }) {
    this.servicioId = data.servicioId;
    this.horarioId = data.horarioId;
    this.estado = data.estado || 'Activo';
    this.creadoEn = data.creadoEn || new Date();
    this.servicio = data.servicio;
    this.horario = data.horario;
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
