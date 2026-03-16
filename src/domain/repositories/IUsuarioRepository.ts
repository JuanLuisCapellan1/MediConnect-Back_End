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
      foto_documento?: string | null;
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
    id_especialidad_principal: number;
    ids_especialidades_secundarias?: number[];
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

  /**
   * Devuelve el usuario con información asociada (perfil paciente/doctor/centro, etc.).
   * El tipo concreto dependerá del rol.
   */
  buscarPerfilDetalladoPorId(id: number): Promise<any | null>;

  /**
   * Actualiza la foto de perfil de un usuario
   */
  updateProfilePhoto(usuarioId: number, fotoPerfilUrl: string): Promise<void>;

  /**
   * Actualiza el banner de un usuario
   */
  updateBanner(usuarioId: number, bannerUrl: string): Promise<void>;

  /**
   * Verifica si existe un doctor con el número de documento dado
   */
  existeDoctorConNumeroDocumento(numeroDocumento: string): Promise<boolean>;

  /**
   * Elimina (soft delete) la cuenta del usuario y todas sus entidades relacionadas
   */
  eliminarCuenta(usuarioId: number): Promise<void>;

  /**
   * Verifica si existe un email registrado con estado activo
   * (para permitir re-registro de cuentas eliminadas)
   */
  existeEmailActivo(email: string): Promise<boolean>;

  /**
   * Busca un usuario por email incluyendo los eliminados
   * (para re-activación de cuentas)
   */
  findByEmailIncludingDeleted(email: string): Promise<Usuario | null>;

  /**
   * Verifica si existe un doctor con el exequatur dado
   */
  existeDoctorConExequatur(exequatur: string): Promise<boolean>;

  /**
   * Verifica si un número de documento ya está registrado (en doctores o pacientes)
   * Retorna si existe y el tipo de usuario
   */
  verificarDocumentoExistente(numeroDocumento: string): Promise<{
    existe: boolean;
    tipo?: 'Doctor' | 'Paciente';
  }>;

  /**
   * Guarda un Doctor con documentos múltiples (transacción atómica)
   * - Usuario
   * - Ubicación
   * - Perfil Doctor
   * - Formaciones Académicas
   * - Especialidades (principal y secundarias)
   * - Documentos (múltiples por tipo)
   * - Acción de Auditoría
   */
  saveDoctorWithDocuments(data: SaveDoctorWithDocumentsData): Promise<Usuario>;

  /**
   * Helper de Seguridad: Intercepta IDs que podrían pertenecer a perfiles en vez de usuarios.
   * Busca el usuarioId equivalente en la base de datos y lo devuelve, sino retorna el mismo ID.
   */
  resolverIdPerfilAUsuario(idSospechoso: number): Promise<number>;
}

export interface SaveDoctorWithDocumentsData {
  email: string;
  password: string;
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
    foto_perfil: string | null;
    exequatur: string;
    biografia?: string;
    estado_verificacion: string;
  };
  ubicacion?: {
    direccion: string;
    id_barrio: number;
    id_sub_barrio?: number | null;
  };
  formaciones?: Array<{
    id_especialidad: number;
    id_universidad: number;
    fecha_inicio: Date;
    fecha_finalizacion?: Date | null;
    estado: string;
  }>;

  id_especialidad_principal: number;
  ids_especialidades_secundarias?: number[];
  documentos: Array<{
    tipo_documento: string;
    url_archivo: string;
    nombre_original?: string;
    tipo_mime?: string;
    tamanio_bytes?: number;
    descripcion?: string | null;
  }>;
}