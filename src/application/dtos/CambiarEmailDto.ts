import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarEmailDto {
    @IsEmail({}, { message: 'El email debe ser válido' })
    @IsNotEmpty({ message: 'El nuevo email es requerido' })
    nuevoEmail: string;

    @IsString({ message: 'La contraseña debe ser un texto' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;

    constructor(nuevoEmail: string, password: string) {
        this.nuevoEmail = nuevoEmail;
        this.password = password;
    }
}
