import { inject, injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { EspecialidadNoEncontradaError } from '../../domain/errors/Especialidades/EspecialidadNoEncontradaError';
import { DoctorEspecialidadNoEncontradaError } from '../../domain/errors/Especialidades/DoctorEspecialidadNoEncontradaError';
import { EspecialidadPrincipalRequeridaError } from '../../domain/errors/Especialidades/EspecialidadPrincipalRequeridaError';
import {
    ActualizarEspecialidadesDoctorDto,
    EspecialidadDoctorResultadoDto,
} from '../dtos/EspecialidadDtos';

@injectable()
export class GestionarDoctorEspecialidadesUseCase {
    constructor(
        @inject('PrismaClient')
        private prisma: PrismaClient
    ) { }

    /**
     * Retorna todas las especialidades del doctor autenticado
     */
    async obtenerPorDoctor(doctorId: number): Promise<EspecialidadDoctorResultadoDto[]> {
        const registros = await this.prisma.doctorEspecialidad.findMany({
            where: {
                id_doctor: doctorId,
                estado: { not: 'Eliminado' },
            },
            include: {
                especialidades: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                    },
                },
            },
            orderBy: [
                { es_principal: 'desc' }, // Principal primero
                { creado_en: 'asc' },
            ],
        });

        return registros.map((r) => ({
            id_especialidad: r.id_especialidad,
            nombre: r.especialidades.nombre,
            descripcion: r.especialidades.descripcion,
            es_principal: r.es_principal,
            estado: r.estado,
            creado_en: r.creado_en,
            actualizado_en: r.actualizado_en,
        }));
    }

    /**
     * Reemplaza toda la configuración de especialidades del doctor en una transacción atómica.
     * - Marca como Eliminado las especialidades que ya no estén en la nueva lista.
     * - Crea las que sean nuevas.
     * - Actualiza es_principal en todas.
     */
    async actualizarEspecialidades(
        doctorId: number,
        dto: ActualizarEspecialidadesDoctorDto
    ): Promise<EspecialidadDoctorResultadoDto[]> {
        const { id_especialidad_principal, ids_especialidades_secundarias = [] } = dto;

        // Validar que no haya duplicados entre principal y secundarias
        if (ids_especialidades_secundarias.includes(id_especialidad_principal)) {
            throw new Error('La especialidad principal no puede estar también en las secundarias.');
        }

        const todosLosIds = [id_especialidad_principal, ...ids_especialidades_secundarias];

        // Verificar que todas las especialidades existen en el catálogo
        const especialidadesExistentes = await this.prisma.especialidad.findMany({
            where: { id: { in: todosLosIds }, estado: { not: 'Eliminado' } },
            select: { id: true },
        });

        if (especialidadesExistentes.length !== todosLosIds.length) {
            const encontradosIds = especialidadesExistentes.map((e) => e.id);
            const noEncontrado = todosLosIds.find((id) => !encontradosIds.includes(id));
            throw new EspecialidadNoEncontradaError(noEncontrado!);
        }

        await this.prisma.$transaction(async (tx) => {
            // Obtener especialidades actuales del doctor
            const actuales = await tx.doctorEspecialidad.findMany({
                where: { id_doctor: doctorId, estado: { not: 'Eliminado' } },
                select: { id_especialidad: true },
            });
            const actualesIds = actuales.map((a) => a.id_especialidad);

            // Eliminar lógicamente las que ya no están en la nueva lista
            const aEliminar = actualesIds.filter((id) => !todosLosIds.includes(id));
            if (aEliminar.length > 0) {
                await tx.doctorEspecialidad.updateMany({
                    where: { id_doctor: doctorId, id_especialidad: { in: aEliminar } },
                    data: { estado: 'Eliminado', actualizado_en: new Date() },
                });
            }

            // Upsert de cada especialidad nueva
            for (const idEsp of todosLosIds) {
                const esPrincipal = idEsp === id_especialidad_principal;
                const existeActual = actualesIds.includes(idEsp);

                if (existeActual) {
                    // Actualizar es_principal y reactivar si estaba eliminada
                    await tx.doctorEspecialidad.update({
                        where: { id_doctor_id_especialidad: { id_doctor: doctorId, id_especialidad: idEsp } },
                        data: {
                            es_principal: esPrincipal,
                            estado: 'Activo',
                            actualizado_en: new Date(),
                        },
                    });
                } else {
                    // Crear nueva
                    await tx.doctorEspecialidad.create({
                        data: {
                            id_doctor: doctorId,
                            id_especialidad: idEsp,
                            es_principal: esPrincipal,
                            estado: 'Activo',
                            creado_en: new Date(),
                        },
                    });
                }
            }
        });

        return this.obtenerPorDoctor(doctorId);
    }

    /**
     * Cambia cuál especialidad es la principal del doctor.
     * La anterior principal pasa automáticamente a secundaria.
     */
    async cambiarPrincipal(
        doctorId: number,
        idEspecialidadNuevaPrincipal: number
    ): Promise<EspecialidadDoctorResultadoDto[]> {
        // Verificar que la especialidad está asociada al doctor y activa
        const registro = await this.prisma.doctorEspecialidad.findFirst({
            where: {
                id_doctor: doctorId,
                id_especialidad: idEspecialidadNuevaPrincipal,
                estado: 'Activo',
            },
        });

        if (!registro) {
            throw new DoctorEspecialidadNoEncontradaError(idEspecialidadNuevaPrincipal);
        }

        if (registro.es_principal) {
            // Ya es la principal, no hace nada pero retorna la lista
            return this.obtenerPorDoctor(doctorId);
        }

        await this.prisma.$transaction(async (tx) => {
            // Desmarcar la actual principal
            await tx.doctorEspecialidad.updateMany({
                where: { id_doctor: doctorId, es_principal: true },
                data: { es_principal: false, actualizado_en: new Date() },
            });

            // Marcar la nueva principal
            await tx.doctorEspecialidad.update({
                where: {
                    id_doctor_id_especialidad: {
                        id_doctor: doctorId,
                        id_especialidad: idEspecialidadNuevaPrincipal,
                    },
                },
                data: { es_principal: true, actualizado_en: new Date() },
            });
        });

        return this.obtenerPorDoctor(doctorId);
    }

    /**
     * Elimina lógicamente una especialidad SECUNDARIA del doctor.
     * No se permite eliminar la principal directamente.
     */
    async eliminarSecundaria(
        doctorId: number,
        idEspecialidad: number
    ): Promise<void> {
        const registro = await this.prisma.doctorEspecialidad.findFirst({
            where: {
                id_doctor: doctorId,
                id_especialidad: idEspecialidad,
                estado: 'Activo',
            },
        });

        if (!registro) {
            throw new DoctorEspecialidadNoEncontradaError(idEspecialidad);
        }

        if (registro.es_principal) {
            throw new EspecialidadPrincipalRequeridaError(
                'No puedes eliminar la especialidad principal. Primero asigna otra especialidad como principal.'
            );
        }

        await this.prisma.doctorEspecialidad.update({
            where: {
                id_doctor_id_especialidad: {
                    id_doctor: doctorId,
                    id_especialidad: idEspecialidad,
                },
            },
            data: { estado: 'Eliminado', actualizado_en: new Date() },
        });
    }
}
