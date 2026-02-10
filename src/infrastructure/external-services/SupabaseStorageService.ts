import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { injectable } from 'tsyringe';
import { IStorageService } from '../../application/interfaces/IStorageService';

@injectable()
export class SupabaseStorageService implements IStorageService {
  private supabase: SupabaseClient;

  constructor() {
    // Asegúrate de que estas variables estén en tu .env
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('FATAL: Credenciales de Supabase no configuradas en .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    bucket: 'public-assets' | 'secure-documents',
    mimeType: string
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true // Sobrescribir si existe
      });

    if (error || !data) {
      console.error(`Error subiendo a Supabase [${bucket}]:`, error);
      throw new Error('No se pudo subir el archivo al almacenamiento.');
    }

    // Para assets públicos devolvemos la URL completa
    if (bucket === 'public-assets') {
      const { data: publicData } = this.supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicData.publicUrl;
    }

    // Para documentos seguros generamos una URL firmada de larga duración (7 días)
    const { data: signedData } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 7 * 24 * 60 * 60); // 7 días en segundos

    if (signedData) {
      return signedData.signedUrl;
    }

    // Fallback: generar URL firmada corta si falla la larga
    return await this.getSignedUrl(data.path, bucket);
  }

  getPublicUrl(path: string, bucket: 'public-assets'): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async getSignedUrl(path: string, bucket: 'secure-documents'): Promise<string> {
    // Genera un link válido por 120 segundos (ajustable)
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, 120);

    if (error) {
      throw new Error('No se pudo generar el acceso seguro al documento.');
    }

    return data.signedUrl;
  }

  async refreshSignedUrl(signedUrl: string, bucket: 'secure-documents'): Promise<string> {
    // Extrae el path de una URL firmada existente para generar una nueva
    try {
      const url = new URL(signedUrl);
      const path = url.pathname.split('/').pop(); // Obtiene el nombre del archivo
      
      if (!path) {
        throw new Error('URL firmada inválida');
      }

      return await this.getSignedUrl(path, bucket);
    } catch (error) {
      throw new Error('No se pudo refrescar la URL firmada');
    }
  }

  async deleteFile(path: string, bucket: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Error borrando archivo en Supabase: ${error.message}`);
    }
  }
}