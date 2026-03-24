import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTOs para Tipos de Seguros
 */

/**
 * DTO para crear un nuevo tipo de seguro
 */
export class CrearTipoSeguroDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre del tipo de seguro es requerido' })
    nombre!: string;

    @IsString()
    @IsOptional()
    descripcion?: string;
}

/**
 * DTO para actualizar un tipo de seguro existente
 */
export class ActualizarTipoSeguroDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    @IsIn(['Activo', 'Inactivo'], { message: 'El estado debe ser Activo o Inactivo' })
    estado?: string;
}

/**
 * DTO para filtrar tipos de seguros
 */
export class FiltroTiposSegurosDto {
    @IsString()
    @IsOptional()
    estado?: string;

    @IsString()
    @IsOptional()
    busqueda?: string;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    pagina?: number;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    limite?: number;
}
