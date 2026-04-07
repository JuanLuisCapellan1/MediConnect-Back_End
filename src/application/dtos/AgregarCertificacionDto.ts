import { IsString } from 'class-validator';

/**
 * DTO para agregar una nueva certificación
 */
export class AgregarCertificacionDto {
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    descripcion!: string;
}
