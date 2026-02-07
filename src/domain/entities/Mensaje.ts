export type TipoMensaje = 'texto' | 'imagen' | 'audio' | 'video' | 'archivo' | 'otro';
export type EstadoMensaje = 'Enviado' | 'Leido' | 'Eliminado';

export class Mensaje {
  constructor(
    public id: number,
    public conversacionId: number,
    public remitenteId: number,
    public contenido: string | undefined,
    public tipo: TipoMensaje = 'texto',
    public mediaId: number | undefined,
    public estado: EstadoMensaje = 'Enviado',
    public enviadoEn: Date = new Date()
  ) {}

  /**
   * Verifica si el mensaje es de texto
   */
  public esTexto(): boolean {
    return this.tipo === 'texto';
  }

  /**
   * Verifica si el mensaje tiene contenido multimedia
   */
  public tieneMedia(): boolean {
    return this.mediaId !== undefined && this.mediaId !== null;
  }

  /**
   * Verifica si el mensaje fue editado
   */
  public fueLeido(): boolean {
    return this.estado === 'Leido';
  }

  /**
   * Verifica si el mensaje fue eliminado
   */
  public fueEliminado(): boolean {
    return this.estado === 'Eliminado';
  }

  /**
   * Verifica si el mensaje fue enviado por un usuario específico
   */
  public fueEnviadoPor(usuarioId: number): boolean {
    return this.remitenteId === usuarioId;
  }

  /**
   * Edita el contenido del mensaje
   */
  public editar(nuevoContenido: string): void {
    if (this.fueEliminado()) {
      throw new Error('No se puede editar un mensaje eliminado');
    }
    this.contenido = nuevoContenido;
  }

  /**
   * Elimina el mensaje (soft delete)
   */
  public eliminar(): void {
    this.estado = 'Eliminado';
    this.contenido = undefined;
  }

  /**
   * Valida que el mensaje tenga contenido válido
   */
  public esValido(): boolean {
    // Un mensaje es válido si tiene contenido de texto O tiene media adjunto
    return (
      (this.contenido !== undefined && this.contenido.trim().length > 0) ||
      this.tieneMedia()
    );
  }

  public toJSON() {
    return {
      id: this.id,
      conversacionId: this.conversacionId,
      remitenteId: this.remitenteId,
      contenido: this.fueEliminado() ? undefined : this.contenido,
      tipo: this.tipo,
      mediaId: this.mediaId,
      estado: this.estado,
      enviadoEn: this.enviadoEn,
      leido: this.fueLeido(),
      eliminado: this.fueEliminado()
    };
  }
}
