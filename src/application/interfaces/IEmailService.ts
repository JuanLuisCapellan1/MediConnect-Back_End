/**
 * Interfaz para el servicio de correo electrónico
 */
export interface IEmailService {
  /**
   * Envía un correo electrónico
   * @param destinatario Email del destinatario
   * @param asunto Asunto del correo
   * @param cuerpo Cuerpo del correo
   */
  enviarCorreo(destinatario: string, asunto: string, cuerpo: string): Promise<void>;
}
