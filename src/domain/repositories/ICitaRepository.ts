export interface ICitaRepository {
    crear(datos: {
        pacienteId: number;
        doctorId: number;
        servicioId: number;
        horarioId?: number;
        fechaInicio: Date;
        duracionMinutos?: number;
        modalidad: string;
        numPacientes: number;
        seguroId?: number;
        tipoSeguroId?: number;
        motivoConsulta?: string;
        totalAPagar: number;
        ubicacionId?: number;
        grupoId?: number;
    }): Promise<any>;

    buscarPorId(id: number): Promise<any | null>;

    listarPorPaciente(pacienteId: number, filtros: {
        estado?: string;
        pagina?: number;
        limite?: number;
        fechaDesde?: Date;
        fechaHasta?: Date;
    }): Promise<{ datos: any[]; total: number }>;

    listarPorDoctor(doctorId: number, filtros: {
        estado?: string;
        pagina?: number;
        limite?: number;
        fechaDesde?: Date;
        fechaHasta?: Date;
    }): Promise<{ datos: any[]; total: number }>;

    actualizar(id: number, datos: Partial<{
        horarioId: number;
        fechaInicio: Date;
        fechaFin: Date | null;
        modalidad: string;
        numPacientes: number;
        seguroId: number | null;
        tipoSeguroId: number | null;
        motivoConsulta: string;
        totalAPagar: number;
        estado: string;
        motivoCancelacion: string | null;
        ubicacionId: number | null;
    }>): Promise<any>;

    obtenerCitasEnRango(doctorId: number, desde: Date, hasta: Date): Promise<any[]>;

    crearHistorial(datos: {
        citaId: number;
        pacienteId: number;
        resumen: string;
        diagnostico: string;
        tratamiento?: string;
        observacion?: string;
    }): Promise<any>;

    buscarHistorialPorCita(citaId: number): Promise<any | null>;

    listarHistorialPaciente(pacienteId: number, filtros: {
        pagina?: number;
        limite?: number;
    }): Promise<{ datos: any[]; total: number }>;
}
