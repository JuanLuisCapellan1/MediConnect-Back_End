export interface CrearMediaDto {
  archivo: string; // URL o path del archivo
  nombre?: string;
  tipoMime?: string;
  tamanioBytes?: number;
}

export interface ActualizarMediaDto {
  nombre?: string;
  estado?: 'Activo' | 'Eliminado';
}

export interface FiltroMediaDto {
  tipoMime?: string;
  limite?: number;
  offset?: number;
}
