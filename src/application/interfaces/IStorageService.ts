export interface IStorageService {
  /**
   * Sube un archivo al almacenamiento.
   * - Para `public-assets`: retorna la URL pública completa.
   * - Para `secure-documents`: retorna solo el PATH del archivo (NO la URL firmada).
   *   Al momento de servir el documento se debe llamar a `getSignedUrl` para obtener
   *   una URL firmada fresca y evitar el problema de tokens expirados.
   */
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    bucket: 'public-assets' | 'secure-documents',
    mimeType: string
  ): Promise<string>;

  /**
   * Obtiene la URL pública (solo para buckets públicos)
   */
  getPublicUrl(path: string, bucket: 'public-assets'): string;

  /**
   * Genera una URL firmada temporal para acceder a un documento seguro.
   * @param path   Path relativo del archivo dentro del bucket
   * @param bucket Bucket de Supabase (siempre 'secure-documents')
   * @param expiresIn Segundos de validez (por defecto 3600 = 1 hora)
   */
  getSignedUrl(path: string, bucket: 'secure-documents', expiresIn?: number): Promise<string>;

  /**
   * Acepta un PATH puro o una URL firmada antigua (almacenada en DB) y
   * devuelve siempre una URL firmada fresca. Útil para retrocompatibilidad
   * con registros que aún tienen la URL completa en la base de datos.
   */
  refreshOrGetSignedUrl(pathOrUrl: string): Promise<string>;

  /**
   * Refresca una URL firmada existente generando una nueva
   */
  refreshSignedUrl(signedUrl: string, bucket: 'secure-documents'): Promise<string>;

  /**
   * Elimina un archivo
   */
  deleteFile(path: string, bucket: string): Promise<void>;
}