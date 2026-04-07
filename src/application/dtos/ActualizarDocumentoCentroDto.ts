import { IsInt, IsOptional, IsString } from 'class-validator';

/**
 * DTO para actualizar el documento (certificación sanitaria) rechazado de un centro de salud
 */
export class ActualizarDocumentoCentroDto {
    // El ID es opcional o se ignora en el caso de uso, ya que el centro solo tiene 1 documento
    @IsOptional()
    @IsInt({ message: 'El ID del documento debe ser un número entero' })
    documentoId?: number;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    descripcion?: string;
}
