import { inject, injectable } from 'tsyringe';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';
import { AuthService } from '../../infrastructure/external-services/AuthService';

@injectable()
export class ValidarCodigoRecuperacionPasswordUseCase {
  constructor(
    @inject(RedisCacheService) private readonly redisService: RedisCacheService,
    @inject(AuthService) private readonly authService: AuthService
  ) {}

  async execute(email: string, codigo: string): Promise<string> {
    const redisKey = `otp_recuperacion:${email}`;
    const codigoGuardado = await this.redisService.get(redisKey);

    if (!codigoGuardado) {
      throw new Error('El código ha expirado o no existe.');
    }

    if (codigoGuardado !== codigo) {
      throw new Error('Código inválido.');
    }

    await this.redisService.del(redisKey);

    // Token temporal que permitirá cambiar la contraseña
    return this.authService.generarTokenRecuperacionPassword(email);
  }
}

