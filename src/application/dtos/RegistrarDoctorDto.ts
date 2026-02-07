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
  MaxDate
} from 'class-validator';

export class UbicacionDto {
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @IsString()
  direccion!: string;

  @IsNotEmpty({ message: 'El ID del barrio es requerido' })
  @Transform(({ value }) => Number(value))
  id_barrio!: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : null))
  id_sub_barrio?: number | null;
}

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
  nombre!: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
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
  nacionalidad!: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString()
  telefono!: string;

  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  @IsEnum(['Cédula', 'Pasaporte'])
  tipo_documento!: 'Cédula' | 'Pasaporte';

  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @IsString()
  numero_documento!: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password!: string;

  // --- DATOS PROFESIONALES ---
  @IsNotEmpty({ message: 'El exequatur es requerido' })
  @IsString()
  exequatur!: string;

  @IsOptional()
  @IsString()
  biografia?: string;

  // --- OBJETOS COMPLEJOS (Parseados de JSON strings en FormData) ---
  // Se construyen instancias explícitas para evitar "unknown value" en class-validator.

  @IsNotEmpty({ message: 'La ubicación es requerida' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      const raw = JSON.parse(value) as Record<string, unknown>;
      const u = new UbicacionDto();
      u.direccion = String(raw.direccion ?? '');
      u.id_barrio = Number(raw.id_barrio);
      u.id_sub_barrio = raw.id_sub_barrio != null && raw.id_sub_barrio !== '' ? Number(raw.id_sub_barrio) : null;
      return u;
    } catch (e) {
      throw new Error('ubicacion debe ser un JSON válido');
    }
  })
  @ValidateNested()
  ubicacion!: UbicacionDto;

  @IsNotEmpty({ message: 'Las formaciones académicas son requeridas' })
  @Transform(({ value }) => {
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
  formaciones!: FormacionAcademicaDto[];
}