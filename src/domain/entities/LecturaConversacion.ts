export class LecturaConversacion {
  constructor(
    public conversacionId: number,
    public usuarioId: number,
    public ultimoMensajeLeidoId: number | undefined,
    public leidoEn: Date = new Date()
  ) {}

  /**
   * Actualiza el último mensaje leído
   */
  public actualizarUltimoMensajeLeido(mensajeId: number): void {
    this.ultimoMensajeLeidoId = mensajeId;
    this.leidoEn = new Date();
  }

  /**
   * Verifica si se ha leído algún mensaje
   */
  public hayMensajesLeidos(): boolean {
    return this.ultimoMensajeLeidoId !== undefined && this.ultimoMensajeLeidoId !== null;
  }

  public toJSON() {
    return {
      conversacionId: this.conversacionId,
      usuarioId: this.usuarioId,
      ultimoMensajeLeidoId: this.ultimoMensajeLeidoId,
      leidoEn: this.leidoEn
    };
  }
}
