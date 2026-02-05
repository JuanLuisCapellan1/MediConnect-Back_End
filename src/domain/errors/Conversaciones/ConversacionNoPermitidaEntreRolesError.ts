export class ConversacionNoPermitidaEntreRolesError extends Error {
  constructor(rolEmisor: string, rolReceptor: string) {
    super(
      `No se permite crear conversaciones entre usuarios con roles ${rolEmisor} y ${rolReceptor}. ` +
      `Solo se permiten conversaciones entre: Doctor-Paciente, Centro de Salud-Doctor, o Paciente-Centro de Salud.`
    );
    this.name = 'ConversacionNoPermitidaEntreRolesError';
  }
}
