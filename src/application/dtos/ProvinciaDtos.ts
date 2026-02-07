export interface CrearProvinciaDto {
	// Nombre de la provincia a crear
  nombre: string;
}

export interface ActualizarProvinciaDto {
	// ID de la provincia a actualizar
	id: number;
	// Nuevo nombre de la provincia (opcional)
	nombre?: string;
	// Nuevo estado de la provincia (opcional)
	estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}

