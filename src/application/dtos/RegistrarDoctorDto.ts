import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsDate,
  MinDate,
  MaxDate,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max
} from 'class-validator';


export class FormacionAcademicaDto {
  @IsNotEmpty({ message: 'ID de especialidad requerido' })
  @Transform(({ value }) => Number(value))
  id_especialidad!: number;

  @IsNotEmpty({ message: 'ID de universidad requerido' })
  @Transform(({ value }) => Number(value))
  id_universidad!: number;

  @IsNotEmpty({ message: 'Fecha de inicio requerida' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  fecha_inicio!: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  fecha_finalizacion?: Date | null;

  @IsNotEmpty({ message: 'Estado de formación requerido' })
  @IsEnum(['Activo', 'Finalizado', 'En curso'])
  estado!: 'Activo' | 'Finalizado' | 'En curso';
}

export class RegistrarDoctorDto {
  // --- DATOS PERSONALES ---
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede exceder 80 caracteres' })
  nombre!: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(80, { message: 'El apellido no puede exceder 80 caracteres' })
  apellido!: string;

  @IsNotEmpty({ message: 'El género es requerido' })
  @IsEnum(['M', 'F', 'O'])
  genero!: 'M' | 'F' | 'O';

  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  fecha_nacimiento!: Date;

  @IsNotEmpty({ message: 'La nacionalidad es requerida' })
  @IsString()
  @MinLength(2, { message: 'La nacionalidad debe tener al menos 2 caracteres' })
  @MaxLength(80, { message: 'La nacionalidad no puede exceder 80 caracteres' })
  nacionalidad!: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString()
  @MinLength(7, { message: 'El teléfono debe tener al menos 7 caracteres' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  telefono!: string;

  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  @IsEnum(['Cédula', 'Pasaporte'])
  tipo_documento!: 'Cédula' | 'Pasaporte';

  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @IsString()
  @MinLength(4, { message: 'El número de documento debe tener al menos 4 caracteres' })
  @MaxLength(30, { message: 'El número de documento no puede exceder 30 caracteres' })
  numero_documento!: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password!: string;

  // --- DATOS PROFESIONALES ---
  @IsNotEmpty({ message: 'El exequatur es requerido' })
  @IsString()
  @MinLength(3, { message: 'El exequatur debe tener al menos 3 caracteres' })
  @MaxLength(60, { message: 'El exequatur no puede exceder 60 caracteres' })
  exequatur!: string;

  @IsOptional()
  @IsString()
  biografia?: string;

  // --- OBJETOS COMPLEJOS (Parseados de JSON strings en FormData) ---

  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === '') return [];
    if (typeof value !== 'string') return Array.isArray(value) ? value : [];
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>[];
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.map((item) => {
        const f = new FormacionAcademicaDto();
        f.id_especialidad = Number(item.id_especialidad);
        f.id_universidad = Number(item.id_universidad);
        f.fecha_inicio = item.fecha_inicio ? new Date(item.fecha_inicio as string) : new Date();
        f.fecha_finalizacion = item.fecha_finalizacion != null && item.fecha_finalizacion !== '' ? new Date(item.fecha_finalizacion as string) : null;
        f.estado = String(item.estado ?? '') as 'Activo' | 'Finalizado' | 'En curso';
        return f;
      });
    } catch (e) {
      throw new Error('formaciones debe ser un JSON válido (array)');
    }
  })
  @ValidateNested({ each: true })
  @IsArray()
  formaciones?: FormacionAcademicaDto[];

  // --- ESPECIALIDADES (Principal y Secundarias) ---
  @IsNotEmpty({ message: 'La especialidad principal es requerida' })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'La especialidad principal debe ser un número' })
  @Min(1, { message: 'El ID de la especialidad principal debe ser mayor a 0' })
  id_especialidad_principal!: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value !== 'string') return Array.isArray(value) ? value : [];

    // Si ya es un array, devolverlo directamente
    if (Array.isArray(value)) return value.map((id) => Number(id));

    try {
      // Intentar parsear como JSON primero (formato: "[2,3,4]" o "[2, 3, 4]")
      const parsed = JSON.parse(value);
      const arr = Array.isArray(parsed) ? parsed : [];
      return arr.map((id) => Number(id));
    } catch (e) {
      // Si falla el JSON, intentar como string separado por comas (formato: "2,3,4" o "2, 3, 4")
      const trimmed = value.trim();
      if (trimmed === '') return [];

      const arr = trimmed.split(',').map((id) => id.trim()).filter((id) => id !== '');
      if (arr.length === 0) {
        throw new Error('ids_especialidades_secundarias debe ser un JSON válido (array de números) o números separados por comas');
      }
      return arr.map((id) => Number(id));
    }
  })
  @IsArray({ message: 'Las especialidades secundarias deben ser un array' })
  @IsNumber({}, { each: true, message: 'Cada especialidad secundaria debe ser un número' })
  ids_especialidades_secundarias?: number[];

  // --- DESCRIPCIONES OPCIONALES PARA MÚLTIPLES DOCUMENTOS ---
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value !== 'string') return Array.isArray(value) ? value : [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  @IsArray()
  @IsString({ each: true })
  descripciones_documentos?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value !== 'string') return Array.isArray(value) ? value : [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  @IsArray()
  @IsString({ each: true })
  descripciones_titulos?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value !== 'string') return Array.isArray(value) ? value : [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  @IsArray()
  @IsString({ each: true })
  descripciones_certificaciones?: string[];
}