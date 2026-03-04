export interface CrearMensajeDto {
  conversacionId: number;
  remitenteId: number;
  contenido?: string;
  tipo?: 'texto' | 'imagen' | 'audio' | 'video' | 'archivo' | 'otro';
  mediaId?: number;
}

export interface ActualizarMensajeDto {
  contenido?: string;
  estado?: 'Enviado' | 'Editado' | 'Eliminado';
}

export interface FiltroMensajesDto {
  conversacionId: number;
  usuarioId: number; // Para verificar que el usuario tenga acceso
  tipo?: 'texto' | 'imagen' | 'audio' | 'video' | 'archivo' | 'otro';
  busqueda?: string; // Para buscar en el contenido
  limite?: number;
  pagina?: number;   // Página (1-indexed). Alternativa a offset
  offset?: number;
  antesDeId?: number; // Para cargar mensajes más antiguos (paginación hacia atrás)
}

export interface MarcarMensajesLeidosDto {
  conversacionId: number;
  usuarioId: number;
  ultimoMensajeLeidoId: number;
}

export interface MensajeConRemitenteDto {
  id: number;
  conversacionId: number;
  remitenteId: number;
  contenido?: string;
  tipo: string;
  mediaId?: number;
  estado: string;
  enviadoEn: Date;
  remitente: {
    id: number;
    nombre: string;
    apellido: string;
    fotoPerfil?: string;
  };
  media?: {
    id: number;
    archivo: string;
    nombre?: string;
    tipoMime?: string;
    tamanioBytes?: number;
  };
  esPropio?: boolean; // Si el mensaje lo envió el usuario actual
}
