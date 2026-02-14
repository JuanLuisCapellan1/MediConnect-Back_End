import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarCondicionesMedicasUseCase } from '../../../application/use-cases/GestionarCondicionesMedicasUseCase';
import {
    FiltroCondicionesMedicasDto,
    FiltroCondicionesPacienteDto
} from '../../../application/dtos/CondicionMedicaDtos';

@injectable()
export class CondicionMedicaController {
    constructor(
        @inject(GestionarCondicionesMedicasUseCase)
        private useCase: GestionarCondicionesMedicasUseCase
    ) { }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const { nombre, descripcion, tipo } = req.body;
            const datos = await this.useCase.crear({ nombre, descripcion, tipo });
            res.status(201).json({
                success: true,
                message: 'Condición médica creada exitosamente.',
                data: datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtener(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const datos = await this.useCase.obtenerPorId(Number(id));
            res.status(200).json({
                success: true,
                data: datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async listar(req: Request, res: Response): Promise<void> {
        try {
            const filtros: FiltroCondicionesMedicasDto = {
                nombre: req.query.nombre as string,
                tipo: req.query.tipo as string,
                estado: req.query.estado as string,
                pagina: req.query.pagina ? Number(req.query.pagina) : 1,
                limite: req.query.limite ? Number(req.query.limite) : 10,
            };

            const { datos, total } = await this.useCase.listar(filtros);
            const totalPaginas = Math.ceil(total / (filtros.limite || 10));

            res.status(200).json({
                success: true,
                data: datos,
                paginacion: {
                    total,
                    pagina: filtros.pagina || 1,
                    limite: filtros.limite || 10,
                    totalPaginas,
                },
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { nombre, descripcion, tipo, estado } = req.body;
            const datos = await this.useCase.actualizar(Number(id), {
                nombre,
                descripcion,
                tipo,
                estado,
            });
            res.status(200).json({
                success: true,
                message: 'Condición médica actualizada exitosamente.',
                data: datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminar(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await this.useCase.eliminar(Number(id));
            res.status(200).json({
                success: true,
                message: 'Condición médica eliminada exitosamente.',
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // Métodos para gestión de condiciones de pacientes
    async asignarAPaciente(req: Request, res: Response): Promise<void> {
        try {
            const { condicionId, pacienteId } = req.params;
            const { notas } = req.body;

            const datos = await this.useCase.asignarAPaciente({
                pacienteId: Number(pacienteId),
                condicionId: Number(condicionId),
                notas,
            });

            res.status(201).json({
                success: true,
                message: 'Condición asignada al paciente exitosamente.',
                data: datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerCondicionesPaciente(req: Request, res: Response): Promise<void> {
        try {
            const { pacienteId } = req.params;
            const filtros: FiltroCondicionesPacienteDto = {
                tipo: req.query.tipo as string,
                estado: req.query.estado as string,
            };

            const datos = await this.useCase.obtenerCondicionesPaciente(
                Number(pacienteId),
                filtros
            );

            res.status(200).json({
                success: true,
                data: datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async actualizarCondicionPaciente(req: Request, res: Response): Promise<void> {
        try {
            const { pacienteId, condicionId } = req.params;
            const { notas, estado } = req.body;

            const datos = await this.useCase.actualizarCondicionPaciente(
                Number(pacienteId),
                Number(condicionId),
                { notas, estado }
            );

            res.status(200).json({
                success: true,
                message: 'Condición del paciente actualizada exitosamente.',
                data: datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async removerCondicionPaciente(req: Request, res: Response): Promise<void> {
        try {
            const { pacienteId, condicionId } = req.params;

            await this.useCase.removerCondicionPaciente(
                Number(pacienteId),
                Number(condicionId)
            );

            res.status(200).json({
                success: true,
                message: 'Condición removida del paciente exitosamente.',
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // Métodos para Pacientes
    async listarAlergiasDisponibles(req: Request, res: Response): Promise<void> {
        try {
            const { datos, total } = await this.useCase.obtenerAlergias();
            res.json({
                success: true,
                data: datos,
                total
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async buscarAlergias(req: Request, res: Response): Promise<void> {
        try {
            const query = req.query.q as string;
            const limite = req.query.limite ? parseInt(req.query.limite as string) : undefined;

            const alergias = await this.useCase.buscarAlergias({ query, limite });
            res.json({
                success: true,
                data: alergias
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async agregarMiAlergia(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const { condicionId, notas } = req.body;

            const alergia = await this.useCase.agregarMiAlergia(pacienteId, {
                condicionId,
                notas
            });

            res.status(201).json({
                success: true,
                message: 'Alergia agregada exitosamente.',
                data: alergia
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async crearMiCondicion(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const { notas } = req.body;

            const condicion = await this.useCase.crearMiCondicion(pacienteId, { notas });

            res.status(201).json({
                success: true,
                message: 'Condición creada exitosamente.',
                data: condicion
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerMisCondiciones(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const tipo = req.query.tipo as string;
            const estado = req.query.estado as string;

            const condiciones = await this.useCase.obtenerMisCondiciones(pacienteId, {
                tipo,
                estado
            });

            res.json({
                success: true,
                data: condiciones
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async actualizarMiAlergia(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const condicionId = parseInt(idParam);
            const { notas, estado } = req.body;

            const alergia = await this.useCase.actualizarMiAlergia(
                pacienteId,
                condicionId,
                { notas, estado }
            );

            res.json({
                success: true,
                message: 'Alergia actualizada exitosamente.',
                data: alergia
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminarMiAlergia(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const condicionId = parseInt(idParam);

            await this.useCase.eliminarMiAlergia(pacienteId, condicionId);

            res.json({
                success: true,
                message: 'Alergia eliminada exitosamente de tu perfil.'
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async actualizarMiCondicion(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const condicionId = parseInt(idParam);
            const { notas, estado } = req.body;

            const condicion = await this.useCase.actualizarMiCondicion(
                pacienteId,
                condicionId,
                { notas, estado }
            );

            res.json({
                success: true,
                message: 'Condición actualizada exitosamente.',
                data: condicion
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminarMiCondicion(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user!.userId;
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const condicionId = parseInt(idParam);

            await this.useCase.eliminarMiCondicion(pacienteId, condicionId);

            res.json({
                success: true,
                message: 'Condición eliminada exitosamente de tu perfil.'
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    private manejarError(error: any, res: Response): void {
        if (error.name === 'CondicionMedicaYaExisteError') {
            res.status(409).json({ success: false, message: error.message });
        } else if (error.name === 'CondicionMedicaNoEncontradaError') {
            res.status(404).json({ success: false, message: error.message });
        } else if (error.name === 'VerificarValor') {
            res.status(400).json({ success: false, message: error.message });
        } else if (error.message.includes('ya está asignada') ||
            error.message.includes('no está asignada') ||
            error.message.includes('ya está registrada') ||
            error.message.includes('no existe en tu perfil') ||
            error.message.includes('no es una alergia')) {
            res.status(400).json({ success: false, message: error.message });
        } else {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Ocurrió un error interno en el servidor.',
            });
        }
    }
}
