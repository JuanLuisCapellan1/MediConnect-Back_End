import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IPaisRepository } from '../../domain/repositories/IPaisRepository';
import { Pais } from '../../domain/entities/Pais';
import { RedisCacheService } from '../external-services/RedisCacheService';

@injectable()
export class PrismaPaisRepository implements IPaisRepository {
    private readonly CACHE_KEY_LIST = 'paises:listado';
    private readonly CACHE_KEY_PREFIX = 'paises:';

    constructor(
        private prisma: PrismaClient,
        @inject(RedisCacheService) private redis: RedisCacheService
    ) { }

    async crear(pais: Pais): Promise<Pais> {
        const nuevoPais = await this.prisma.pais.create({
            data: {
                nombre: pais.nombre,
                codigo_iso: pais.codigo_iso,
                estado: pais.estado,
            },
        });

        // Invalidar caché de listado
        await this.redis.del(this.CACHE_KEY_LIST);

        return new Pais(nuevoPais);
    }

    async obtenerPorId(id: number): Promise<Pais | null> {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const pais = await this.prisma.pais.findUnique({
            where: { id },
        });

        if (pais) {
            const entidad = new Pais(pais);
            // Guardar en caché (TTL 1 hora)
            await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);
            return entidad;
        }

        return null;
    }

    async obtenerTodos(
        estado?: string,
        busqueda?: string,
        pagina: number = 1,
        limite: number = 10
    ): Promise<{ paises: Pais[]; total: number }> {
        // Si no hay filtros específicos, intentar obtener de caché
        if (!estado && !busqueda && pagina === 1 && limite === 10) {
            const cached = await this.redis.get(this.CACHE_KEY_LIST);
            if (cached) return JSON.parse(cached);
        }

        const where: any = {};

        if (estado) {
            where.estado = estado;
        }

        if (busqueda) {
            where.OR = [
                {
                    nombre: {
                        contains: busqueda,
                        mode: 'insensitive',
                    },
                },
                {
                    codigo_iso: {
                        contains: busqueda,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const [paises, total] = await Promise.all([
            this.prisma.pais.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { nombre: 'asc' },
            }),
            this.prisma.pais.count({ where }),
        ]);

        const resultado = {
            paises: paises.map(p => new Pais(p)),
            total,
        };

        // Guardar en caché solo si es la consulta por defecto
        if (!estado && !busqueda && pagina === 1 && limite === 10) {
            await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
        }

        return resultado;
    }

    async actualizar(id: number, pais: Partial<Pais>): Promise<Pais> {
        const paisActualizado = await this.prisma.pais.update({
            where: { id },
            data: {
                nombre: pais.nombre,
                codigo_iso: pais.codigo_iso,
                estado: pais.estado,
            },
        });

        // Invalidar caché del registro específico y del listado
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);

        return new Pais(paisActualizado);
    }

    async eliminar(id: number): Promise<void> {
        await this.prisma.pais.update({
            where: { id },
            data: { estado: 'Inactivo' },
        });

        // Invalidar caché del registro específico y del listado
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
    }
}
