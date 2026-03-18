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
        nombreDiagnostico: string;
        descripcionDiagnostico: string;
    }): Promise<any>;

    buscarHistorialPorCita(citaId: number): Promise<any | null>;

    listarHistorialPaciente(pacienteId: number, filtros: {
        pagina?: number;
        limite?: number;
    }): Promise<{ datos: any[]; total: number }>;

    listarHistorialPacientePorDoctor(doctorId: number, pacienteId: number, filtros: {
        pagina?: number;
        limite?: number;
    }): Promise<{ datos: any[]; total: number }>;

    estadisticasPacientes(doctorId: number, filtros: {
        fechaDesde?: Date;
        fechaHasta?: Date;
        servicioId?: number;
    }): Promise<{
        totalPacientes: number;
        pacientesConCondicionesActivas: number;
        pacientesConAlergias: number;
        edadPromedio: number | null;
    }>;

    estadisticasCitas(doctorId: number, filtros: {
        fechaDesde?: Date;
        fechaHasta?: Date;
        servicioId?: number;
    }): Promise<{
        totalCitas: number;
        citasProgramadas: number;
        citasCanceladas: number;
        citasCompletadas: number;
    }>;

    resumenDoctor(doctorId: number): Promise<{
        totalPacientes: number;
        totalConsultas: number;
        totalDineroGanado: number;
    }>;

    estadisticasServicios(doctorId: number): Promise<{
        totalServicios: number;
        serviciosActivos: number;
        serviciosInactivos: number;
        promedioRating: number | null;
    }>;

    productividadDoctor(doctorId: number, periodo: string): Promise<{
        periodo: string;
        puntos: { label: string; consultas: number; ingresos: number }[];
        totales: { consultas: number; ingresos: number };
    }>;

    serviciosMasUtilizados(doctorId: number): Promise<{
        masUtilizados: { servicioId: number; nombre: string; totalCitas: number; porcentaje: number }[];
        servicios: { id: number; nombre: string; precio: number | null; estado: string; modalidad: string; totalCitas: number }[];
    }>;

    misDoctores(pacienteId: number): Promise<any[]>;

    listarPacientesDelDoctor(doctorId: number, filtros: {
        pagina?: number;
        limite?: number;
        ordenar?: 'nombre' | 'ultimaCita' | 'totalCitas';
        direccion?: 'asc' | 'desc';
        buscar?: string;
        genero?: string;
        condicionId?: number;
        alergiaId?: number;
        especialidadId?: number;
        servicioId?: number;
        ubicacionId?: number;
        ultimaCitaDesde?: Date;
        ultimaCitaHasta?: Date;
    }): Promise<{ datos: any[]; total: number }>;

    listarFuturasCitas(doctorId: number, pacienteId: number, desde: Date): Promise<any[]>;
}
