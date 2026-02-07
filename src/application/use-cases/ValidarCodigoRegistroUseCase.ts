import { inject, injectable } from 'tsyringe';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';
import { AuthService } from '../../infrastructure/external-services/AuthService';

@injectable()
export class ValidarCodigoRegistroUseCase {
  constructor(
    @inject(RedisCacheService) private redisService: RedisCacheService,
    @inject(AuthService) private authService: AuthService
  ) {}

  async execute(email: string, codigo: string): Promise<string> {
    // 1. Recuperar el código OTP de Redis
    const redisKey = `otp_registro:${email}`;
    const codigoGuardado = await this.redisService.get(redisKey);

    // 2. Validar existencia del código
    if (!codigoGuardado) {
      throw new Error('El código ha expirado o no existe.');
    }

    // 3. Validar que el código coincida
    if (codigoGuardado !== codigo) {
      throw new Error('Código inválido.');
    }

    // 4. Quemar el código (eliminar de Redis)
    await this.redisService.del(redisKey);

    // 5. Generar token de registro
    const token = this.authService.generarTokenRegistro(email);

    return token;
  }
}