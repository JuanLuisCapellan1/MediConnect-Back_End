// DTOs para Condiciones Médicas

export interface CrearCondicionMedicaDto {
    nombre: string;
    descripcion?: string;
    tipo: string; // 'Alergia' | 'Enfermedad' | 'Condición'
}

export interface ActualizarCondicionMedicaDto {
    nombre?: string;
    descripcion?: string;
    tipo?: string;
    estado?: string;
}

export interface FiltroCondicionesMedicasDto {
    nombre?: string;
    tipo?: string;
    estado?: string;
    pagina?: number;
    limite?: number;
}

// DTOs para Asignación de Condiciones a Pacientes

export interface AsignarCondicionPacienteDto {
    pacienteId: number;
    condicionId: number;
    notas?: string;
    doctorId?: number; // ID del doctor que asigna la condición
}

export interface ActualizarCondicionPacienteDto {
    notas?: string;
    estado?: string;
}

export interface FiltroCondicionesPacienteDto {
    tipo?: string;
    estado?: string;
}

// ==========================================
// DTOs para Pacientes (Auto-gestión)
// ==========================================

export interface BuscarAlergiasDto {
    query: string;
    limite?: number;
}

export interface AgregarAlergiaPersonalDto {
    condicionId: number;
    notas?: string;
}

export interface CrearCondicionPersonalDto {
    notas: string;
}

export interface FiltroMisCondicionesDto {
    tipo?: string;
    estado?: string;
}

export interface ActualizarMiCondicionDto {
    notas?: string;
    estado?: string;
}
