import { inject, injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { ICitaRepository } from '../../domain/repositories/ICitaRepository';
import { DoctorValidator } from '../../domain/validators/Doctores/DoctorValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { ActualizarDoctorDto, FiltroDoctoresDto } from '../dtos/DoctorDtos';
import { Doctor } from '../../domain/entities/Doctor';
import { DoctorNoEncontradoError } from '../../domain/errors/Doctores/DoctorNoEncontradoError';

@injectable()
export class GestionarDoctoresUseCase {
    constructor(
        @inject('DoctorRepository')
        private doctorRepository: IDoctorRepository,
        @inject('CitaRepository')
        private citaRepository: ICitaRepository,
        @inject(DoctorValidator)
        private validator: DoctorValidator,
        @inject(EstadoValidator)
        private estadoValidator: EstadoValidator,
        @inject('PrismaClient')
        private prisma: PrismaClient
    ) { }

    async obtenerPorId(id: number): Promise<Doctor> {
        const doctor = await this.doctorRepository.obtenerPorId(id);
        if (!doctor) {
            throw new DoctorNoEncontradoError(id);
        }
        return doctor;
    }

    async obtenerPorUsuarioId(usuarioId: number): Promise<Doctor> {
        const doctor = await this.doctorRepository.obtenerPorUsuarioId(usuarioId);
        if (!doctor) {
            throw new DoctorNoEncontradoError(usuarioId);
        }
        return doctor;
    }

    async listar(filtros: FiltroDoctoresDto): Promise<{ datos: Doctor[]; total: number }> {
        // Normalizar estado si existe
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }

        // Normalizar estadoVerificacion si existe
        if (filtros.estadoVerificacion) {
            filtros.estadoVerificacion = this.normalizarEstado(filtros.estadoVerificacion);
        }

        return await this.doctorRepository.obtenerTodos(filtros);
    }

    async actualizar(usuarioId: number, dto: ActualizarDoctorDto): Promise<Doctor> {
        // Verificar que el doctor existe
        const doctor = await this.obtenerPorUsuarioId(usuarioId);

        // Normalizar estado si existe
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
        }

        // Validar campos únicos si se están actualizando
        await this.validator.validarActualizacion(usuarioId);

        let requiereRevisionAdmin = false;
        let razonRevision = '';

        console.log(`[UPDATE DOCTOR] Evaluando doctor ${usuarioId} — estadoVerificacion: ${doctor.estadoVerificacion}, estadoInfoPersonal: ${(doctor as any).estadoInfoPersonal}`);

        const infoPersonalRechazada = (doctor as any).estadoInfoPersonal === 'Rechazado';
        const cuentaRechazada = doctor.estadoVerificacion === 'Rechazado';

        if (cuentaRechazada || infoPersonalRechazada) {
            console.log(`[UPDATE DOCTOR] Re-envío tras rechazo (cuenta=${cuentaRechazada}, infoPersonal=${infoPersonalRechazada}).`);
            requiereRevisionAdmin = true;
            razonRevision = 'El doctor ha corregido su información personal tras ser rechazado previamente.';
        } else if (doctor.estadoVerificacion === 'Aprobado') {
            const nombreCambiado = dto.nombre && dto.nombre.trim() !== doctor.nombre;
            const apellidoCambiado = dto.apellido && dto.apellido.trim() !== doctor.apellido;
            console.log(`[UPDATE DOCTOR] Entró por APROBADO. Cambios -> Nombre: ${nombreCambiado}, Apellido: ${apellidoCambiado}`);
            if (nombreCambiado || apellidoCambiado) {
                requiereRevisionAdmin = true;
                razonRevision = 'El doctor, que ya estaba aprobado, ha modificado su Nombre o Apellido, requiriendo validación contra sus documentos.';
            }
        }
        console.log(`[UPDATE DOCTOR] requiereRevisionAdmin final = ${requiereRevisionAdmin}`);

        return await this.prisma.$transaction(async (tx) => {
            let estadoActualizado = dto.estado || doctor.estado;
            let estadoVerifActualizado = doctor.estadoVerificacion;

            if (requiereRevisionAdmin) {
                estadoVerifActualizado = 'En revisión';
            }

            // Realizamos la actualización en la tabla doctores usando Prisma directamente
            // o delegamos las partes posibles a la repo, pero necesitamos transaccionalidad con "Accion"
            const updatePayload: any = { actualizadoEn: new Date(), estadoVerificacion: estadoVerifActualizado };
            // Si el doctor reenvía info tras rechazo, el estadoInfoPersonal vuelve a 'Pendiente'
            if (requiereRevisionAdmin) {
                updatePayload.estadoInfoPersonal = 'Pendiente';
            }
            if (dto.nombre !== undefined) updatePayload.nombre = dto.nombre.trim();
            if (dto.apellido !== undefined) updatePayload.apellido = dto.apellido.trim();
            if (dto.fechaNacimiento !== undefined) updatePayload.fechaNacimiento = new Date(dto.fechaNacimiento);
            if (dto.nacionalidad !== undefined) updatePayload.nacionalidad = dto.nacionalidad?.trim();
            if (dto.biografia !== undefined) updatePayload.biografia = dto.biografia;
            if (dto.anosExperiencia !== undefined) updatePayload.anosExperiencia = dto.anosExperiencia;
            if (dto.duracionCitaPromedio !== undefined) updatePayload.duracionCitaPromedio = dto.duracionCitaPromedio;
            if (dto.tarifas !== undefined) updatePayload.tarifas = dto.tarifas;
            if (dto.estado !== undefined) updatePayload.estado = dto.estado;
            
            // También actualizar teléfono en Usuario si viene en el dto (dependiendo de tu lógica normal)
            if (dto.telefono !== undefined) updatePayload.usuario = { update: { telefono: dto.telefono.trim() } };

            const docActualizado = await tx.doctor.update({
                where: { usuarioId },
                data: updatePayload,
                include: { usuario: true, especialidades: { include: { especialidades: true } } }
            });

            if (requiereRevisionAdmin) {
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Registro Doctor' },
                });

                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: { nombre: 'Registro Doctor', estado: 'Activo' }
                    });
                }

                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: usuarioId,
                        detalle: 'Revisión de datos del perfil del Doctor',
                        comentarioEmisor: razonRevision,
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });
            }

            return docActualizado as any;
        });
    }

    async eliminar(usuarioId: number): Promise<void> {
        // Verificar que el doctor existe
        await this.obtenerPorUsuarioId(usuarioId);

        await this.doctorRepository.eliminar(usuarioId);
    }

    async compararDoctores(ids: number[]): Promise<any[]> {
        if (!ids || ids.length === 0) {
            throw new Error('Debe proporcionar al menos un ID de doctor.');
        }
        if (ids.length > 4) {
            throw new Error('Solo se pueden comparar hasta 4 doctores a la vez.');
        }
        return await this.doctorRepository.compararDoctores(ids);
    }

    private normalizarEstado(estado: string): string {
        if (!estado) return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }

    // ─── ESTADÍSTICAS DE DOCTOR ──────────────────────────────────────────────

    async resumenDoctor(doctorId: number) {
        return await this.citaRepository.resumenDoctor(doctorId);
    }

    async estadisticasServiciosDoctor(doctorId: number) {
        return await this.citaRepository.estadisticasServicios(doctorId);
    }

    async productividadDoctor(doctorId: number, periodo: string) {
        const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
        const p = periodosValidos.includes(periodo) ? periodo : 'mes';
        return await this.citaRepository.productividadDoctor(doctorId, p);
    }

    async serviciosMasUtilizados(doctorId: number) {
        return await this.citaRepository.serviciosMasUtilizados(doctorId);
    }
}
