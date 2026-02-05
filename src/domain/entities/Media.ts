export type EstadoMedia = 'Activo' | 'Eliminado';

export class Media {
  constructor(
    public id: number,
    public archivo: string,
    public nombre: string | undefined,
    public tipoMime: string | undefined,
    public tamanioBytes: bigint | undefined,
    public estado: EstadoMedia = 'Activo',
    public fechaSubida: Date = new Date()
  ) {}

  /**
   * Verifica si el archivo es una imagen
   */
  public esImagen(): boolean {
    return this.tipoMime?.startsWith('image/') ?? false;
  }

  /**
   * Verifica si el archivo es un video
   */
  public esVideo(): boolean {
    return this.tipoMime?.startsWith('video/') ?? false;
  }

  /**
   * Verifica si el archivo es un audio
   */
  public esAudio(): boolean {
    return this.tipoMime?.startsWith('audio/') ?? false;
  }

  /**
   * Verifica si el archivo es un documento
   */
  public esDocumento(): boolean {
    const tiposDocumento = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return this.tipoMime ? tiposDocumento.includes(this.tipoMime) : false;
  }

  /**
   * Verifica si el archivo está activo
   */
  public esActivo(): boolean {
    return this.estado === 'Activo';
  }

  /**
   * Obtiene el tamaño en MB
   */
  public obtenerTamanioEnMB(): number {
    if (!this.tamanioBytes) return 0;
    return Number(this.tamanioBytes) / (1024 * 1024);
  }

  /**
   * Obtiene el tamaño formateado
   */
  public obtenerTamanioFormateado(): string {
    if (!this.tamanioBytes) return '0 B';
    
    const bytes = Number(this.tamanioBytes);
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Elimina el archivo (soft delete)
   */
  public eliminar(): void {
    this.estado = 'Eliminado';
  }

  /**
   * Valida el tamaño máximo del archivo (en MB)
   */
  public validarTamanioMaximo(maxMB: number): boolean {
    return this.obtenerTamanioEnMB() <= maxMB;
  }

  public toJSON() {
    return {
      id: this.id,
      archivo: this.archivo,
      nombre: this.nombre,
      tipoMime: this.tipoMime,
      tamanioBytes: this.tamanioBytes?.toString(),
      tamanioFormateado: this.obtenerTamanioFormateado(),
      estado: this.estado,
      fechaSubida: this.fechaSubida,
      esImagen: this.esImagen(),
      esVideo: this.esVideo(),
      esAudio: this.esAudio(),
      esDocumento: this.esDocumento()
    };
  }
}
