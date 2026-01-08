export class Usuario {
  constructor(
    public id: number,
    public email: string,
    public rol: string,
    public estado: string,
    public foto_perfil?: string,
    public telefono?: string,
    public password?: string, // Opcional porque puede venir de Google
    public emailVerificado: boolean = false,
    public creadoEn?: Date,
    public actualizadoEn?: Date
  ) {}

  public esActivo(): boolean {
    return this.estado === 'Activo';
  }

  public esAdmin(): boolean {
    return this.rol === "Administrador";
  }

  public esDoctor(): boolean {
    return this.rol === "Doctor";
  }

  public esPaciente(): boolean {
    return this.rol === "Paciente";
  }

  public actualizarEstado(nuevoEstado: string): void {
    this.estado = nuevoEstado;
    this.actualizadoEn = new Date();
  }

}