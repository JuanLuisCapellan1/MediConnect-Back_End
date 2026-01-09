import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { TranslationHelper } from '../../../application/services/TranslationHelper';

export class TestTraduccionController {
  
  async runTest(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Resolvemos el Helper (que a su vez inyecta el LibreTranslateService)
      const translationHelper = container.resolve(TranslationHelper);

      // 2. MOCK DATA: Simulamos un objeto que vendría de tu Base de Datos
      const datosConsulta = {
        id_paciente: 504,
        nombre_paciente: "Juan Luis Capellán", // No se debe traducir
        fecha: "2024-01-20T10:00:00Z",
        // Campos que SÍ queremos traducir:
        motivo_consulta: "El paciente presenta dolor agudo en la zona abdominal derecha y fiebre alta.",
        diagnostico_preliminar: "Posible apendicitis inflamada.",
        notas_medicas: "Se recomienda realizar hemograma completo y ultrasonido abdominal de urgencia.",
        plan_tratamiento: "Ayuno absoluto y administración de analgésicos intravenosos."
      };

      console.log("--- Iniciando traducción ---");

      // 3. Ejecutamos la traducción
      // Le decimos: "Toma este objeto y traduce solo estos 4 campos al Inglés ('en')"
      const datosTraducidos = await translationHelper.traducirObjeto(
        datosConsulta, 
        ['motivo_consulta'],// ['motivo_consulta', 'diagnostico_preliminar', 'notas_medicas', 'plan_tratamiento'], 
        'es',
        'en'
      );

      // 4. Retornamos el resultado para verlo en Postman
      return res.status(200).json({
        original: datosConsulta,
        traducido: datosTraducidos
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error probando la traducción' });
    }
  }
}