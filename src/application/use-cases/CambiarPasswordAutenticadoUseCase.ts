import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { validarPasswordSegura } from '../../shared/utils/PasswordPolicy';

/**
 * CambiarPasswordAutenticadoUseCase
 *
 * Permite a un usuario ya autenticado (JWT) cambiar su contraseña.
 * Requiere la contraseña actual como verificación de identidad.
 *
 * Diferencias con CambiarPasswordConTokenUseCase:
 * - Este opera con el userId del JWT (sin token de recuperación)
 * - Requiere contraseñaActual para prevenir cambios no autorizados si el JWT sigue activo
 * - Ideal para el perfil de usuario (Settings > Cambiar contraseña)
 */
@injectable()
export class CambiarPasswordAutenticadoUseCase {
  constructor(
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    usuarioId: number,
    passwordActual: string,
    nuevaPassword: string,
    confirmarPassword: string,
  ): Promise<void> {
    // 1. Validar que las contraseñas nuevas coincidan
    if (nuevaPassword !== confirmarPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    // 2. Validar política de contraseña segura
    validarPasswordSegura(nuevaPassword);

    // 3. Buscar el usuario
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado.');
    }

    // 4. Verificar que el usuario tiene contraseña local (no solo Google)
    if (!usuario.password) {
      throw new Error('Esta cuenta no tiene contraseña local. Usa "Olvidé mi contraseña" para establecer una.');
    }

    // 5. Verificar contraseña actual
    const esValida = await this.passwordHasher.compare(passwordActual, usuario.password);
    if (!esValida) {
      throw new Error('La contraseña actual es incorrecta.');
    }

    // 6. Prevenir reutilización de la misma contraseña
    const esMismaPassword = await this.passwordHasher.compare(nuevaPassword, usuario.password);
    if (esMismaPassword) {
      throw new Error('La nueva contraseña no puede ser igual a la contraseña actual.');
    }

    // 7. Hashear y actualizar
    const hashedPassword = await this.passwordHasher.hash(nuevaPassword);
    await this.usuarioRepository.actualizar(usuarioId, { password: hashedPassword });
  }
}
