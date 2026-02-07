import { TipoAlerta, TipoEntidad } from '../../domain/entities/Notificacion';

export interface CrearNotificacionDto {
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipoAlerta?: TipoAlerta;
  tipoEntidad?: TipoEntidad;
  entidadId?: number;
}

export interface ActualizarNotificacionDto {
  leidaEn?: Date;
  estado?: string;
}

export interface FiltroNotificacionesDto {
  usuarioId: number;
  leidas?: boolean;
  tipoAlerta?: TipoAlerta;
  tipoEntidad?: TipoEntidad;
  limite?: number;
  offset?: number;
}

export interface MarcarComoLeidaDto {
  notificacionId: number;
  usuarioId: number;
}

export interface MarcarVariasLeidasDto {
  notificacionesIds: number[];
  usuarioId: number;
}
