import { inject, injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { IStorageService } from '../interfaces/IStorageService';
import { CompletarPerfilCentroSaludDto } from '../dtos/CompletarPerfilCentroSaludDto';
import { AuthService } from '../../infrastructure/external-services/AuthService';

@injectable()
export class RegistrarCentroUseCase {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
    @inject('CentroSaludRepository') private centroSaludRepository: ICentroSaludRepository,
    @inject('PasswordHasher') private passwordHasher: IPasswordHasher,
    @inject('StorageService') private storageService: IStorageService,
    @inject(AuthService) private authService: AuthService
  ) { }

  async execute(dto: CompletarPerfilCentroSaludDto, files: any, token: string): Promise<void> {
    // Validar token y extraer email (soporta token de Google también)
    let email = this.authService.validateRegistrationToken(token);
    if (!email) {
      const googlePayload = this.authService.validateGoogleRegistrationToken(token);
      if (googlePayload) {
        email = googlePayload.email;
      }
    }

    if (!email) {
      throw new Error('Token inválido o expirado');
    }

    // Validar que no exista usuario ACTIVO con este email
    // Esto permite re-registro si la cuenta anterior fue eliminada
    const emailActivo = await this.usuarioRepository.existeEmailActivo(email);
    if (emailActivo) {
      throw new Error('El email ya está registrado');
    }

    if (!files.certificadoSanitario?.[0]) {
      throw new Error('El certificado sanitario es obligatorio');
    }

    const hashedPassword = await this.passwordHasher.hash(dto.password);

    // Subir archivos
    let certificadoUrl = '';
    let fotoPerfilUrl: string | null = null;
    try {
      certificadoUrl = await this.storageService.uploadFile(
        files.certificadoSanitario[0].buffer,
        `centros-salud/${email}/certificado-sanitario.pdf`,
        'secure-documents',
        files.certificadoSanitario[0].mimetype
      );

      if (files.fotoPerfil?.[0]) {
        fotoPerfilUrl = await this.storageService.uploadFile(
          files.fotoPerfil[0].buffer,
          `centros-salud/${email}/perfil.jpg`,
          'public-assets',
          files.fotoPerfil[0].mimetype
        );
      }
    } catch (error) {
      throw new Error('No se pudieron subir los archivos. Intente de nuevo.');
    }

    // Persistir en transacción: usuario, ubicacion, centro y acción de auditoría
    await this.prisma.$transaction(async (tx) => {
      // CREAR O REACTIVAR USUARIO
      const usuarioEliminado = await tx.usuario.findFirst({
        where: {
          email,
          estado: 'Eliminado',
        },
      });

      let usuario;
      if (usuarioEliminado) {
        // Reactivar usuario eliminado
        usuario = await tx.usuario.update({
          where: { id: usuarioEliminado.id },
          data: {
            password: hashedPassword,
            rol: 'Centro',
            estado: 'Activo',
            emailVerificado: true,
            telefono: dto.telefono,
            fotoPerfil: fotoPerfilUrl,
            actualizadoEn: new Date(),
          },
        });
      } else {
        // Crear nuevo usuario
        usuario = await tx.usuario.create({
          data: {
            email,
            password: hashedPassword,
            rol: 'Centro',
            estado: 'Activo',
            emailVerificado: true,
            telefono: dto.telefono,
            fotoPerfil: fotoPerfilUrl,
            creadoEn: new Date(),
          },
        });
      }

      const ubicacion = await tx.ubicacion.create({
        data: {
          direccion: dto.direccion,
          barrioId: dto.barrioId,
          subBarrioId: dto.subBarrioId ?? null,
          estado: 'Activo',
          creadoEn: new Date(),
        },
      });

      // CREAR O REACTIVAR CENTRO SALUD
      const centroEliminado = await tx.centroSalud.findFirst({
        where: { usuarioId: usuario.id },
      });

      if (centroEliminado) {
        // Reactivar centro de salud eliminado
        await tx.centroSalud.update({
          where: { usuarioId: usuario.id },
          data: {
            nombreComercial: dto.nombreComercial,
            rnc: dto.rnc ?? '',
            tipoCentroId: dto.tipoCentroId,
            ubicacionId: ubicacion.id,
            sitio_web: dto.sitioWeb ?? null,
            descripcion: dto.descripcion ?? null,
            certificacion_sanitaria: certificadoUrl,
            estado: 'Activo',
            estadoVerificacion: 'En revisión',
            actualizadoEn: new Date(),
          },
        });
      } else {
        // Crear nuevo centro de salud
        await tx.centroSalud.create({
          data: {
            usuarioId: usuario.id,
            nombreComercial: dto.nombreComercial,
            rnc: dto.rnc ?? '',
            tipoCentroId: dto.tipoCentroId,
            ubicacionId: ubicacion.id,
            sitio_web: dto.sitioWeb ?? null,
            descripcion: dto.descripcion ?? null,
            certificacion_sanitaria: certificadoUrl,
            estado: 'Activo',
            estadoVerificacion: 'En revisión',
            creadoEn: new Date(),
          },
        });
      }

      let tipoAccion = await tx.tipoAccion.findFirst({ where: { nombre: 'Revisión Centro de Salud' } });
      if (!tipoAccion) {
        tipoAccion = await tx.tipoAccion.create({ data: { nombre: 'Revisión Centro de Salud', estado: 'Activo' } });
      }

      await tx.accion.create({
        data: {
          tipoAccionId: tipoAccion.id,
          emisorId: usuario.id,
          detalle: `Solicitud de registro del centro: ${dto.nombreComercial}`,
          comentarioEmisor: `Dirección: ${dto.direccion}. RNC: ${dto.rnc ?? 'N/A'}`,
          fechaEmision: new Date(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          estado: 'Pendiente',
        },
      });
    });
  }
}
