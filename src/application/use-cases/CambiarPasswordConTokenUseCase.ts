import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { validarPasswordSegura } from '../../shared/utils/PasswordPolicy';

@injectable()
export class CambiarPasswordConTokenUseCase {
  constructor(
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private readonly passwordHasher: IPasswordHasher,
    @inject(AuthService) private readonly authService: AuthService
  ) {}

  async execute(token: string, nuevaPassword: string, confirmarPassword: string): Promise<void> {
    if (nuevaPassword !== confirmarPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    validarPasswordSegura(nuevaPassword);

    const email = this.authService.validatePasswordResetToken(token);
    if (!email) {
      throw new Error('Token de cambio de contraseña inválido o expirado.');
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Usuario no encontrado.');
    }

    const hashedPassword = await this.passwordHasher.hash(nuevaPassword);
    await this.usuarioRepository.actualizar(usuario.id, { password: hashedPassword });
  }
}

