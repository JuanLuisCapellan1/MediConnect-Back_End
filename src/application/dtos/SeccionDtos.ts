export interface CrearSeccionDto {
  distritoMunicipalId?: number | null;
  nombre: string;
}

export interface ActualizarSeccionDto {
  distritoMunicipalId?: number;
  nombre?: string;
  estado?: string;
}

export interface SeccionResponseDto {
  id: number;
  distritoMunicipalId: number;
  nombre: string;
  estado: string;
  creadoEn: Date;
}
