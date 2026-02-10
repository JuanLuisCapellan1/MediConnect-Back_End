import { inject, injectable } from 'tsyringe';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';

@injectable()
export class AttachPasswordToGoogleAccountUseCase {
  constructor(
    @inject(AuthService) private readonly authService: AuthService,
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private readonly passwordHasher: IPasswordHasher
  ) {}

  /**
   * Verifica el id_token de Google, busca el usuario por email y establece una contraseña local.
   * - Si el usuario no existe, lanza error.
   * - Si el usuario ya tiene contraseña, lanza error.
   * - Vincula la cuenta social si aún no está vinculada.
   */
  async execute(idToken: string, newPassword: string): Promise<void> {
    const google = await this.authService.verificarGoogleToken(idToken);
    const email = google.email;

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Usuario no encontrado para el email del id_token');
    }

    // Si el usuario ya tiene contraseña local, no permitimos sobrescribir sin flow adicional
    if (usuario.password) {
      throw new Error('El usuario ya tiene contraseña local. Use login con email y contraseña.');
    }

    // Hashear y actualizar contraseña
    const hashed = await this.passwordHasher.hash(newPassword);
    await this.usuarioRepository.actualizar(usuario.id, { password: hashed });

    // Vincular cuenta social si no existe
    const cuentaSocial = await this.usuarioRepository.buscarPorCuentaSocial('Google', google.googleId);
    if (!cuentaSocial) {
      await this.usuarioRepository.vincularCuentaSocial(usuario.id, 'Google', google.googleId);
    }
  }
}
