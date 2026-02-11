import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { IStorageService } from '../interfaces/IStorageService';
import { RegistrarPacienteDto } from '../dtos/RegistrarPacienteDto';
import { AuthService } from '../../infrastructure/external-services/AuthService';

@injectable()
export class RegistrarPacienteUseCase {
  constructor(
    @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private passwordHasher: IPasswordHasher,
    @inject('StorageService') private storageService: IStorageService,
    @inject(AuthService) private authService: AuthService
  ) { }

  async execute(dto: RegistrarPacienteDto, files: any, token: string): Promise<void> {
    // Validar token y obtener email. Soportar token de registro estándar y token de registro desde Google
    let email = await this.authService.validateRegistrationToken(token);
    if (!email) {
      const googlePayload = this.authService.validateGoogleRegistrationToken(token);
      if (googlePayload) {
        email = googlePayload.email;
      }
    }

    if (!email) {
      throw new Error('Token inválido o expirado');
    }

    // Validar que no exista usuario con este email
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new Error('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await this.passwordHasher.hash(dto.password);

    try {
      // Subir archivos a Supabase (foto de perfil opcional)
      let fotoPerfilUrl: string | null = null;
      if (files.fotoPerfil?.[0]) {
        fotoPerfilUrl = await this.storageService.uploadFile(
          files.fotoPerfil[0].buffer,
          `patients/${email}/profile.jpg`,
          'public-assets',
          files.fotoPerfil[0].mimetype
        );
      }

      let fotoDocumentoPath: string | null = null;
      if (files.fotoDocumento?.[0]) {
        fotoDocumentoPath = await this.storageService.uploadFile(
          files.fotoDocumento[0].buffer,
          `patients/${email}/document.jpg`,
          'secure-documents',
          files.fotoDocumento[0].mimetype
        );
      }

      // Persistir en base de datos
      await this.usuarioRepository.savePaciente({
        email,
        password: hashedPassword,
        rol: 'Paciente',
        paciente: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          numero_documento_identificacion: dto.numero_documento,
          tipo_documento_identificacion: dto.tipo_documento,
          foto_documento: fotoDocumentoPath ?? null,
          foto_perfil: fotoPerfilUrl ?? undefined,
          fecha_nacimiento: dto.fecha_nacimiento,
          genero: dto.genero,
          altura: dto.altura,
          peso: dto.peso,
          tipo_sangre: dto.tipo_sangre,
        },
      });
    } catch (error: any) {
      // Manejar errores de overflow de base de datos
      if (error.message && error.message.includes('numeric field overflow')) {
        // Detectar qué campo causó el overflow basándose en el mensaje de error
        if (error.message.includes('precision 4, scale 2')) {
          throw new Error('La altura debe estar en metros y no puede exceder 99.99 metros. Por favor, ingresa un valor válido (ejemplo: 1.75 para 1.75 metros).');
        } else if (error.message.includes('precision 5, scale 2')) {
          throw new Error('El peso no puede exceder 999.99 kg. Por favor, ingresa un valor válido.');
        } else {
          throw new Error('Uno de los valores numéricos ingresados excede el límite permitido. Por favor, verifica que la altura esté en metros (ej: 1.75) y el peso en kilogramos (ej: 70).');
        }
      }

      // Aquí podrías implementar limpieza de archivos subidos en caso de error
      throw error;
    }
  }
}