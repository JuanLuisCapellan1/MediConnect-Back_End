import crypto from 'crypto';
import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';

export interface LoginGoogleResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    rol: string;
    fotoPerfil?: string | null;
    paciente?: any | null;
    doctor?: any | null;
    centroSalud?: any | null;
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
      const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
      const base = (usuarioDetallado as any) ?? (usuario as any);
      const { accessToken, refreshToken } = this.authService.generarTokensSesion(
        base.id,
        base.email,
        base.rol
      );
      return {
        accessToken,
        refreshToken,
        user: this.toUserResponse(base),
      };
    }

    // 2. ¿Existe por email? -> Vincular y devolver JWT
    usuario = await this.usuarioRepository.buscarPorEmail(google.email);
    if (usuario) {
      await this.usuarioRepository.vincularCuentaSocial(usuario.id, 'Google', google.googleId);
      const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
      const base = (usuarioDetallado as any) ?? (usuario as any);
      const { accessToken, refreshToken } = this.authService.generarTokensSesion(
        base.id,
        base.email,
        base.rol
      );
      return {
        accessToken,
        refreshToken,
        user: this.toUserResponse(base),
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
    const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
    const base = (usuarioDetallado as any) ?? (usuario as any);
    const { accessToken, refreshToken } = this.authService.generarTokensSesion(
      base.id,
      base.email,
      base.rol
    );
    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(base),
    };
  }

  private toUserResponse(usuario: {
    id: number;
    email: string;
    rol: string;
    fotoPerfil?: string | null;
    foto_perfil?: string;
    paciente?: any;
    doctor?: any;
    centroSalud?: any;
  }): LoginGoogleResult['user'] {
    const foto = (usuario as any).fotoPerfil ?? (usuario as any).foto_perfil ?? undefined;
    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      fotoPerfil: foto ?? undefined,
      paciente: (usuario as any).paciente ?? null,
      doctor: (usuario as any).doctor ?? null,
      centroSalud: (usuario as any).centroSalud ?? null,
    };
  }
}
