import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear un seguro médico (Admin)
 */
export class CrearSeguroMedicoDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre del seguro es requerido' })
    nombre!: string;

    @IsString()
    @IsOptional()
    urlImage?: string;
}

/**
 * DTO para actualizar un seguro médico (Admin)
 */
export class ActualizarSeguroMedicoDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    urlImage?: string;

    @IsString()
    @IsOptional()
    @IsIn(['Activo', 'Inactivo'], { message: 'El estado debe ser Activo o Inactivo' })
    estado?: string;
}

/**
 * DTO para agregar un seguro a un paciente (máximo 3)
 */
export class AgregarSeguroPacienteDto {
    @IsInt({ message: 'El ID del seguro debe ser un número entero' })
    @IsPositive({ message: 'El ID del seguro debe ser positivo' })
    @Type(() => Number)
    idSeguro!: number;

    @IsInt({ message: 'El ID del tipo de seguro debe ser un número entero' })
    @IsPositive({ message: 'El ID del tipo de seguro debe ser positivo' })
    @Type(() => Number)
    idTipoSeguro!: number;
}

/**
 * DTO para agregar un seguro a un doctor (ilimitado)
 */
export class AgregarSeguroDoctorDto {
    @IsInt({ message: 'El ID del seguro debe ser un número entero' })
    @IsPositive({ message: 'El ID del seguro debe ser positivo' })
    @Type(() => Number)
    idSeguro!: number;

    @IsInt({ message: 'El ID del tipo de seguro debe ser un número entero' })
    @IsPositive({ message: 'El ID del tipo de seguro debe ser positivo' })
    @Type(() => Number)
    idTipoSeguro!: number;
}

/**
 * DTO para filtrar seguros
 */
export class FiltroSegurosDto {
    @IsOptional()
    @IsString()
    estado?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    pagina?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    limite?: number;
}
