import { injectable, inject } from 'tsyringe';
import { IUniversidadRepository } from '../../domain/repositories/IUniversidadRepository';
import { IPaisRepository } from '../../domain/repositories/IPaisRepository';
import { Universidad } from '../../domain/entities/Universidad';
import { CrearUniversidadDto, ActualizarUniversidadDto, FiltroUniversidadesDto } from '../../application/dtos/UniversidadDtos';

@injectable()
export class GestionarUniversidadesUseCase {
    constructor(
        @inject('IUniversidadRepository')
        private universidadRepository: IUniversidadRepository,
        @inject('IPaisRepository')
        private paisRepository: IPaisRepository
    ) { }

    async crear(dto: CrearUniversidadDto): Promise<Universidad> {
        if (!dto.nombre || dto.nombre.trim() === '') {
            throw new Error('El nombre de la universidad es requerido');
        }

        if (!dto.paisId || isNaN(dto.paisId) || dto.paisId < 1) {
            throw new Error('El ID del país es requerido y debe ser válido');
        }

        // Validar que el país existe
        const paisExiste = await this.paisRepository.obtenerPorId(dto.paisId);
        if (!paisExiste) {
            throw new Error(`País con ID ${dto.paisId} no encontrado`);
        }

        const universidad = new Universidad({
            nombre: dto.nombre.trim(),
            paisId: dto.paisId,
            estado: 'Activo',
            creadoEn: new Date(),
        });

        return this.universidadRepository.crear(universidad);
    }

    async obtenerPorId(id: number): Promise<Universidad> {
        if (isNaN(id) || id < 1) {
            throw new Error('ID de universidad inválido');
        }

        const universidad = await this.universidadRepository.obtenerPorId(id);
        if (!universidad) {
            throw new Error(`Universidad con ID ${id} no encontrada`);
        }

        return universidad;
    }

    async obtenerTodos(filtro: FiltroUniversidadesDto): Promise<{ universidades: Universidad[]; total: number }> {
        const pagina = filtro.pagina || 1;
        const limite = filtro.limite || 10;

        if (pagina < 1) {
            throw new Error('La página debe ser mayor a 0');
        }

        if (limite < 1 || limite > 1000) {
            throw new Error('El límite debe estar entre 1 y 1000');
        }

        // Si se especifica un paisId, validar que existe
        if (filtro.paisId && filtro.paisId > 0) {
            const paisExiste = await this.paisRepository.obtenerPorId(filtro.paisId);
            if (!paisExiste) {
                throw new Error(`País con ID ${filtro.paisId} no encontrado`);
            }
        }

        return this.universidadRepository.obtenerTodos(
            filtro.paisId,
            filtro.estado || 'Activo',
            filtro.busqueda,
            pagina,
            limite
        );
    }

    async obtenerPorPais(paisId: number): Promise<Universidad[]> {
        if (isNaN(paisId) || paisId < 1) {
            throw new Error('ID de país inválido');
        }

        // Validar que el país existe
        const paisExiste = await this.paisRepository.obtenerPorId(paisId);
        if (!paisExiste) {
            throw new Error(`País con ID ${paisId} no encontrado`);
        }

        return this.universidadRepository.obtenerPorPais(paisId);
    }

    async actualizar(id: number, dto: ActualizarUniversidadDto): Promise<Universidad> {
        await this.obtenerPorId(id); // Validar que existe

        if (dto.nombre && dto.nombre.trim() === '') {
            throw new Error('El nombre de la universidad no puede estar vacío');
        }

        // Si se especifica otro país, validar que existe
        if (dto.paisId && dto.paisId > 0) {
            const paisExiste = await this.paisRepository.obtenerPorId(dto.paisId);
            if (!paisExiste) {
                throw new Error(`País con ID ${dto.paisId} no encontrado`);
            }
        }

        const universidadActualizada = new Universidad({
            nombre: dto.nombre?.trim(),
            paisId: dto.paisId,
            estado: dto.estado,
        });

        return this.universidadRepository.actualizar(id, universidadActualizada);
    }

    async eliminar(id: number): Promise<void> {
        await this.obtenerPorId(id); // Validar que existe
        await this.universidadRepository.eliminar(id);
    }
}
