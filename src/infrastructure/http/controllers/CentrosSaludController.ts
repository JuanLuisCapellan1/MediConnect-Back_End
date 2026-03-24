import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CompletarPerfilCentroSaludUseCase } from '../../../application/use-cases/CompletarPerfilCentroSaludUseCase';
import { CompletarPerfilCentroSaludDto } from '../../../application/dtos/CompletarPerfilCentroSaludDto';
import { RegistrarCentroUseCase } from '../../../application/use-cases/RegistrarCentroUseCase';
import { GestionarCentroSaludUseCase } from '../../../application/use-cases/GestionarCentroSaludUseCase';
import { GestionarSolicitudesAlianzaUseCase } from '../../../application/use-cases/GestionarSolicitudesAlianzaUseCase';
import { CentroSaludNoEncontradoError } from '../../../domain/errors/CentrosSalud/CentroSaludNoEncontradoError';
import { TipoCentroSaludNoEncontradoError } from '../../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError';

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  errors.forEach(e => {
    if (e.constraints) messages.push(...Object.values(e.constraints));
    if (e.children?.length) messages.push(...flattenValidationErrors(e.children));
  });
  return messages;
}

@injectable()
export class CentrosSaludController {
  constructor(
    @inject(CompletarPerfilCentroSaludUseCase)
    private completarPerfilUseCase: CompletarPerfilCentroSaludUseCase,
    @inject(RegistrarCentroUseCase)
    private registrarCentroUseCase: RegistrarCentroUseCase,
    @inject(GestionarCentroSaludUseCase)
    private gestionarCentroUseCase: GestionarCentroSaludUseCase,
    @inject(GestionarSolicitudesAlianzaUseCase)
    private solicitudesUseCase: GestionarSolicitudesAlianzaUseCase
  ) { }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/mi-perfil
  // ══════════════════════════════════════════════════════════════
  async obtenerPerfil(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.gestionarCentroUseCase.obtenerPerfil(centroId);
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/admin  (solo Administrador)
  // ══════════════════════════════════════════════════════════════
  async listarParaAdmin(req: Request, res: Response): Promise<void> {
    try {
      const filtros = {
        nombre: req.query.nombre as string | undefined,
        estadoVerificacion: req.query.estadoVerificacion as string | undefined,
        estado: req.query.estado as string | undefined,
        tipoCentroId: req.query.tipoCentroId ? Number(req.query.tipoCentroId) : undefined,
        pagina: req.query.pagina ? Number(req.query.pagina) : 1,
        limite: req.query.limite ? Number(req.query.limite) : 10,
      };

      const { datos, total } = await this.gestionarCentroUseCase.listarParaAdmin(filtros);
      const totalPaginas = Math.ceil(total / (filtros.limite || 10));

      res.status(200).json({
        success: true,
        data: datos,
        paginacion: {
          total,
          pagina: filtros.pagina,
          limite: filtros.limite,
          totalPaginas,
        },
      });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/admin/:id  (solo Administrador)
  // ══════════════════════════════════════════════════════════════
  async obtenerParaAdmin(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID inválido.' });
        return;
      }

      // Accedemos al repositorio directamente para obtener el perfil completo sin filtrar
      const repo = (this.gestionarCentroUseCase as any)['centroRepo'];
      const data = await repo.obtenerPerfilCompleto(id);

      if (!data) {
        res.status(404).json({ success: false, message: 'Centro de salud no encontrado.' });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // PUT /centros-salud/mi-perfil
  // ══════════════════════════════════════════════════════════════
  async actualizarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const dto = req.body;
      const data = await this.gestionarCentroUseCase.actualizarPerfil(centroId, dto);
      res.status(200).json({ success: true, data, message: 'Perfil actualizado exitosamente' });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // PUT /centros-salud/mi-perfil/foto
  // ══════════════════════════════════════════════════════════════
  async actualizarFoto(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const file = (req.files as Record<string, Express.Multer.File[]>)?.fotoPerfil?.[0]
        ?? (req.file as Express.Multer.File | undefined);
      if (!file) { res.status(400).json({ success: false, message: 'Se requiere una foto de perfil' }); return; }
      const data = await this.gestionarCentroUseCase.actualizarFoto(centroId, file);
      res.status(200).json({ success: true, data, message: 'Foto actualizada exitosamente' });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/mis-documentos
  // ══════════════════════════════════════════════════════════════
  async obtenerEstadoDocumentos(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      
      const { ObtenerEstadoDocumentosCentroUseCase } = await import('../../../application/use-cases/ObtenerEstadoDocumentosCentroUseCase');
      const { container } = await import('tsyringe');
      const useCase = container.resolve(ObtenerEstadoDocumentosCentroUseCase);
      
      const data = await useCase.execute(centroId);
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // PUT /centros-salud/documentos/:id
  // ══════════════════════════════════════════════════════════════
  async actualizarDocumento(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      if (!req.file) { res.status(400).json({ success: false, message: 'Se requiere el archivo de certificación sanitaria' }); return; }

      const { ActualizarDocumentoCentroUseCase } = await import('../../../application/use-cases/ActualizarDocumentoCentroUseCase');
      const { container } = await import('tsyringe');
      const useCase = container.resolve(ActualizarDocumentoCentroUseCase);

      // Usamos un dto vacío/opcional ya que el modelo asume que siempre se actualiza el certificado de sanidad del centro
      await useCase.execute(centroId, { descripcion: req.body.descripcion }, req.file);
      
      res.status(200).json({ success: true, message: 'Documento (Certificación Sanitaria) actualizado exitosamente. Será revisado nuevamente.' });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/mi-ubicacion
  // ══════════════════════════════════════════════════════════════
  async obtenerUbicacion(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.gestionarCentroUseCase.obtenerUbicacion(centroId);
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // PUT /centros-salud/mi-ubicacion
  // ══════════════════════════════════════════════════════════════
  async actualizarUbicacion(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const { barrioId, subBarrioId, direccion, codigoPostal } = req.body;
      const dto = {
        barrioId: barrioId !== undefined ? Number(barrioId) : undefined,
        subBarrioId: subBarrioId !== undefined ? (subBarrioId === null ? null : Number(subBarrioId)) : undefined,
        direccion,
        codigoPostal: codigoPostal ?? undefined,
      };
      const data = await this.gestionarCentroUseCase.actualizarUbicacion(centroId, dto);
      res.status(200).json({ success: true, data, message: 'Ubicación actualizada exitosamente' });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/mis-doctores
  // ══════════════════════════════════════════════════════════════
  async listarDoctores(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.gestionarCentroUseCase.listarDoctoresAsociados(centroId);
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // POST /centros-salud/solicitudes-alianza
  // ══════════════════════════════════════════════════════════════
  async enviarSolicitud(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const { destinatarioId, mensaje } = req.body;
      if (!destinatarioId || isNaN(Number(destinatarioId))) {
        res.status(400).json({ success: false, message: 'destinatarioId (ID del doctor) es requerido y debe ser numérico' });
        return;
      }
      const data = await this.solicitudesUseCase.enviarSolicitud(
        centroId, 'CentroSalud', { destinatarioId: Number(destinatarioId), mensaje }
      );
      res.status(201).json({ success: true, data, message: 'Solicitud de alianza enviada exitosamente' });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/solicitudes-alianza
  // ══════════════════════════════════════════════════════════════
  async listarSolicitudes(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.solicitudesUseCase.listarSolicitudes(centroId, 'CentroSalud');
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // PUT /centros-salud/solicitudes-alianza/:id
  // ══════════════════════════════════════════════════════════════
  async responderSolicitud(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const solicitudId = Number(req.params.id);
      if (isNaN(solicitudId)) { res.status(400).json({ success: false, message: 'ID de solicitud inválido' }); return; }
      const { estado, motivoRechazo } = req.body;
      if (!estado || !['Aceptada', 'Rechazada'].includes(estado)) {
        res.status(400).json({ success: false, message: 'estado debe ser Aceptada o Rechazada' });
        return;
      }
      const data = await this.solicitudesUseCase.responderSolicitud(
        solicitudId, centroId, 'CentroSalud', { estado, motivoRechazo }
      );
      res.status(200).json({ success: true, data, message: `Solicitud ${estado.toLowerCase()} exitosamente` });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // SOLICITUDES DESDE EL LADO DEL DOCTOR
  // POST /doctores/solicitudes-alianza
  // ══════════════════════════════════════════════════════════════
  async doctorEnviarSolicitud(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.user?.userId;
      if (!doctorId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const { destinatarioId, mensaje } = req.body;
      if (!destinatarioId || isNaN(Number(destinatarioId))) {
        res.status(400).json({ success: false, message: 'destinatarioId (ID del centro) es requerido y debe ser numérico' });
        return;
      }
      const data = await this.solicitudesUseCase.enviarSolicitud(
        doctorId, 'Doctor', { destinatarioId: Number(destinatarioId), mensaje }
      );
      res.status(201).json({ success: true, data, message: 'Solicitud de alianza enviada exitosamente' });
    } catch (error) { this.manejarError(error, res); }
  }

  // GET /doctores/solicitudes-alianza
  async doctorListarSolicitudes(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.user?.userId;
      if (!doctorId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.solicitudesUseCase.listarSolicitudes(doctorId, 'Doctor');
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // PUT /doctores/solicitudes-alianza/:id
  async doctorResponderSolicitud(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.user?.userId;
      if (!doctorId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const solicitudId = Number(req.params.id);
      if (isNaN(solicitudId)) { res.status(400).json({ success: false, message: 'ID de solicitud inválido' }); return; }
      const { estado, motivoRechazo } = req.body;
      if (!estado || !['Aceptada', 'Rechazada'].includes(estado)) {
        res.status(400).json({ success: false, message: 'estado debe ser Aceptada o Rechazada' });
        return;
      }
      const data = await this.solicitudesUseCase.responderSolicitud(
        solicitudId, doctorId, 'Doctor', { estado, motivoRechazo }
      );
      res.status(200).json({ success: true, data, message: `Solicitud ${estado.toLowerCase()} exitosamente` });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // Heredado: POST /centros-salud/completar-perfil
  // ══════════════════════════════════════════════════════════════
  async completarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).usuarioId;
      if (!usuarioId) {
        let authHeader = (req as any).originalAuthorization || req.headers.authorization || req.headers.Authorization;
        if (!authHeader) {
          authHeader = (req.headers as any)['authorization'] ?? (req.headers as any)['Authorization']
            ?? req.headers['x-authorization'] ?? req.headers['X-Authorization'];
        }
        let token: string | null = null;
        if (typeof authHeader === 'string') {
          const trimmed = authHeader.trim();
          token = trimmed.startsWith('Bearer ') ? trimmed.substring(7).trim() : trimmed;
        }
        if (!token) { res.status(401).json({ success: false, message: 'Token de registro no proporcionado' }); return; }
        const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};
        if (!files.certificadoSanitario?.[0]) {
          res.status(400).json({ success: false, message: 'El certificado sanitario es obligatorio' }); return;
        }
        const dtoReg = plainToInstance(CompletarPerfilCentroSaludDto, req.body, {
          enableImplicitConversion: true, excludeExtraneousValues: false,
        });
        const errorsReg = await validate(dtoReg, { forbidNonWhitelisted: false, skipMissingProperties: false });
        if (errorsReg.length > 0) {
          res.status(400).json({ success: false, message: 'Validación fallida', errors: flattenValidationErrors(errorsReg) });
          return;
        }
        await this.registrarCentroUseCase.execute(dtoReg, files, token);
        res.status(201).json({ success: true, message: 'Centro registrado exitosamente. Su solicitud está en revisión.' });
        return;
      }
      const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};
      if (!files.certificadoSanitario?.[0]) {
        res.status(400).json({ success: false, message: 'El certificado sanitario es obligatorio' }); return;
      }
      const mimesCert = ['application/pdf'];
      if (!mimesCert.includes(files.certificadoSanitario[0].mimetype)) {
        res.status(400).json({ success: false, message: 'El certificado sanitario debe ser un archivo PDF' }); return;
      }
      if (files.fotoPerfil?.[0]) {
        const mimesFoto = ['image/jpeg', 'image/png', 'image/webp'];
        if (!mimesFoto.includes(files.fotoPerfil[0].mimetype)) {
          res.status(400).json({ success: false, message: 'La foto de perfil debe ser JPG, PNG o WebP' }); return;
        }
      }
      const dto = plainToInstance(CompletarPerfilCentroSaludDto, req.body, {
        enableImplicitConversion: true, excludeExtraneousValues: false,
      });
      const errors = await validate(dto, { forbidNonWhitelisted: false, skipMissingProperties: false });
      if (errors.length > 0) {
        res.status(400).json({ success: false, message: 'Validación fallida', errors: flattenValidationErrors(errors) }); return;
      }
      const resultado = await this.completarPerfilUseCase.execute(usuarioId, dto, files);
      res.status(200).json({
        success: true, message: resultado.message,
        data: { id: resultado.id, nombreComercial: resultado.nombreComercial, estado: resultado.estado, estadoVerificacion: resultado.estadoVerificacion },
      });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/estadisticas/general
  // ══════════════════════════════════════════════════════════════
  async estadisticasGenerales(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.gestionarCentroUseCase.estadisticasGenerales(centroId);
      res.status(200).json({ success: true, data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/estadisticas/crecimiento-medicos
  // ══════════════════════════════════════════════════════════════
  async crecimientoMedicos(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
      const periodo = (req.query.periodo as string | undefined) ?? 'mes';
      if (!periodosValidos.includes(periodo)) {
        res.status(400).json({ success: false, message: `El parámetro "periodo" debe ser uno de: ${periodosValidos.join(', ')}.` });
        return;
      }
      const data = await this.gestionarCentroUseCase.crecimientoMedicos(centroId, periodo);
      res.status(200).json({ success: true, ...data });
    } catch (error) { this.manejarError(error, res); }
  }

  // ══════════════════════════════════════════════════════════════
  // GET /centros-salud/estadisticas/distribucion-especialidades
  // ══════════════════════════════════════════════════════════════
  async distribucionEspecialidades(req: Request, res: Response): Promise<void> {
    try {
      const centroId = req.user?.userId;
      if (!centroId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }
      const data = await this.gestionarCentroUseCase.distribucionEspecialidades(centroId);
      res.status(200).json({ success: true, ...data });
    } catch (error) { this.manejarError(error, res); }
  }

  private manejarError(error: any, res: Response): void {
    const e: any = error;
    if (e?.code === 'P2002') {
      const fields = Array.isArray(e.meta?.target) ? e.meta.target.join(', ') : e.meta?.target;
      res.status(409).json({ success: false, message: `Valor duplicado en campo(s): ${fields}` }); return;
    }
    if (e?.code === 'P2003') {
      res.status(400).json({ success: false, message: 'El ID proporcionado no corresponde a un registro existente.' }); return;
    }
    if (e?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Registro no encontrado' }); return;
    }
    if (error instanceof CentroSaludNoEncontradoError) {
      res.status(404).json({ success: false, message: error.message }); return;
    }
    if (error instanceof TipoCentroSaludNoEncontradoError) {
      res.status(404).json({ success: false, message: error.message }); return;
    }
    const msg: string = error?.message ?? 'Error interno del servidor';
    if (msg.includes('no encontrad') || msg.includes('no existe')) {
      res.status(404).json({ success: false, message: msg }); return;
    }
    if (msg.includes('No tienes permisos') || msg.includes('no puedes')) {
      res.status(403).json({ success: false, message: msg }); return;
    }
    if (msg.includes('ya existe') || msg.includes('Ya existe') || msg.includes('pendiente')) {
      res.status(409).json({ success: false, message: msg }); return;
    }
    if (msg.includes('requerido') || msg.includes('inválido') || msg.includes('debe')) {
      res.status(400).json({ success: false, message: msg }); return;
    }
    console.error('Error en CentrosSaludController:', error);
    res.status(500).json({ success: false, message: msg });
  }
}