export class SeccionYaExisteError extends Error {
  constructor(nombre: string, distritoMunicipalId?: number) {
    let message = `Ya existe una Sección con el nombre "${nombre}"`;
    
    if (distritoMunicipalId) {
      message += ` en el Distrito Municipal con ID ${distritoMunicipalId}`;
    }
    super(message);
    this.name = 'SeccionYaExisteError';
  }
}
