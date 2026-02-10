import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  MinLength,
  MaxLength,
  IsPositive,
  Matches,
} from 'class-validator';

export class CompletarPerfilCentroSaludDto {
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password!: string;

  @IsNotEmpty({ message: 'El nombre del centro es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(120, { message: 'El nombre no puede exceder 120 caracteres' })
  nombreComercial!: string;

  @IsOptional()
  @IsString({ message: 'El RNC debe ser texto' })
  @MinLength(7, { message: 'El RNC debe tener al menos 7 caracteres' })
  @MaxLength(20, { message: 'El RNC no puede exceder 20 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[0-9A-Za-z\-\.\s]+$/, { message: 'El RNC contiene caracteres inválidos' })
  rnc?: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser texto' })
  @MinLength(7, { message: 'El teléfono debe tener al menos 7 caracteres' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  @Matches(/^[0-9()+\-\s]+$/, { message: 'El teléfono contiene caracteres inválidos' })
  telefono!: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUrl({}, { message: 'El sitio web debe ser una URL válida' })
  sitioWeb?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  descripcion?: string;

  @IsNotEmpty({ message: 'El tipo de centro es requerido' })
  @IsNumber({}, { message: 'El tipo de centro debe ser un número' })
  @IsPositive({ message: 'El tipo de centro debe ser un ID válido' })
  @Transform(({ value }) => Number(value))
  tipoCentroId!: number;

  // Ubicación
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @IsString({ message: 'La dirección debe ser texto' })
  @MinLength(5, { message: 'La dirección debe tener al menos 5 caracteres' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  direccion!: string;

  @IsNotEmpty({ message: 'El barrio es requerido' })
  @IsNumber({}, { message: 'El barrio debe ser un número' })
  @IsPositive({ message: 'El barrio debe ser un ID válido' })
  @Transform(({ value }) => Number(value))
  barrioId!: number;

  @IsOptional()
  @IsNumber({}, { message: 'El sub-barrio debe ser un número' })
  @IsPositive({ message: 'El sub-barrio debe ser un ID válido' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  subBarrioId?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: 'El código postal debe ser texto' })
  @MaxLength(20, { message: 'El código postal no puede exceder 20 caracteres' })
  codigoPostal?: string;

  @IsOptional()
  @IsString({ message: 'El punto geográfico debe ser GeoJSON' })
  puntoGeografico?: string;
}
