export interface RegistrarUsuarioDto {
  email: string;
  password?: string; // Opcional por si es registro social en el futuro
  rol: string;
  email_verificado?: boolean; // Datos opcionales iniciales
}