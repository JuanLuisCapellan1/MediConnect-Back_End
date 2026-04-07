"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSeguroMedicoRepository = void 0;
const SeguroMedico_1 = require("../../domain/entities/SeguroMedico");
class PrismaSeguroMedicoRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ============================================
    // Admin - CRUD completo
    // ============================================
    async crear(datos) {
        const seguro = await this.prisma.seguroMedico.create({
            data: {
                nombre: datos.nombre,
                urlImage: datos.urlImage || null,
                estado: 'Activo',
            },
        });
        return this.mapearSeguroMedico(seguro);
    }
    async obtenerPorId(id) {
        const seguro = await this.prisma.seguroMedico.findUnique({
            where: { id },
        });
        return seguro ? this.mapearSeguroMedico(seguro) : null;
    }
    async obtenerTodos(filtros) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const skip = (pagina - 1) * limite;
        const where = {};
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        const [seguros, total] = await Promise.all([
            this.prisma.seguroMedico.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.seguroMedico.count({ where }),
        ]);
        return {
            datos: seguros.map((s) => this.mapearSeguroMedico(s)),
            total,
        };
    }
    async actualizar(id, datos) {
        const seguro = await this.prisma.seguroMedico.update({
            where: { id },
            data: {
                ...(datos.nombre && { nombre: datos.nombre }),
                ...(datos.urlImage !== undefined && { urlImage: datos.urlImage }),
                ...(datos.estado && { estado: datos.estado }),
            },
        });
        return this.mapearSeguroMedico(seguro);
    }
    async eliminar(id) {
        await this.prisma.seguroMedico.update({
            where: { id },
            data: { estado: 'Inactivo' },
        });
    }
    // ============================================
    // Paciente - Gestión de seguros (máximo 3)
    // ============================================
    async agregarSeguroPaciente(pacienteId, dto) {
        const pacienteSeguro = await this.prisma.pacienteSeguro.create({
            data: {
                pacienteId,
                seguroId: dto.idSeguro,
                tipoSeguroId: dto.idTipoSeguro,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
        });
        return {
            seguro: this.mapearSeguroMedico(pacienteSeguro.seguro),
            tipoSeguro: {
                id: pacienteSeguro.tipoSeguro.id,
                nombre: pacienteSeguro.tipoSeguro.nombre,
                descripcion: pacienteSeguro.tipoSeguro.descripcion,
            },
            estado: pacienteSeguro.estado,
            creadoEn: pacienteSeguro.creadoEn,
        };
    }
    async obtenerSegurosPaciente(pacienteId, incluirHistorial = false) {
        const whereClause = { pacienteId };
        // Si no se incluye historial, filtrar solo activos
        if (!incluirHistorial) {
            whereClause.estado = 'Activo';
        }
        const seguros = await this.prisma.pacienteSeguro.findMany({
            where: whereClause,
            include: {
                seguro: true,
                tipoSeguro: true,
            },
            orderBy: { creadoEn: 'desc' },
        });
        return seguros.map((ps) => ({
            seguro: this.mapearSeguroMedico(ps.seguro),
            tipoSeguro: {
                id: ps.tipoSeguro.id,
                nombre: ps.tipoSeguro.nombre,
                descripcion: ps.tipoSeguro.descripcion,
            },
            estado: ps.estado,
            creadoEn: ps.creadoEn,
        }));
    }
    async eliminarSeguroPaciente(pacienteId, seguroId) {
        await this.prisma.pacienteSeguro.updateMany({
            where: {
                pacienteId,
                seguroId,
            },
            data: {
                estado: 'Eliminado',
                actualizadoEn: new Date(),
            },
        });
    }
    async contarSegurosActivosPaciente(pacienteId) {
        return await this.prisma.pacienteSeguro.count({
            where: {
                pacienteId,
                estado: 'Activo',
            },
        });
    }
    async verificarSeguroExistentePaciente(pacienteId, seguroId) {
        const count = await this.prisma.pacienteSeguro.count({
            where: {
                pacienteId,
                seguroId,
                estado: 'Activo',
            },
        });
        return count > 0;
    }
    // ============================================
    // Doctor - Gestión de seguros (ilimitado)
    // ============================================
    async agregarSeguroDoctor(doctorId, dto) {
        const doctorSeguro = await this.prisma.doctorSeguro.create({
            data: {
                doctorId,
                seguroId: dto.idSeguro,
                tipoSeguroId: dto.idTipoSeguro,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
        });
        return {
            seguro: this.mapearSeguroMedico(doctorSeguro.seguro),
            tipoSeguro: {
                id: doctorSeguro.tipoSeguro.id,
                nombre: doctorSeguro.tipoSeguro.nombre,
                descripcion: doctorSeguro.tipoSeguro.descripcion,
            },
            estado: doctorSeguro.estado,
            creadoEn: doctorSeguro.creadoEn,
        };
    }
    async obtenerSegurosDoctor(doctorId) {
        const seguros = await this.prisma.doctorSeguro.findMany({
            where: {
                doctorId,
                estado: 'Activo',
            },
            include: {
                seguro: true,
                tipoSeguro: true,
            },
            orderBy: { creadoEn: 'desc' },
        });
        return seguros.map((ds) => ({
            seguro: this.mapearSeguroMedico(ds.seguro),
            tipoSeguro: {
                id: ds.tipoSeguro.id,
                nombre: ds.tipoSeguro.nombre,
                descripcion: ds.tipoSeguro.descripcion,
            },
            estado: ds.estado,
            creadoEn: ds.creadoEn,
        }));
    }
    async eliminarSeguroDoctor(doctorId, seguroId, tipoSeguroId) {
        await this.prisma.doctorSeguro.updateMany({
            where: {
                doctorId,
                seguroId,
                tipoSeguroId,
            },
            data: {
                estado: 'Eliminado',
                actualizadoEn: new Date(),
            },
        });
    }
    async verificarSeguroExistenteDoctor(doctorId, seguroId, tipoSeguroId) {
        const count = await this.prisma.doctorSeguro.count({
            where: {
                doctorId,
                seguroId,
                tipoSeguroId,
                estado: 'Activo',
            },
        });
        return count > 0;
    }
    // ============================================
    // Utilidades
    // ============================================
    async existeNombre(nombre, excluirId) {
        const count = await this.prisma.seguroMedico.count({
            where: {
                nombre,
                ...(excluirId && { id: { not: excluirId } }),
            },
        });
        return count > 0;
    }
    /**
     * Devuelve los seguros más utilizados por pacientes (con estado Activo),
     * ordenados de mayor a menor número de pacientes activos.
     */
    async obtenerMasUtilizadosPorPacientes(limite = 10) {
        // Agrupar por seguroId y contar pacientes activos
        const grupos = await this.prisma.pacienteSeguro.groupBy({
            by: ['seguroId'],
            where: { estado: 'Activo' },
            _count: { seguroId: true },
            orderBy: { _count: { seguroId: 'desc' } },
            take: limite,
        });
        if (grupos.length === 0)
            return [];
        // Obtener los datos completos de cada seguro
        const seguroIds = grupos.map(g => g.seguroId);
        const seguros = await this.prisma.seguroMedico.findMany({
            where: { id: { in: seguroIds } },
        });
        // Mapear manteniendo el orden del ranking
        return grupos.map(grupo => {
            const seguro = seguros.find(s => s.id === grupo.seguroId);
            return {
                id: seguro.id,
                nombre: seguro.nombre,
                urlImage: seguro.urlImage,
                estado: seguro.estado,
                totalPacientes: grupo._count.seguroId,
            };
        });
    }
    async verificarCompatibilidadSeguro(seguroId, tipoSeguroId, doctorId, pacienteId) {
        // 1. Obtener nombres del seguro y tipo de seguro
        const [seguro, tipoSeguro] = await Promise.all([
            this.prisma.seguroMedico.findUnique({
                where: { id: seguroId },
                select: { nombre: true },
            }),
            this.prisma.tipoSeguro.findUnique({
                where: { id: tipoSeguroId },
                select: { nombre: true },
            }),
        ]);
        if (!seguro || !tipoSeguro) {
            throw new Error(!seguro
                ? `No existe un seguro médico con ID ${seguroId}.`
                : `No existe un tipo de seguro con ID ${tipoSeguroId}.`);
        }
        // 2. Verificar en paralelo: doctor acepta + paciente tiene
        const [doctorSeguro, pacienteSeguro] = await Promise.all([
            this.prisma.doctorSeguro.findFirst({
                where: { doctorId, seguroId, tipoSeguroId, estado: 'Activo' },
            }),
            this.prisma.pacienteSeguro.findFirst({
                where: { pacienteId, seguroId, tipoSeguroId, estado: 'Activo' },
            }),
        ]);
        const doctorAcepta = doctorSeguro !== null;
        const pacienteTiene = pacienteSeguro !== null;
        const compatible = doctorAcepta && pacienteTiene;
        let mensaje;
        if (compatible) {
            mensaje = `Compatible: el doctor acepta y el paciente tiene el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}).`;
        }
        else if (!doctorAcepta && !pacienteTiene) {
            mensaje = `El doctor no acepta el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}) y el paciente tampoco lo tiene registrado.`;
        }
        else if (!doctorAcepta) {
            mensaje = `El doctor no acepta el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}).`;
        }
        else {
            mensaje = `El paciente no tiene registrado el seguro "${seguro.nombre}" (plan: ${tipoSeguro.nombre}) como activo.`;
        }
        return {
            seguroNombre: seguro.nombre,
            tipoSeguroNombre: tipoSeguro.nombre,
            doctorAcepta,
            pacienteTiene,
            compatible,
            mensaje,
        };
    }
    // ============================================
    // Mappers
    // ============================================
    mapearSeguroMedico(seguro) {
        return new SeguroMedico_1.SeguroMedico(seguro.id, seguro.nombre, seguro.estado, seguro.creadoEn, seguro.urlImage);
    }
}
exports.PrismaSeguroMedicoRepository = PrismaSeguroMedicoRepository;
