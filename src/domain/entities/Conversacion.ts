export type EstadoConversacion = 'Activa' | 'Archivada' | 'Bloqueada';

export class Conversacion {
  constructor(
    public id: number,
    public emisorId: number,
    public receptorId: number,
    public silenciado: boolean = false,
    public estado: EstadoConversacion = 'Activa',
    public creadoEn: Date = new Date(),
    public actualizadoEn?: Date
  ) {}

  /**
   * Verifica si la conversación está activa
   */
  public esActiva(): boolean {
    return this.estado === 'Activa';
  }

  /**
   * Verifica si la conversación está archivada
   */
  public esArchivada(): boolean {
    return this.estado === 'Archivada';
  }

  /**
   * Verifica si la conversación está bloqueada
   */
  public esBloqueada(): boolean {
    return this.estado === 'Bloqueada';
  }

  /**
   * Verifica si un usuario es participante de la conversación
   */
  public esParticipante(usuarioId: number): boolean {
    return this.emisorId === usuarioId || this.receptorId === usuarioId;
  }

  /**
   * Obtiene el ID del otro participante
   */
  public obtenerOtroParticipante(usuarioId: number): number | null {
    if (!this.esParticipante(usuarioId)) {
      return null;
    }
    return this.emisorId === usuarioId ? this.receptorId : this.emisorId;
  }

  /**
   * Silencia o activa las notificaciones de la conversación
   */
  public silenciar(silenciado: boolean): void {
    this.silenciado = silenciado;
    this.actualizadoEn = new Date();
  }

  /**
   * Archiva la conversación
   */
  public archivar(): void {
    this.estado = 'Archivada';
    this.actualizadoEn = new Date();
  }

  /**
   * Desarchiva la conversación
   */
  public desarchivar(): void {
    if (this.esArchivada()) {
      this.estado = 'Activa';
      this.actualizadoEn = new Date();
    }
  }

  /**
   * Bloquea la conversación
   */
  public bloquear(): void {
    this.estado = 'Bloqueada';
    this.actualizadoEn = new Date();
  }

  /**
   * Desbloquea la conversación
   */
  public desbloquear(): void {
    if (this.esBloqueada()) {
      this.estado = 'Activa';
      this.actualizadoEn = new Date();
    }
  }

  /**
   * Actualiza el timestamp de actualización
   */
  public actualizar(): void {
    this.actualizadoEn = new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      emisorId: this.emisorId,
      receptorId: this.receptorId,
      silenciado: this.silenciado,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn
    };
  }
}
