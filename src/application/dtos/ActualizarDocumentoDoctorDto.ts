import { IsInt, IsOptional, IsString } from 'class-validator';

/**
 * DTO para actualizar un documento rechazado
 */
export class ActualizarDocumentoDoctorDto {
    @IsInt({ message: 'El ID del documento debe ser un número entero' })
    documentoId!: number;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    descripcion?: string;
}
