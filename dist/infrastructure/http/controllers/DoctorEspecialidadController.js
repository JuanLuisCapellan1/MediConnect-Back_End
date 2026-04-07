"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorEspecialidadController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarDoctorEspecialidadesUseCase_1 = require("../../../application/use-cases/GestionarDoctorEspecialidadesUseCase");
class DoctorEspecialidadController {
    /**
     * GET /doctores/especialidades
     * Listar todas las especialidades del doctor autenticado
     */
    async obtener(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctorEspecialidadesUseCase_1.GestionarDoctorEspecialidadesUseCase);
            const doctorId = req.user.userId;
            const especialidades = await useCase.obtenerPorDoctor(doctorId);
            return res.status(200).json({
                success: true,
                data: especialidades,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    /**
     * PUT /doctores/especialidades
     * Reemplazar configuración completa de especialidades (principal + secundarias)
     */
    async actualizar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctorEspecialidadesUseCase_1.GestionarDoctorEspecialidadesUseCase);
            const doctorId = req.user.userId;
            const dto = req.body;
            if (!dto.id_especialidad_principal) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo id_especialidad_principal es requerido.',
                });
            }
            const especialidades = await useCase.actualizarEspecialidades(doctorId, dto);
            return res.status(200).json({
                success: true,
                message: 'Especialidades actualizadas exitosamente.',
                data: especialidades,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    /**
     * PATCH /doctores/especialidades/:id_especialidad
     * Cambiar cuál especialidad es la principal
     */
    async cambiarPrincipal(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctorEspecialidadesUseCase_1.GestionarDoctorEspecialidadesUseCase);
            const doctorId = req.user.userId;
            const idEspecialidad = parseInt(req.params.id_especialidad);
            if (isNaN(idEspecialidad)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID de la especialidad debe ser un número válido.',
                });
            }
            const especialidades = await useCase.cambiarPrincipal(doctorId, idEspecialidad);
            return res.status(200).json({
                success: true,
                message: 'Especialidad principal actualizada exitosamente.',
                data: especialidades,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    /**
     * DELETE /doctores/especialidades/:id_especialidad
     * Eliminar una especialidad secundaria
     */
    async eliminar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctorEspecialidadesUseCase_1.GestionarDoctorEspecialidadesUseCase);
            const doctorId = req.user.userId;
            const idEspecialidad = parseInt(req.params.id_especialidad);
            if (isNaN(idEspecialidad)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID de la especialidad debe ser un número válido.',
                });
            }
            await useCase.eliminarSecundaria(doctorId, idEspecialidad);
            return res.status(200).json({
                success: true,
                message: 'Especialidad eliminada exitosamente.',
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        if (error.name === 'DoctorEspecialidadNoEncontradaError') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.name === 'EspecialidadPrincipalRequeridaError') {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error.name === 'EspecialidadNoEncontradaError') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message?.includes('no puede estar también en las secundarias')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'La especialidad ya está asociada a este doctor.',
            });
        }
        console.error('Error en DoctorEspecialidadController:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
            error: error.message,
        });
    }
}
exports.DoctorEspecialidadController = DoctorEspecialidadController;
