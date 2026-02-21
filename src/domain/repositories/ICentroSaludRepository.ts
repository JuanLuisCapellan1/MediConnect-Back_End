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

  // Legacy (mantener compatibilidad con RegisterCentroUseCase)
  obtenerPorId(usuarioId: number): Promise<any | null>;
  obtenerPorUsuarioId(usuarioId: number): Promise<any | null>;
  crear(datos: any): Promise<any>;
  actualizar(usuarioId: number, datos: any): Promise<any>;
  listar(): Promise<any[]>;
}
