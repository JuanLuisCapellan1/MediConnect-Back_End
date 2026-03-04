/**
 * FavoritoDtos.ts — DTOs para el módulo de Doctores Favoritos
 */

export interface FavoritoResponseDto {
    pacienteId: number;
    doctorId: number;
    agregadoEn: Date;
    doctor?: {
        usuarioId: number;
        nombre: string;
        apellido: string;
        fotoPerfil: string | null;
        calificacionPromedio: number | null;
        especialidades: { id: number; nombre: string; esPrincipal: boolean }[];
    };
}
