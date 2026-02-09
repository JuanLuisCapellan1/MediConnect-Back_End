import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IEmailService } from '../interfaces/IEmailService';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';

@injectable()
export class SolicitarRecuperacionPasswordUseCase {
  private readonly OTP_TTL = 900; // 15 minutos

  constructor(
    @inject('UsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    @inject('EmailService') private readonly emailService: IEmailService,
    @inject(RedisCacheService) private readonly redisService: RedisCacheService
  ) {}

  async execute(email: string): Promise<void> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('No existe un usuario registrado con este correo.');
    }

    const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `otp_recuperacion:${email}`;
    await this.redisService.set(redisKey, codigoOTP, this.OTP_TTL);

    await this.emailService.enviarCorreo(
      email,
      'Recuperación de contraseña - MediConnect',
      `Tu código para cambiar la contraseña es: ${codigoOTP}. Este código es válido por 15 minutos.`
    );
  }
}

