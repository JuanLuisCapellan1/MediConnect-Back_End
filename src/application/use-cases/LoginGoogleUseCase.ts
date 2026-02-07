import crypto from 'crypto';
import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';

export interface LoginGoogleResult {
  token: string;
  user: {
    id: number;
    email: string;
    rol: string;
    fotoPerfil?: string | null;
  };
}

@injectable()
export class LoginGoogleUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly authService: AuthService,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(idToken: string): Promise<LoginGoogleResult> {
    const google = await this.authService.verificarGoogleToken(idToken);

    // 1. ¿Ya tiene cuenta de Google vinculada?
    let usuario = await this.usuarioRepository.buscarPorCuentaSocial('Google', google.googleId);
    if (usuario) {
      const token = this.authService.generarTokenSesion(usuario.id, usuario.email, usuario.rol);
      return {
        token,
        user: this.toUserResponse(usuario),
      };
    }

    // 2. ¿Existe por email? -> Vincular y devolver JWT
    usuario = await this.usuarioRepository.buscarPorEmail(google.email);
    if (usuario) {
      await this.usuarioRepository.vincularCuentaSocial(usuario.id, 'Google', google.googleId);
      const token = this.authService.generarTokenSesion(usuario.id, usuario.email, usuario.rol);
      return {
        token,
        user: this.toUserResponse(usuario),
      };
    }

    // 3. Usuario nuevo: crear básico + vincular
    const passwordAleatoria = crypto.randomBytes(32).toString('hex');
    const passwordHasheada = await this.passwordHasher.hash(passwordAleatoria);
    usuario = await this.usuarioRepository.crearUsuarioBasico({
      email: google.email,
      password: passwordHasheada,
      nombre: google.nombre,
      apellido: google.apellido,
      foto: google.foto,
    });
    await this.usuarioRepository.vincularCuentaSocial(usuario.id, 'Google', google.googleId);
    const token = this.authService.generarTokenSesion(usuario.id, usuario.email, usuario.rol);
    return {
      token,
      user: this.toUserResponse(usuario),
    };
  }

  private toUserResponse(usuario: { id: number; email: string; rol: string; fotoPerfil?: string | null; foto_perfil?: string }): LoginGoogleResult['user'] {
    const foto = (usuario as any).fotoPerfil ?? (usuario as any).foto_perfil ?? undefined;
    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      fotoPerfil: foto ?? undefined,
    };
  }
}
