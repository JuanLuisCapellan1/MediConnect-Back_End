import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EliminarCuentaDto {
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @IsString({ message: 'La contraseña debe ser un texto' })
    password: string;

    @IsNotEmpty({ message: 'La confirmación es requerida' })
    @IsString({ message: 'La confirmación debe ser un texto' })
    confirmacion: string;

    constructor(password: string, confirmacion: string) {
        this.password = password;
        this.confirmacion = confirmacion;
    }

    /**
     * Valida que la confirmación sea exactamente "ELIMINAR CUENTA"
     */
    validarConfirmacion(): boolean {
        return this.confirmacion === 'ELIMINAR CUENTA';
    }
}
