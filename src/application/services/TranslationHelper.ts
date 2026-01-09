import { inject, injectable } from 'tsyringe';
import { ITranslationService } from '../interfaces/ITranslationService';

@injectable()
export class TranslationHelper {
  constructor(
    @inject('ITranslationService') private translator: ITranslationService
  ) {}

  /**
   * Toma un objeto cualquiera y traduce solo los campos especificados
   */
  async traducirObjeto(data: any, campos: string[], idiomaOrigen: string = 'es', idiomaDestino: string = 'en'): Promise<any> {
    if (!data) return data;

    // Extraer valores
    const valores = campos.map(campo => data[campo] || "");

    // Traducir en lote (1 sola petición HTTP)
    const traducciones = await this.translator.translate(valores, idiomaOrigen, idiomaDestino);
    // Aseguramos que sea un array (por si LibreTranslate devuelve string simple al enviar 1 solo valor)
    const arrayTraducciones = Array.isArray(traducciones) ? traducciones : [traducciones];

    // Reconstruir objeto (copia superficial)
    const resultado = { ...data };
    campos.forEach((campo, index) => {
      if (resultado[campo]) {
        resultado[campo] = arrayTraducciones[index];
      }
    });

    return resultado;
  }
}