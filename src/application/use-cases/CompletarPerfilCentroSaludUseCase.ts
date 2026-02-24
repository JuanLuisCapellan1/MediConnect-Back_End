import { inject, injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { CompletarPerfilCentroSaludDto } from '../dtos/CompletarPerfilCentroSaludDto';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { IUbicacionesRepository } from '../../domain/repositories/IUbicacionesRepository';
import { ITipoCentroSaludRepository } from '../../domain/repositories/ITipoCentroSaludRepository';
import { IStorageService } from '../interfaces/IStorageService';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { CentroSaludValidator } from '../../domain/validators/CentrosSalud/CentroSaludValidator';
import { UbicacionValidator } from '../../domain/validators/Ubicaciones/UbicacionValidator';
import { CentroSaludNoEncontradoError } from '../../domain/errors/CentrosSalud/CentroSaludNoEncontradoError';
import { TipoCentroSaludNoEncontradoError } from '../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError';

export interface CompletarPerfilCentroSaludResult {
  id: number;
  nombreComercial: string;
  estado: string;
  estadoVerificacion: string;
  message: string;
}

@injectable()
export class CompletarPerfilCentroSaludUseCase {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('CentroSaludRepository')
    private centroSaludRepository: ICentroSaludRepository,
    @inject('UbicacionesRepository')
    private ubicacionesRepository: IUbicacionesRepository,
    @inject('TipoCentroSaludRepository')
    private tipoCentroSaludRepository: ITipoCentroSaludRepository,
    @inject('StorageService')
    private storageService: IStorageService,
    @inject('PasswordHasher')
    private passwordHasher: IPasswordHasher,
    @inject(CentroSaludValidator)
    private centroSaludValidator: CentroSaludValidator,
    @inject(UbicacionValidator)
    private ubicacionValidator: UbicacionValidator
  ) { }

  /**
   * Completa el perfil de un centro de salud con archivos
   */
  async execute(
    usuarioId: number,
    dto: CompletarPerfilCentroSaludDto,
    files: Record<string, Express.Multer.File[]>
  ): Promise<CompletarPerfilCentroSaludResult> {
    // ======================================================================
    // 1. VALIDACIONES PREVIAS
    // ======================================================================

    // Validar que el archivo certificado sanitario exista
    if (!files.certificadoSanitario?.[0]) {
      throw new Error('El certificado sanitario es obligatorio');
    }

    // Validar que el centro de salud existe
    const centroExistente = await this.centroSaludRepository.obtenerPorId(usuarioId);
    if (!centroExistente) {
      throw new CentroSaludNoEncontradoError(usuarioId);
    }

    // Validar que el tipo de centro existe
    const tipoCentroExistente = await this.tipoCentroSaludRepository.obtenerPorId(
      dto.tipoCentroId
    );
    if (!tipoCentroExistente) {
      throw new TipoCentroSaludNoEncontradoError(dto.tipoCentroId);
    }

    // Validar ubicación
    await this.ubicacionValidator.validarCreacion(
      dto.barrioId,
      dto.direccion
    );

    if (dto.codigoPostal) {
      this.ubicacionValidator.validarCodigoPostal(dto.codigoPostal);
    }

    if (dto.puntoGeografico) {
      this.ubicacionValidator.validarPuntoGeografico(dto.puntoGeografico);
    }

    // Validar datos con validadores
    this.centroSaludValidator.validarRNC(dto.rnc);
    this.centroSaludValidator.validarTelefono(dto.telefono);

    // ======================================================================
    // 2. SUBIR ARCHIVOS A SUPABASE
    // ======================================================================

    let certificadoUrl: string = '';
    let fotoCentroUrl: string | null = null;

    try {
      // Certificado sanitario (OBLIGATORIO)
      certificadoUrl = await this.storageService.uploadFile(
        files.certificadoSanitario[0].buffer,
        `centros-salud/${usuarioId}/certificado-sanitario.pdf`,
        'secure-documents',
        files.certificadoSanitario[0].mimetype
      );

      // Foto de perfil (OPCIONAL)
      if (files.fotoPerfil?.[0]) {
        fotoCentroUrl = await this.storageService.uploadFile(
          files.fotoPerfil[0].buffer,
          `centros-salud/${usuarioId}/perfil.jpg`,
          'public-assets',
          files.fotoPerfil[0].mimetype
        );
      }
    } catch (error) {
      console.error('Error subiendo archivos a Supabase:', error);
      throw new Error('No se pudieron subir los archivos. Intente de nuevo.');
    }

    // ======================================================================
    // 3. EJECUTAR TRANSACCIÓN ATÓMICA
    // ======================================================================

    try {
      const resultado = await this.prisma.$transaction(async (tx) => {
        // 3a. Crear o actualizar ubicación
        let ubicacion: any;

        if (centroExistente.ubicacionId) {
          // Actualizar ubicación existente
          ubicacion = await tx.ubicacion.update({
            where: { id: centroExistente.ubicacionId },
            data: {
              barrioId: dto.barrioId,
              direccion: dto.direccion.trim(),
              codigoPostal: dto.codigoPostal ? dto.codigoPostal.trim() : null,
              estado: 'Activo',
            },
          });
        } else {
          // Crear ubicación nueva
          ubicacion = await tx.ubicacion.create({
            data: {
              barrioId: dto.barrioId,
              direccion: dto.direccion.trim(),
              codigoPostal: dto.codigoPostal ? dto.codigoPostal.trim() : null,
              estado: 'Activo',
            },
          });
        }

        // Si se proporcionó un punto geográfico, guardar usando raw SQL
        if (dto.puntoGeografico) {
          await tx.$executeRaw`
            UPDATE "ubicaciones" 
            SET "punto_geografico" = ST_SetSRID(ST_GeomFromGeoJSON(${dto.puntoGeografico}::jsonb), 4326)
            WHERE "id_ubicacion" = ${ubicacion.id}
          `;
        }

        // 3b. Actualizar el CentroSalud con los datos completos
        const centroActualizado = await tx.centroSalud.update({
          where: { usuarioId },
          data: {
            nombreComercial: dto.nombreComercial.trim(),
            ...(dto.rnc && { rnc: dto.rnc.trim() }),
            tipoCentroId: dto.tipoCentroId,
            ubicacionId: ubicacion.id,
            sitio_web: dto.sitioWeb ? dto.sitioWeb.trim() : null,
            descripcion: dto.descripcion ? dto.descripcion.trim() : null,
            certificacion_sanitaria: certificadoUrl,
            estado: 'Activo',
            estadoVerificacion: 'En revisión', // Pendiente de aprobación del admin
            actualizadoEn: new Date(),
          },
          include: {
            usuario: true,
            tipoCentro: true,
            ubicacion: true,
          },
        });

        // Actualizar el usuario con teléfono, contraseña y foto
        const passwordHasheada = await this.passwordHasher.hash(dto.password);
        await tx.usuario.update({
          where: { id: usuarioId },
          data: {
            password: passwordHasheada,
            telefono: dto.telefono.trim(),
            fotoPerfil: fotoCentroUrl ?? undefined,
            actualizadoEn: new Date(),
          },
        });

        // 3c. Crear acción de auditoría/revisión para administrador
        let tipoAccion = await tx.tipoAccion.findFirst({
          where: { nombre: 'Revisión Centro de Salud' },
        });

        if (!tipoAccion) {
          tipoAccion = await tx.tipoAccion.create({
            data: {
              nombre: 'Revisión Centro de Salud',
              estado: 'Activo',
            },
          });
        }

        // Crear la acción para que el administrador revise
        await tx.accion.create({
          data: {
            tipoAccionId: tipoAccion.id,
            emisorId: usuarioId,
            detalle: `Solicitud de aprobación del centro de salud: ${dto.nombreComercial}`,
            comentarioEmisor: `Centro ubicado en ${dto.direccion}. RNC: ${dto.rnc}`,
            fechaEmision: new Date(),
            fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            estado: 'Pendiente',
          },
        });

        return centroActualizado;
      });

      return {
        id: resultado.usuarioId,
        nombreComercial: resultado.nombreComercial,
        estado: resultado.estado,
        estadoVerificacion: resultado.estadoVerificacion,
        message: 'Perfil del centro de salud completado exitosamente. Su solicitud está en revisión.',
      };
    } catch (error) {
      console.error('Error en transacción:', error);
      throw error;
    }
  }
}
