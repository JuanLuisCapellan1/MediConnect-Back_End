import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { IStorageService } from '../interfaces/IStorageService';
import { RegistrarDoctorDto } from '../dtos/RegistrarDoctorDto';
import { AuthService } from '../../infrastructure/external-services/AuthService';

@injectable()
export class RegistrarDoctorUseCase {
  constructor(
    @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private passwordHasher: IPasswordHasher,
    @inject('StorageService') private storageService: IStorageService,
    @inject(AuthService) private authService: AuthService
  ) {}

  async execute(dto: RegistrarDoctorDto, files: any, token: string): Promise<void> {
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
      // Subir archivos a Supabase
      const fotoPerfilUrl = await this.storageService.uploadFile(
        files.fotoPerfil[0].buffer,
        `doctors/${email}/profile.jpg`,
        'public-assets',
        files.fotoPerfil[0].mimetype
      );

      const fotoDocumentoPath = await this.storageService.uploadFile(
        files.fotoDocumento[0].buffer,
        `doctors/${email}/document.jpg`,
        'secure-documents',
        files.fotoDocumento[0].mimetype
      );

      const tituloAcademicoPath = await this.storageService.uploadFile(
        files.tituloAcademico[0].buffer,
        `doctors/${email}/titulo.pdf`,
        'secure-documents',
        files.tituloAcademico[0].mimetype
      );

      const certificacionesPath = await this.storageService.uploadFile(
        files.certificaciones[0].buffer,
        `doctors/${email}/certificaciones.pdf`,
        'secure-documents',
        files.certificaciones[0].mimetype
      );

      // Persistir en base de datos (transacción atómica). Exequatur es solo el número (texto), no un archivo.
      await this.usuarioRepository.saveDoctor({
        email,
        password: hashedPassword,
        rol: 'Doctor',
        doctor: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          genero: dto.genero,
          fecha_nacimiento: dto.fecha_nacimiento,
          nacionalidad: dto.nacionalidad,
          telefono: dto.telefono,
          tipo_documento_identificacion: dto.tipo_documento,
          numero_documento_identificacion: dto.numero_documento,
          foto_documento: fotoDocumentoPath,
          foto_perfil: fotoPerfilUrl,
          exequatur: dto.exequatur,
          biografia: dto.biografia || '',
          titulo_academico: tituloAcademicoPath,
          certificaciones_adicionales: certificacionesPath,
          estado_verificacion: 'En revisión',
        },
        ubicacion: dto.ubicacion,
        formaciones: dto.formaciones,
      });
    } catch (error) {
      // Aquí podrías implementar limpieza de archivos subidos en caso de error
      throw error;
    }
  }
}