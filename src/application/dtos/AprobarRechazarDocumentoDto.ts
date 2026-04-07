import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * DTO para aprobar o rechazar un documento específico
 */
export class AprobarRechazarDocumentoDto {
    @IsInt({ message: 'El ID de la acción debe ser un número entero' })
    accionId!: number;

    @IsEnum(['Aprobada', 'Rechazada'], {
        message: 'La decisión debe ser "Aprobada" o "Rechazada"',
    })
    decision!: 'Aprobada' | 'Rechazada';

    @IsOptional()
    @IsString({ message: 'El comentario debe ser una cadena de texto' })
    comentario?: string;
}
