import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO para el formulario de contacto público.
 * POST /contacto/enviar
 */
export class ContactarSoporteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  nombre!: string;

  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  @IsNotEmpty({ message: 'El correo es requerido.' })
  correo!: string;

  @IsString()
  @IsNotEmpty({ message: 'El asunto es requerido.' })
  @MaxLength(150, { message: 'El asunto no puede superar los 150 caracteres.' })
  asunto!: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es requerido.' })
  @MaxLength(2000, { message: 'El mensaje no puede superar los 2000 caracteres.' })
  mensaje!: string;
}

/**
 * DTO para la suscripción al newsletter.
 * POST /contacto/newsletter
 */
export class SuscribirseNewsletterDto {
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  @IsNotEmpty({ message: 'El correo es requerido.' })
  correo!: string;
}
