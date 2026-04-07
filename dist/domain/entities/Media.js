"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
class Media {
    constructor(id, archivo, nombre, tipoMime, tamanioBytes, estado = 'Activo', fechaSubida = new Date()) {
        this.id = id;
        this.archivo = archivo;
        this.nombre = nombre;
        this.tipoMime = tipoMime;
        this.tamanioBytes = tamanioBytes;
        this.estado = estado;
        this.fechaSubida = fechaSubida;
    }
    /**
     * Verifica si el archivo es una imagen
     */
    esImagen() {
        return this.tipoMime?.startsWith('image/') ?? false;
    }
    /**
     * Verifica si el archivo es un video
     */
    esVideo() {
        return this.tipoMime?.startsWith('video/') ?? false;
    }
    /**
     * Verifica si el archivo es un audio
     */
    esAudio() {
        return this.tipoMime?.startsWith('audio/') ?? false;
    }
    /**
     * Verifica si el archivo es un documento
     */
    esDocumento() {
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
    esActivo() {
        return this.estado === 'Activo';
    }
    /**
     * Obtiene el tamaño en MB
     */
    obtenerTamanioEnMB() {
        if (!this.tamanioBytes)
            return 0;
        return Number(this.tamanioBytes) / (1024 * 1024);
    }
    /**
     * Obtiene el tamaño formateado
     */
    obtenerTamanioFormateado() {
        if (!this.tamanioBytes)
            return '0 B';
        const bytes = Number(this.tamanioBytes);
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
    /**
     * Elimina el archivo (soft delete)
     */
    eliminar() {
        this.estado = 'Eliminado';
    }
    /**
     * Valida el tamaño máximo del archivo (en MB)
     */
    validarTamanioMaximo(maxMB) {
        return this.obtenerTamanioEnMB() <= maxMB;
    }
    toJSON() {
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
exports.Media = Media;
