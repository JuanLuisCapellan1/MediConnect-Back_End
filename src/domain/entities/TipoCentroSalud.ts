/**
 * Entidad TipoCentroSalud - Dominio
 */
export class TipoCentroSalud {
  id: number;
  nombre: string;
  estado: string;
  creadoEn: Date;

  constructor(data: {
    id: number;
    nombre: string;
    estado?: string;
    creadoEn?: Date;
  }) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.estado = data.estado || 'Activo';
    this.creadoEn = data.creadoEn || new Date();
  }
}
