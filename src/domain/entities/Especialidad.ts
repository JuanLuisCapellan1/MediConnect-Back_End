/**
 * Entidad Especialidad - Dominio
 */
export class Especialidad {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: string;
  creadoEn: Date;

  constructor(data: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    estado?: string;
    creadoEn?: Date;
  }) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.estado = data.estado || 'Activo';
    this.creadoEn = data.creadoEn || new Date();
  }
}
