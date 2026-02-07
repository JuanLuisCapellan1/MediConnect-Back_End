export interface CrearMunicipioDto {
	// ID de la provincia a la que pertenece el municipio
	provinciaId: number;
	// Nombre del municipio a crear
	nombre: string;
}

export interface ActualizarMunicipioDto {
	// ID del municipio a actualizar
	id: number;
	// ID de la provincia (opcional)
	provinciaId?: number;
	// Nuevo nombre del municipio (opcional)
	nombre?: string;
	// Nuevo estado del municipio (opcional)
	estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
