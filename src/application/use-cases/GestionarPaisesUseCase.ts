import { injectable, inject } from 'tsyringe';
import { IPaisRepository } from '../../domain/repositories/IPaisRepository';
import { Pais } from '../../domain/entities/Pais';
import { CrearPaisDto, ActualizarPaisDto, FiltroPaisesDto } from '../../application/dtos/PaisDtos';

@injectable()
export class GestionarPaisesUseCase {
    constructor(
        @inject('IPaisRepository')
        private paisRepository: IPaisRepository
    ) { }

    async crear(dto: CrearPaisDto): Promise<Pais> {
        if (!dto.nombre || dto.nombre.trim() === '') {
            throw new Error('El nombre del país es requerido');
        }

        const pais = new Pais({
            nombre: dto.nombre.trim(),
            codigo_iso: dto.codigo_iso?.toUpperCase(),
            estado: 'Activo',
            creadoEn: new Date(),
        });

        return this.paisRepository.crear(pais);
    }

    async obtenerPorId(id: number): Promise<Pais> {
        if (isNaN(id) || id < 1) {
            throw new Error('ID de país inválido');
        }

        const pais = await this.paisRepository.obtenerPorId(id);
        if (!pais) {
            throw new Error(`País con ID ${id} no encontrado`);
        }

        return pais;
    }

    async obtenerTodos(filtro: FiltroPaisesDto): Promise<{ paises: Pais[]; total: number }> {
        const pagina = filtro.pagina || 1;
        const limite = filtro.limite || 10;

        if (pagina < 1) {
            throw new Error('La página debe ser mayor a 0');
        }

        if (limite < 1 || limite > 100) {
            throw new Error('El límite debe estar entre 1 y 100');
        }

        return this.paisRepository.obtenerTodos(
            filtro.estado || 'Activo',
            filtro.busqueda,
            pagina,
            limite
        );
    }

    async actualizar(id: number, dto: ActualizarPaisDto): Promise<Pais> {
        await this.obtenerPorId(id); // Validar que existe

        if (dto.nombre && dto.nombre.trim() === '') {
            throw new Error('El nombre del país no puede estar vacío');
        }

        const paisActualizado = new Pais({
            nombre: dto.nombre?.trim(),
            codigo_iso: dto.codigo_iso?.toUpperCase(),
            estado: dto.estado,
        });

        return this.paisRepository.actualizar(id, paisActualizado);
    }

    async eliminar(id: number): Promise<void> {
        await this.obtenerPorId(id); // Validar que existe
        await this.paisRepository.eliminar(id);
    }
}
