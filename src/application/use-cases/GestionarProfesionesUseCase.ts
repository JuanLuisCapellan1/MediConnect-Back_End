import { injectable, inject } from 'tsyringe';
import { IProfesionesRepository } from '../../domain/repositories/IProfesionesRepository';
import { ProfesionValidator } from '../../domain/validators/Profesiones/ProfesionValidator';
import { Profesion } from '../../domain/entities/Profesion';
import { CrearProfesionDto, ActualizarProfesionDto, FiltroProfesionesDto } from '../dtos/ProfesionDtos';
import { ProfesionNoEncontradaError } from '../../domain/errors/Profesiones/ProfesionNoEncontradaError';

@injectable()
export class GestionarProfesionesUseCase {
  constructor(
    @inject('IProfesionesRepository')
    private profesionesRepository: IProfesionesRepository,
    @inject('ProfesionValidator')
    private profesionValidator: ProfesionValidator
  ) {}

  async crear(dto: CrearProfesionDto): Promise<Profesion> {
    // Validar que el nombre sea requerido
    this.profesionValidator.validarNombreRequerido(dto.nombre);

    // Normalizar nombre
    const nombreNormalizado = dto.nombre.trim();

    // Validar que no exista otra profesión con el mismo nombre
    await this.profesionValidator.validarNombreUnico(nombreNormalizado);

    // Normalizar estado (capitalizar primera letra)
    const estado = dto.estado
      ? dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase()
      : 'Activo';

    // Validar estado
    this.profesionValidator.validarEstadoValido(estado);

    //Normalizar descripción
    const descripcion = dto.descripcion ? dto.descripcion.trim() : undefined;

    // Crear profesión
    return await this.profesionesRepository.crear(nombreNormalizado, estado, descripcion);
  }

  async obtenerPorId(id: number): Promise<Profesion> {
    const profesion = await this.profesionesRepository.obtenerPorId(id);
    
    if (!profesion) {
      throw new ProfesionNoEncontradaError(id);
    }

    return profesion;
  }

  async obtenerTodos(filtro: FiltroProfesionesDto): Promise<{ profesiones: Profesion[]; total: number }> {
    const pagina = filtro.pagina && filtro.pagina > 0 ? filtro.pagina : 1;
    const limite = filtro.limite && filtro.limite > 0 ? filtro.limite : 10;

    // Normalizar estado si se proporciona
    let estadoNormalizado: string | undefined;
    if (filtro.estado) {
      estadoNormalizado = filtro.estado.charAt(0).toUpperCase() + filtro.estado.slice(1).toLowerCase();
      this.profesionValidator.validarEstadoValido(estadoNormalizado);
    }

    return await this.profesionesRepository.obtenerTodos(
      estadoNormalizado,
      filtro.busqueda,
      pagina,
      limite
    );
  }

  async actualizar(id: number, dto: ActualizarProfesionDto): Promise<Profesion> {
    // Verificar que la profesión existe
    const profesionExistente = await this.profesionesRepository.obtenerPorId(id);
    if (!profesionExistente) {
      throw new ProfesionNoEncontradaError(id);
    }

    let nombreNormalizado: string | undefined;
    if (dto.nombre !== undefined) {
      this.profesionValidator.validarNombreRequerido(dto.nombre);
      nombreNormalizado = dto.nombre.trim();
      
      // Validar que no exista otra profesión con el mismo nombre
      await this.profesionValidator.validarNombreUnico(nombreNormalizado, id);
    }

    let estadoNormalizado: string | undefined;
    if (dto.estado !== undefined) {
      estadoNormalizado = dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase();
      this.profesionValidator.validarEstadoValido(estadoNormalizado);
    }


    let descripcionNormalizada: string | undefined;
    if (dto.descripcion !== undefined) {
      descripcionNormalizada = dto.descripcion.trim();
    }

    return await this.profesionesRepository.actualizar(id, nombreNormalizado, estadoNormalizado, descripcionNormalizada);
  }

  async eliminar(id: number): Promise<void> {
    // Verificar que la profesión existe
    const profesion = await this.profesionesRepository.obtenerPorId(id);
    if (!profesion) {
      throw new ProfesionNoEncontradaError(id);
    }

    await this.profesionesRepository.eliminar(id);
  }
}
