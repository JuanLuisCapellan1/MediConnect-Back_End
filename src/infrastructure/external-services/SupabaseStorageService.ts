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

    if (error) {
      console.error(`Error subiendo a Supabase [${bucket}]:`, error);
      throw new Error('No se pudo subir el archivo al almacenamiento.');
    }

    return data.path;
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

  async deleteFile(path: string, bucket: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Error borrando archivo en Supabase: ${error.message}`);
    }
  }
}