import { Usuario } from "../entities/Usuario";

export interface IUsuarioRepository {
  crear(usuario: Usuario): Promise<Usuario>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  actualizar(id: number, datos: Partial<Usuario>): Promise<Usuario>;
  eliminar(id: number): Promise<void>;

  /**
   * Guarda un Paciente con su perfil relacionado (transacción atómica)
   */
  savePaciente(data: {
    email: string;
    password: string; // Ya hasheada
    rol: string;
    paciente: {
      nombre: string;
      apellido: string;
      numero_documento_identificacion: string;
      tipo_documento_identificacion: string;
      foto_documento: string;
      foto_perfil?: string | null;
      fecha_nacimiento?: Date;
      genero?: string;
      altura?: number;
      peso?: number;
      tipo_sangre?: string;
    };
  }): Promise<Usuario>;

  /**
   * Guarda un Doctor con toda su estructura relacional (transacción atómica)
   * - Usuario
   * - Ubicación
   * - Perfil Doctor
   * - Formaciones Académicas
   * - Acción de Auditoría
   */
  saveDoctor(data: {
    email: string;
    password: string; // Ya hasheada
    rol: string;
    doctor: {
      nombre: string;
      apellido: string;
      genero: string;
      fecha_nacimiento: Date;
      nacionalidad: string;
      telefono: string;
      tipo_documento_identificacion: string;
      numero_documento_identificacion: string;
      foto_documento: string;
      foto_perfil: string;
      exequatur: string;
      biografia?: string;
      titulo_academico: string;
      certificaciones_adicionales: string;
      estado_verificacion: string;
    };
    ubicacion: {
      direccion: string;
      id_barrio: number;
      id_sub_barrio?: number | null;
    };
    formaciones: Array<{
      id_especialidad: number;
      id_universidad: number;
      fecha_inicio: Date;
      fecha_finalizacion?: Date | null;
      estado: string;
    }>;
  }): Promise<Usuario>;

  /** Busca un usuario por cuenta social (proveedor + uid). */
  buscarPorCuentaSocial(proveedor: string, uid: string): Promise<Usuario | null>;

  /** Vincula una cuenta social a un usuario existente. */
  vincularCuentaSocial(idUsuario: number, proveedor: string, uid: string): Promise<void>;

  /** Crea un usuario básico (email verificado, sin perfil Paciente/Doctor). Password debe ir hasheada. */
  crearUsuarioBasico(datos: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    foto: string;
  }): Promise<Usuario>;
}