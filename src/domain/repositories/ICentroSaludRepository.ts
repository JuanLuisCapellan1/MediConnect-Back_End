import { CentroSalud } from '../entities/CentroSalud';

export interface PerfilCentroSaludCompleto {
  centroSalud: any;  // incluye usuario, tipoCentro, ubicacion con barrio
}

export interface ICentroSaludRepository {
  // Perfil
  obtenerPerfilCompleto(usuarioId: number): Promise<any | null>;
  actualizarPerfil(usuarioId: number, datos: {
    nombreComercial?: string;
    rnc?: string;
    tipoCentroId?: number;
    sitio_web?: string;
    descripcion?: string;
    telefono?: string;
    direccion?: string;
  }): Promise<any>;
  actualizarFotoPerfil(usuarioId: number, url: string): Promise<any>;

  // Ubicación
  obtenerUbicacion(usuarioId: number): Promise<any | null>;
  actualizarUbicacion(usuarioId: number, datos: {
    barrioId?: number;
    subBarrioId?: number | null;
    direccion?: string;
    codigoPostal?: string | null;
  }): Promise<any>;

  // Doctores asociados (solicitudes Aceptadas)
  listarDoctoresAsociados(centroSaludId: number): Promise<any[]>;

  // ─── ANALÍTICAS DEL CENTRO ──────────────────────────────────────────────────

  estadisticasGenerales(centroSaludId: number): Promise<{
    totalMedicos: number;
    totalEspecialidades: number;
    citasSemanaActual: number;
    valoracionPromedio: number | null;
  }>;

  crecimientoMedicos(centroSaludId: number, periodo: string): Promise<{
    periodo: string;
    puntos: { label: string; total: number; nuevos: number }[];
    totalActual: number;
  }>;

  distribucionEspecialidades(centroSaludId: number): Promise<{
    especialidades: { id: number; nombre: string; totalMedicos: number; porcentaje: number }[];
    total: number;
  }>;

  // Legacy (mantener compatibilidad con RegisterCentroUseCase)
  obtenerPorId(usuarioId: number): Promise<any | null>;
  obtenerPorUsuarioId(usuarioId: number): Promise<any | null>;
  crear(datos: any): Promise<any>;
  actualizar(usuarioId: number, datos: any): Promise<any>;
  listar(): Promise<any[]>;
  listarParaAdmin(filtros: {
    nombre?: string;
    estadoVerificacion?: string;
    estado?: string;
    tipoCentroId?: number;
    pagina?: number;
    limite?: number;
  }): Promise<{ datos: any[]; total: number }>;

  // ─── BÚSQUEDA GEOGRÁFICA ────────────────────────────────────────────────────
  buscarCercanos(
    lat?: number,
    lng?: number,
    radioKm?: number,
    filtros?: { tipoCentroId?: number; estadoVerificacion?: string; nombre?: string },
  ): Promise<any[]>;
}
