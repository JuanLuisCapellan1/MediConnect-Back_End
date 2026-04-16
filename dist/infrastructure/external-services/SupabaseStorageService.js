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
            upsert: true
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
        console.log(`✅ Archivo subido exitosamente:`, { bucket, path: data.path });
        // Para assets públicos devolvemos la URL pública completa
        if (bucket === 'public-assets') {
            const { data: publicData } = this.supabase.storage.from(bucket).getPublicUrl(data.path);
            return publicData.publicUrl;
        }
        // Para documentos seguros devolvemos SOLO EL PATH (no la URL firmada),
        // para que al momento de servir el documento se genere una URL fresca.
        return data.path;
    }
    getPublicUrl(path, bucket) {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
    async getSignedUrl(path, bucket, expiresIn = 3600 // 1 hora por defecto
    ) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
        if (error || !data) {
            throw new Error('No se pudo generar el acceso seguro al documento.');
        }
        return data.signedUrl;
    }
    /**
     * Detecta si el valor es un path puro (no una URL completa) y genera
     * una URL firmada fresca. Si falla (e.g. path inválido extraído de URL vieja),
     * devuelve el valor original para no romper la respuesta.
     */
    async refreshOrGetSignedUrl(pathOrUrl) {
        if (!pathOrUrl)
            return pathOrUrl;
        let path = pathOrUrl;
        // Si ya es una URL completa (registro antiguo en DB), extraer el path
        if (pathOrUrl.startsWith('http')) {
            try {
                const url = new URL(pathOrUrl);
                // Supabase storage URLs tienen el formato:
                // /storage/v1/object/sign/<bucket>/<path...>
                // /storage/v1/object/authenticated/<bucket>/<path...>
                const parts = url.pathname.split('/');
                const bucketIdx = parts.findIndex(p => p === 'secure-documents');
                if (bucketIdx === -1) {
                    console.warn('⚠️ refreshOrGetSignedUrl: no se encontró "secure-documents" en la URL:', url.pathname);
                    return pathOrUrl; // No es un documento seguro conocido, devolver original
                }
                // Decodificar caracteres URL-encoded (e.g., %40 → @, %20 → ' ')
                path = parts.slice(bucketIdx + 1).map(decodeURIComponent).join('/');
                console.log(`🔄 Regenerando URL firmada para path: ${path}`);
            }
            catch (e) {
                console.warn('⚠️ refreshOrGetSignedUrl: no se pudo parsear la URL:', pathOrUrl, e);
                return pathOrUrl;
            }
        }
        try {
            const freshUrl = await this.getSignedUrl(path, 'secure-documents');
            console.log(`✅ URL firmada regenerada exitosamente para: ${path}`);
            return freshUrl;
        }
        catch (e) {
            console.error('❌ refreshOrGetSignedUrl: falló al regenerar URL para path:', path, e);
            // Devolver el original para no romper la respuesta
            return pathOrUrl;
        }
    }
    async refreshSignedUrl(signedUrl, bucket) {
        try {
            const url = new URL(signedUrl);
            const parts = url.pathname.split('/');
            const bucketIdx = parts.findIndex(p => p === bucket);
            const path = bucketIdx !== -1 ? parts.slice(bucketIdx + 1).join('/') : parts.pop();
            if (!path)
                throw new Error('URL firmada inválida');
            return await this.getSignedUrl(path, bucket);
        }
        catch {
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
