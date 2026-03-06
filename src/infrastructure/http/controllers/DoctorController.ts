import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarDoctoresUseCase } from '../../../application/use-cases/GestionarDoctoresUseCase';
import { DoctorNoEncontradoError } from '../../../domain/errors/Doctores/DoctorNoEncontradoError';
import { ExequaturYaExisteError } from '../../../domain/errors/Doctores/ExequaturYaExisteError';
import { DocumentoDoctorYaExisteError } from '../../../domain/errors/Doctores/DocumentoDoctorYaExisteError';
import { ValidationError } from 'class-validator';

// Helper function para aplanar errores de validación
function flattenValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    for (const error of errors) {
        if (error.constraints) {
            messages.push(...Object.values(error.constraints));
        }
        if (error.children && error.children.length > 0) {
            messages.push(...flattenValidationErrors(error.children));
        }
    }
    return messages;
}

export class DoctorController {
    async listar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const esPaciente = (req as any).user?.rol === 'Paciente';

            const getString = (value: any): string | undefined => {
                if (Array.isArray(value)) return value[0] as string;
                return value as string | undefined;
            };

            const filtros: any = {
                nombre: getString(req.query.nombre),
                apellido: getString(req.query.apellido),
                genero: getString(req.query.genero),
                nacionalidad: getString(req.query.nacionalidad),
                especialidadId: req.query.especialidadId ? parseInt(req.query.especialidadId as string) : undefined,
                pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
            };

            if (esPaciente) {
                // Los pacientes solo ven doctores activos y verificados
                filtros.estado = 'Activo';
                filtros.estadoVerificacion = 'Aprobado';
            } else {
                filtros.estado = getString(req.query.estado);
                filtros.estadoVerificacion = getString(req.query.estadoVerificacion);
            }

            const resultado = await useCase.listar(filtros);

