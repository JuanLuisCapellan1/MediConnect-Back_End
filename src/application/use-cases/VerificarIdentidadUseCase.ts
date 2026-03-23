import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';

/**
 * VerificarIdentidadUseCase
 *
 * Confirms the currently authenticated user's identity by validating their password.
 * Used before sensitive operations (e.g. change email, delete account, export data).
 *
 * Does NOT issue any token — it only returns a boolean confirmation.
 */
@injectable()
export class VerificarIdentidadUseCase {
  constructor(
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(usuarioId: number, password: string): Promise<void> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      // Do not reveal whether the user exists — uniform error
      throw new Error('Credenciales inválidas.');
    }

    if (!usuario.password) {
      throw new Error('Esta cuenta no tiene contraseña local. Inicia sesión con Google.');
    }

    const esValida = await this.passwordHasher.compare(password, usuario.password);
    if (!esValida) {
      throw new Error('Credenciales inválidas.');
    }
  }
}
