export interface BuscarBarrioPorCoordenadasDto {
	/** Longitud (X) del punto a buscar */
	longitud: number;
	/** Latitud (Y) del punto a buscar */
	latitud: number;
}

export interface CrearBarrioDto {
	// ID de la sección a la que pertenece el barrio
	seccionId: number;
	// Nombre del barrio a crear
	nombre: string;
}

export interface ActualizarBarrioDto {
	// ID del barrio a actualizar
	id: number;
	// ID de la sección (opcional)
	seccionId?: number;
	// Nuevo nombre del barrio (opcional)
	nombre?: string;
	// Nuevo estado del barrio (opcional)
	estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
