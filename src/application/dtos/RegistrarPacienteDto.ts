import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDate, IsEnum, ValidateNested, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO para registro de pacientes
 * Recibe: multipart/form-data con archivos
 */
export class RegistrarPacienteDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre!: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  apellido!: string;

  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @IsString()
  @MinLength(4, { message: 'El número de documento debe tener al menos 4 caracteres' })
  @MaxLength(30, { message: 'El número de documento no puede exceder 30 caracteres' })
  numero_documento!: string;

  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  @IsEnum(['Cédula', 'Pasaporte'])
  tipo_documento!: 'Cédula' | 'Pasaporte';

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password!: string;

  // Campos opcionales
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fecha_nacimiento?: Date;

  @IsOptional()
  @IsEnum(['M', 'F', 'O'])
  genero?: 'M' | 'F' | 'O';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const num = Number(value);
    if (isNaN(num)) return undefined;
    return num;
  })
  @Min(0.30, { message: 'La altura debe ser al menos 0.30 metros (30 cm)' })
  @Max(2.50, { message: 'La altura no puede exceder 2.50 metros (250 cm). Por favor, ingresa la altura en metros (ej: 1.75)' })
  altura?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'El peso debe ser mayor a 0' })
  @Max(500, { message: 'El peso no puede exceder 500 kg' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  peso?: number;

  @IsOptional()
  @IsString()
  @MinLength(7, { message: 'El teléfono debe tener al menos 7 caracteres' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  tipo_sangre?: string;
}