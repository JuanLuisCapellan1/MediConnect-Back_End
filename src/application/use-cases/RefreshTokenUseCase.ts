import { inject, injectable } from 'tsyringe';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject(AuthService) private readonly authService: AuthService,
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.authService.verificarRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Refresh token inválido o expirado');
    }

    const usuario = await this.usuarioRepository.buscarPorId(payload.userId);
    if (!usuario || (usuario as any).estado !== 'Activo') {
      throw new Error('Usuario inactivo o no encontrado');
    }

    return this.authService.generarTokensSesion(usuario.id, usuario.email, usuario.rol);
  }
}

