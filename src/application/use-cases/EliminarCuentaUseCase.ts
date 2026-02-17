import { injectable, inject } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { EliminarCuentaDto } from '../dtos/EliminarCuentaDto';

@injectable()
export class EliminarCuentaUseCase {
    constructor(
        @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
        @inject('PasswordHasher') private passwordHasher: IPasswordHasher
    ) { }

    async execute(usuarioId: number, dto: EliminarCuentaDto): Promise<void> {
        // 1. Obtener el usuario
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // 2. Verificar que la confirmación sea correcta
        if (!dto.validarConfirmacion()) {
            throw new Error('La confirmación debe ser exactamente "ELIMINAR CUENTA"');
        }

        // 3. Verificar password (solo si el usuario tiene password)
        if (usuario.password) {
            const passwordValido = await this.passwordHasher.compare(
                dto.password,
                usuario.password
            );
            if (!passwordValido) {
                throw new Error('Contraseña incorrecta');
            }
        } else {
            // Usuario de Google sin password
            throw new Error(
                'Debes establecer una contraseña antes de eliminar tu cuenta. ' +
                'Usa el endpoint de "Establecer contraseña para cuenta de Google"'
            );
        }

        // 4. Realizar soft delete en cascada
        await this.usuarioRepository.eliminarCuenta(usuarioId);
    }
}