            return res.status(200).json({
                success: true,
                data: resultado.datos,
                paginacion: {
                    total: resultado.total,
                    pagina: filtros.pagina || 1,
                    limite: filtros.limite || 10,
                    totalPaginas: Math.ceil(resultado.total / (filtros.limite || 10)),
                },
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async obtenerPorId(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const id = parseInt(req.params.id as string);
            const esPaciente = (req as any).user?.rol === 'Paciente';

            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            // Para pacientes usamos obtenerPerfilCompleto (datos públicos)
            // Para admins también está bien, ya que tiene más info
            const doctor = esPaciente
                ? await useCase['doctorRepository'].obtenerPerfilCompleto(id)
                : await useCase.obtenerPorId(id);

            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor no encontrado.' });
            }

            // Si es paciente, ocultamos datos sensibles
            if (esPaciente) {
                delete doctor.documentos;
                delete doctor.comentarioVerificacion;
                delete doctor.estadoAccionVerificacion;
                delete doctor.fechaResolucionVerificacion;
            }

            return res.status(200).json({
                success: true,
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async obtenerPerfil(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = req.user!.userId;

            // Obtener perfil completo directamente del repository
            const doctor = await container.resolve(GestionarDoctoresUseCase)['doctorRepository'].obtenerPerfilCompleto(usuarioId);

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor no encontrado',
                });
            }

            return res.status(200).json({
                success: true,
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = parseInt(req.params.id as string);

            const doctor = await useCase.actualizar(usuarioId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Doctor actualizado exitosamente.',
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizarPerfil(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = req.user!.userId; // Del middleware de autenticación

            // Transformar fechaNacimiento si viene en formato string
            if (req.body.fechaNacimiento && typeof req.body.fechaNacimiento === 'string') {
                req.body.fechaNacimiento = new Date(req.body.fechaNacimiento);
            }

            const doctor = await useCase.actualizar(usuarioId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente.',
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    /**
     * PUT /api/doctores/documentos/:id
     * Actualizar un documento rechazado
     */
    async actualizarDocumento(req: Request, res: Response): Promise<Response> {
        try {
            const ActualizarDocumentoDoctorUseCase = (await import('../../../application/use-cases/ActualizarDocumentoDoctorUseCase')).ActualizarDocumentoDoctorUseCase;
            const ActualizarDocumentoDoctorDto = (await import('../../../application/dtos/ActualizarDocumentoDoctorDto')).ActualizarDocumentoDoctorDto;
            const { plainToInstance } = await import('class-transformer');
            const { validate } = await import('class-validator');

            const documentoId = parseInt(req.params.id as string);
            const doctorId = req.user!.userId;

            if (isNaN(documentoId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de documento inválido',
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un archivo',
                });
            }

            const dto = plainToInstance(ActualizarDocumentoDoctorDto, {
                documentoId,
                descripcion: req.body.descripcion,
            });

            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: flattenValidationErrors(errors),
                });
            }

            const useCase = container.resolve(ActualizarDocumentoDoctorUseCase);
            await useCase.execute(doctorId, dto, req.file);

            return res.status(200).json({
                success: true,
                message: 'Documento actualizado exitosamente. Será revisado nuevamente.',
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar documento',
            });
        }
    }

    /**
     * POST /api/doctores/certificaciones
     * Agregar una nueva certificación
     */
    async agregarCertificacion(req: Request, res: Response): Promise<Response> {
        try {
            const AgregarCertificacionUseCase = (await import('../../../application/use-cases/AgregarCertificacionUseCase')).AgregarCertificacionUseCase;
            const AgregarCertificacionDto = (await import('../../../application/dtos/AgregarCertificacionDto')).AgregarCertificacionDto;
            const { plainToInstance } = await import('class-transformer');
            const { validate } = await import('class-validator');

            const doctorId = req.user!.userId;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un archivo de certificación',
                });
            }

            const dto = plainToInstance(AgregarCertificacionDto, {
                descripcion: req.body.descripcion,
            });

            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: flattenValidationErrors(errors),
                });
            }

            const useCase = container.resolve(AgregarCertificacionUseCase);
            await useCase.execute(doctorId, dto, req.file);

            return res.status(201).json({
                success: true,
                message: 'Certificación agregada exitosamente. Será revisada por un administrador.',
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al agregar certificación',
            });
        }
    }

    /**
     * GET /api/doctores/mis-documentos
     * Obtener el estado de todos los documentos del doctor
     */
    async obtenerEstadoDocumentos(req: Request, res: Response): Promise<Response> {
        try {
            const { ObtenerEstadoDocumentosDoctorUseCase } = await import('../../../application/use-cases/ObtenerEstadoDocumentosDoctorUseCase');

            const doctorId = req.user!.userId;
            const useCase = container.resolve(ObtenerEstadoDocumentosDoctorUseCase);
            const resultado = await useCase.execute(doctorId);

            return res.status(200).json({
                success: true,
                data: resultado,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener estado de documentos',
            });
        }
    }

    async eliminar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = parseInt(req.params.id as string);

            await useCase.eliminar(usuarioId);

            return res.status(200).json({
                success: true,
                message: 'Doctor eliminado exitosamente.',
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    /**
     * POST /doctores/comparar
     * Compara hasta 4 doctores seleccionados por el paciente.
     * Body: { ids: number[] }
     */
    async compararDoctores(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo "ids" debe ser un arreglo con al menos un ID de doctor.',
                });
            }

            const idsNumericos = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));

            if (idsNumericos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Los IDs proporcionados no son válidos.',
                });
            }

            const doctores = await useCase.compararDoctores(idsNumericos);

            return res.status(200).json({
                success: true,
                total: doctores.length,
                data: doctores,
            });
        } catch (error: any) {
            if (error.message?.includes('Solo se pueden comparar')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return this.manejarError(error, res);
        }
    }

    /**
     * GET /doctores/cercanos
     * Busca doctores activos y verificados dentro de un radio geográfico.
     * Query params: lat, lng, radio (km, máx 15), especialidadId?, genero?, calificacionMin?
     */
    async buscarCercanos(req: Request, res: Response): Promise<Response> {
        try {
            const lat = parseFloat(req.query.lat as string);
            const lng = parseFloat(req.query.lng as string);
            const radio = req.query.radio !== undefined ? parseFloat(req.query.radio as string) : 5;

            if (isNaN(lat) || lat < -90 || lat > 90) return res.status(400).json({ success: false, message: 'lat debe ser un número entre -90 y 90.' });
            if (isNaN(lng) || lng < -180 || lng > 180) return res.status(400).json({ success: false, message: 'lng debe ser un número entre -180 y 180.' });
            if (isNaN(radio) || radio < 0 || radio > 15) return res.status(400).json({ success: false, message: 'radio debe ser un número entre 0 y 15 km.' });

            const filtros: any = {};
            if (req.query.especialidadId) filtros.especialidadId = Number(req.query.especialidadId);
            if (req.query.genero) filtros.genero = String(req.query.genero);
            if (req.query.calificacionMin) filtros.calificacionMin = Number(req.query.calificacionMin);

            // Solo pasamos el ID del paciente loggeado para calcular esFavorito
            const esPaciente = (req as any).user?.rol === 'Paciente';
            const pacienteId = esPaciente ? (req as any).user?.userId : undefined;

            const useCase = container.resolve(GestionarDoctoresUseCase);
            const doctores = await useCase['doctorRepository'].buscarCercanos(lat, lng, radio, filtros, pacienteId);

            return res.status(200).json({
                success: true,
                total: doctores.length,
                data: doctores,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    private manejarError(error: any, res: Response): Response {
        console.error(error);

        if (error instanceof DoctorNoEncontradoError) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        if (error instanceof ExequaturYaExisteError || error instanceof DocumentoDoctorYaExisteError) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
}
