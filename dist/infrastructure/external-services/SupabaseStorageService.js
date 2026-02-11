"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const tsyringe_1 = require("tsyringe");
let SupabaseStorageService = class SupabaseStorageService {
    constructor() {
        // Asegúrate de que estas variables estén en tu .env
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('FATAL: Credenciales de Supabase no configuradas en .env');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    async uploadFile(fileBuffer, fileName, bucket, mimeType) {
        console.log(`📤 Iniciando upload a Supabase:`, {
            bucket,
            fileName,
            fileSize: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
            mimeType
        });
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(fileName, fileBuffer, {
            contentType: mimeType,
            upsert: true // Sobrescribir si existe
        });
        if (error || !data) {
            console.error(`❌ Error subiendo a Supabase [${bucket}]:`, {
                error: error?.message,
                errorDetails: error,
                fileName,
                bucket
            });
            throw new Error('No se pudo subir el archivo al almacenamiento.');
        }
        console.log(`✅ Archivo subido exitosamente:`, {
            bucket,
            path: data.path
        });
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
    getPublicUrl(path, bucket) {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
    async getSignedUrl(path, bucket) {
        // Genera un link válido por 120 segundos (ajustable)
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .createSignedUrl(path, 120);
        if (error) {
            throw new Error('No se pudo generar el acceso seguro al documento.');
        }
        return data.signedUrl;
    }
    async refreshSignedUrl(signedUrl, bucket) {
        // Extrae el path de una URL firmada existente para generar una nueva
        try {
            const url = new URL(signedUrl);
            const path = url.pathname.split('/').pop(); // Obtiene el nombre del archivo
            if (!path) {
                throw new Error('URL firmada inválida');
            }
            return await this.getSignedUrl(path, bucket);
        }
        catch (error) {
            throw new Error('No se pudo refrescar la URL firmada');
        }
    }
    async deleteFile(path, bucket) {
        const { error } = await this.supabase.storage.from(bucket).remove([path]);
        if (error) {
            console.error(`Error borrando archivo en Supabase: ${error.message}`);
        }
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], SupabaseStorageService);
