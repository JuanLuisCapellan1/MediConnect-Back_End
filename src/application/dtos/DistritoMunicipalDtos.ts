export interface CrearDistritoMunicipalDto {
	// ID del municipio al que pertenece el distrito
	municipioId: number;
	// Nombre del distrito municipal a crear
	nombre: string;
}

export interface ActualizarDistritoMunicipalDto {
	// ID del distrito a actualizar
	id: number;
	// ID del municipio (opcional)
	municipioId?: number;
	// Nuevo nombre del distrito (opcional)
	nombre?: string;
	// Nuevo estado del distrito (opcional)
	estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
