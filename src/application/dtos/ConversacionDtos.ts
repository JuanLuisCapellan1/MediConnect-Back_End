export interface CrearConversacionDto {
  emisorId: number;
  receptorId: number;
}

export interface ActualizarConversacionDto {
  silenciado?: boolean;
  estado?: 'Activa' | 'Archivada' | 'Bloqueada';
}

export interface FiltroConversacionesDto {
  usuarioId: number;
  estado?: 'Activa' | 'Archivada' | 'Bloqueada';
  silenciado?: boolean;
  busqueda?: string; // Para buscar por nombre del otro usuario
  limite?: number;
  offset?: number;
}

export interface ConversacionConUltimoMensajeDto {
  id: number;
  emisorId: number;
  receptorId: number;
  silenciado: boolean;
  estado: string;
  creadoEn: Date;
  actualizadoEn?: Date;
  ultimoMensaje?: {
    id: number;
    contenido?: string;
    tipo: string;
    enviadoEn: Date;
    remitenteId: number;
  };
  otroUsuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    fotoPerfil?: string;
    conectado?: boolean;
  };
  mensajesNoLeidos: number;
}
