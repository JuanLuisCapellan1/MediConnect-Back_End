import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDate, IsEnum, ValidateNested } from 'class-validator';

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
  numero_documento!: string;

  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  @IsEnum(['Cédula', 'Pasaporte'])
  tipo_documento!: 'Cédula' | 'Pasaporte';

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
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
  @Transform(({ value }) => (value ? Number(value) : undefined))
  altura?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  peso?: number;

  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  tipo_sangre?: string;
}