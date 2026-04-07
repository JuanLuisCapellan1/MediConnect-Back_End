import { inject, injectable } from 'tsyringe';
import { IEspecialidadRepository } from '../../domain/repositories/IEspecialidadRepository';
import { EspecialidadValidator } from '../../domain/validators/Especialidades/EspecialidadValidator';
import {
    CrearEspecialidadDto,
    ActualizarEspecialidadDto,
    FiltroEspecialidadesDto,
} from '../dtos/EspecialidadDtos';
import { EspecialidadNoEncontradaError } from '../../domain/errors/Especialidades/EspecialidadNoEncontradaError';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';
import { TranslationHydrator } from '../../infrastructure/services/TranslationHydrator';

@injectable()
export class GestionarEspecialidadesUseCase {
    constructor(
        @inject('EspecialidadRepository')
        private especialidadRepository: IEspecialidadRepository,
        @inject(EspecialidadValidator)
        private validator: EspecialidadValidator,
        @inject(EstadoValidator)
        private estadoValidator: EstadoValidator,
        @inject(TranslationHydrator)
        private readonly hydrator: TranslationHydrator,
    ) { }

    async crear(dto: CrearEspecialidadDto) {
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
        }
        await this.validator.validarCreacion(dto.nombre);
        const resultado = await this.especialidadRepository.crear(dto);
        // Hidratar caché con el nuevo nombre (fire-and-forget)
        this.hydrator.hydrateStrings([dto.nombre]).catch(() => {});
        return resultado;
    }

    async obtenerPorId(id: number) {
        const encontrado = await this.especialidadRepository.obtenerPorId(id);
        if (!encontrado) {
            throw new EspecialidadNoEncontradaError(id);
        }
        return encontrado;
    }

    async listar(filtros: FiltroEspecialidadesDto) {
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        return await this.especialidadRepository.obtenerTodas(filtros);
    }

    async actualizar(id: number, dto: ActualizarEspecialidadDto) {
        const existente = await this.especialidadRepository.obtenerPorId(id);
        if (!existente) {
            throw new EspecialidadNoEncontradaError(id);
        }

        if (dto.nombre) {
            await this.validator.validarActualizacion(id, dto.nombre);
        }

        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }

        const resultado = await this.especialidadRepository.actualizar(id, dto);
        // Hidratar caché si el nombre fue modificado (fire-and-forget)
        if (dto.nombre) this.hydrator.hydrateStrings([dto.nombre]).catch(() => {});
        return resultado;
    }

    async eliminar(id: number) {
        const existente = await this.especialidadRepository.obtenerPorId(id);
        if (!existente) {
            throw new EspecialidadNoEncontradaError(id);
        }
        return await this.especialidadRepository.eliminar(id);
    }

    private normalizarEstado(estado: string): string {
        if (!estado) return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
}
