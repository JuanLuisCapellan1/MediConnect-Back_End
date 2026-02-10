import crypto from 'crypto';
import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';

export interface LoginGoogleResult {
  accessToken?: string;
  refreshToken?: string;
  registroToken?: string;
  user?: {
    id: number;
    email: string;
    rol: string;
    fotoPerfil?: string | null;
    paciente?: any | null;
    doctor?: any | null;
    centroSalud?: any | null;
  };
  estado?: 'login' | 'registro'; // Indicador del flujo
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
    console.debug('[LoginGoogle] Google payload:', { email: google.email, googleId: google.googleId });

    // 1. ¿Ya tiene cuenta de Google vinculada?
    let usuario = await this.usuarioRepository.buscarPorCuentaSocial('Google', google.googleId);
    if (usuario) {
      console.debug('[LoginGoogle] Usuario encontrado por cuenta social (Google). id=', usuario.id);
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
        estado: 'login'
      };
    }

    // 2. ¿Existe por email? -> Vincular y devolver JWT
    usuario = await this.usuarioRepository.buscarPorEmail(google.email);
    if (usuario) {
      console.debug('[LoginGoogle] Usuario encontrado por email. Vinculando cuenta social. id=', usuario.id);
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
        estado: 'login'
      };
    }

    // 3. Usuario nuevo: generar token de registro en lugar de crear usuario básico
    // El usuario deberá elegir su tipo (Paciente/Doctor) en el siguiente paso
    const registroToken = this.authService.generarTokenRegistroGoogle(
      google.email,
      google.googleId,
      google.nombre,
      google.apellido,
      google.foto
    );
    console.debug('[LoginGoogle] Usuario nuevo. Generado registroToken para email=', google.email);

    return {
      registroToken,
      estado: 'registro'
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
