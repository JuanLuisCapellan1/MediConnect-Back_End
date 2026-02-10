import { injectable } from 'tsyringe';

@injectable()
export class CentroSaludValidator {
  /**
   * Valida que el nombre comercial sea único (si es necesario)
   */
  async validarNombreUnico(nombre: string, excluirId?: number): Promise<void> {
    // Implementar según tu lógica
    // Por ahora, es un placeholder
  }

  /**
   * Valida que el RNC sea válido (si se proporciona)
   */
  validarRNC(rnc?: string): void {
    if (rnc && rnc.length < 7) {
      throw new Error('El RNC debe ser válido');
    }
  }

  /**
   * Valida el teléfono
   */
  validarTelefono(telefono: string): void {
    const regexTelefono = /^\+?[0-9\s\-\(\)]{10,20}$/;
    if (!regexTelefono.test(telefono)) {
      throw new Error('El teléfono no es válido');
    }
  }

  /**
   * Valida el nombre comercial
   */
  validarNombreComercial(nombre: string): void {
    if (!nombre || nombre.trim().length < 3) {
      throw new Error('El nombre comercial debe tener al menos 3 caracteres');
    }
    if (nombre.length > 120) {
      throw new Error('El nombre comercial no puede exceder 120 caracteres');
    }
  }

  /**
   * Valida la descripción
   */
  validarDescripcion(descripcion?: string): void {
    if (descripcion && descripcion.length > 1000) {
      throw new Error('La descripción no puede exceder 1000 caracteres');
    }
  }
}