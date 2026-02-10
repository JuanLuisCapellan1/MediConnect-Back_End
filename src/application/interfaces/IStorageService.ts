export interface IStorageService {
  /**
   * Sube un archivo y retorna la URL accesible (pública para assets, firmada para documentos)
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
   * Obtiene una URL firmada temporal (para buckets privados)
   */
  getSignedUrl(path: string, bucket: 'secure-documents'): Promise<string>;

  /**
   * Refresca una URL firmada existente generando una nueva
   */
  refreshSignedUrl(signedUrl: string, bucket: 'secure-documents'): Promise<string>;
  
  /**
   * Elimina un archivo
   */
  deleteFile(path: string, bucket: string): Promise<void>;
}