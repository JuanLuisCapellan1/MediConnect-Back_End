import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IEmailService } from '../interfaces/IEmailService';
import { RedisCacheService } from '../../infrastructure/external-services/RedisCacheService';

@injectable()
export class SolicitarCodigoRegistroUseCase {
  private readonly OTP_TTL = 900; // 15 minutos

  constructor(
    @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
    @inject('EmailService') private emailService: IEmailService,
    @inject(RedisCacheService) private redisService: RedisCacheService
  ) { }

  async execute(email: string): Promise<void> {
    // 1. Validar si el correo ya está registrado y ACTIVO
    // Esto permite re-registro si la cuenta anterior fue eliminada
    const emailActivo = await this.usuarioRepository.existeEmailActivo(email);
    if (emailActivo) {
      throw new Error('El correo ya está registrado.');
    }

    // 2. Generar código OTP
    const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Guardar en Redis
    const redisKey = `otp_registro:${email}`;
    await this.redisService.set(redisKey, codigoOTP, this.OTP_TTL);

    // 4. Enviar el código por correo
    await this.emailService.enviarCorreo(
      email,
      'Código de Registro - MediConnect',
      `Tu código de registro es: ${codigoOTP}. Este código es válido por 15 minutos.`
    );
  }
}