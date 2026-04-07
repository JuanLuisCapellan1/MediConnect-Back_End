import { CondicionMedica } from './CondicionMedica';

/**
 * Entidad CaracteristicaEspecial - Dominio
 * Representa la relación entre paciente y condición médica
 */
export class CaracteristicaEspecial {
    pacienteId: number;
    condicionId: number;
    notas?: string | null;
    estado: string;
    registradoEn: Date;
    actualizadoEn?: Date | null;
    condicion?: CondicionMedica; // Datos completos de la condición médica (opcional)

    constructor(data: {
        pacienteId: number;
        condicionId: number;
        notas?: string | null;
        estado?: string;
        registradoEn?: Date;
        actualizadoEn?: Date | null;
        condicion?: CondicionMedica;
    }) {
        this.pacienteId = data.pacienteId;
        this.condicionId = data.condicionId;
        this.notas = data.notas;
        this.estado = data.estado || 'Activo';
        this.registradoEn = data.registradoEn || new Date();
        this.actualizadoEn = data.actualizadoEn;
        this.condicion = data.condicion;
    }
}
