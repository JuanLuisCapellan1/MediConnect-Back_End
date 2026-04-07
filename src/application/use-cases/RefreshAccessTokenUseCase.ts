import { inject, injectable } from 'tsyringe';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export interface RefreshAccessTokenResult {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class RefreshAccessTokenUseCase {
  constructor(
    @inject(AuthService) private readonly authService: AuthService,
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository
  ) {}

  /**
   * Recibe un refreshToken y devuelve un nuevo par de tokens (access + refresh)
   * Validaciones:
   * - El refreshToken debe ser válido y del tipo 'refresh'
   * - El usuario debe existir y estar activo
   */
  async execute(refreshToken: string): Promise<RefreshAccessTokenResult> {
    const payload = this.authService.verificarRefreshToken(refreshToken);
    
    if (!payload) {
      throw new Error('Refresh token inválido o expirado');
    }

    const usuario = await this.usuarioRepository.buscarPorId(payload.userId);
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if ((usuario as any).estado !== 'Activo') {
      throw new Error('Usuario inactivo o bloqueado');
    }

    return this.authService.generarTokensSesion(usuario.id, usuario.email, usuario.rol);
  }
}