import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { CambiarEmailDto } from '../dtos/CambiarEmailDto';

@injectable()
export class CambiarEmailUseCase {
    constructor(
        @inject('UsuarioRepository') private usuarioRepo: IUsuarioRepository,
        @inject('PasswordHasher') private passwordHasher: IPasswordHasher
    ) { }

    async execute(usuarioId: number, dto: CambiarEmailDto): Promise<void> {
        // 1. Buscar usuario actual
        const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // 2. Verificar que tiene contraseña (no solo Google sin password)
        if (!usuario.password) {
            throw new Error('Debes establecer una contraseña antes de cambiar el email');
        }

        // 3. Verificar contraseña actual
        const passwordValida = await this.passwordHasher.compare(
            dto.password,
            usuario.password
        );
        if (!passwordValida) {
            throw new Error('Contraseña incorrecta');
        }

        // 4. Verificar que el nuevo email no sea igual al actual
        if (dto.nuevoEmail.toLowerCase() === usuario.email.toLowerCase()) {
            throw new Error('El nuevo email es igual al actual');
        }

        // 5. Verificar que el nuevo email no esté registrado
        const emailExiste = await this.usuarioRepo.buscarPorEmail(dto.nuevoEmail);
        if (emailExiste) {
            throw new Error('El email ya está registrado');
        }

        // 6. Actualizar email
        await this.usuarioRepo.actualizar(usuarioId, {
            email: dto.nuevoEmail
        } as any);
    }
}
