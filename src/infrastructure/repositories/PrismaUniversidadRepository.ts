import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IUniversidadRepository } from '../../domain/repositories/IUniversidadRepository';
import { Universidad } from '../../domain/entities/Universidad';
import { RedisCacheService } from '../external-services/RedisCacheService';

@injectable()
export class PrismaUniversidadRepository implements IUniversidadRepository {
    private readonly CACHE_KEY_LIST = 'universidades:listado';
    private readonly CACHE_KEY_PREFIX = 'universidades:';
    private readonly CACHE_KEY_POR_PAIS = 'universidades:pais:';

    constructor(
        private prisma: PrismaClient,
        @inject(RedisCacheService) private redis: RedisCacheService
    ) { }

    async crear(universidad: Universidad): Promise<Universidad> {
        const nuevaUniversidad = await this.prisma.universidad.create({
            data: {
                paisId: universidad.paisId,
                nombre: universidad.nombre,
                estado: universidad.estado,
            },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });

        // Invalidar caché de listado y por país
        await this.redis.del(this.CACHE_KEY_LIST);
        await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidad.paisId}`);

        return new Universidad(nuevaUniversidad);
    }

    async obtenerPorId(id: number): Promise<Universidad | null> {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const universidad = await this.prisma.universidad.findUnique({
            where: { id },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
                formaciones: {
                    where: { estado: 'Activo' },
                },
            },
        });

        if (universidad) {
            const entidad = new Universidad(universidad);
            // Guardar en caché (TTL 1 hora)
            await this.redis.set(cacheKey, JSON.stringify(entidad), 3600);
            return entidad;
        }

        return null;
    }

    async obtenerTodos(
        paisId?: number,
        estado?: string,
        busqueda?: string,
        pagina: number = 1,
        limite: number = 10
    ): Promise<{ universidades: Universidad[]; total: number }> {
        // Si no hay filtros específicos, intentar obtener de caché
        if (!paisId && !estado && !busqueda && pagina === 1 && limite === 10) {
            const cached = await this.redis.get(this.CACHE_KEY_LIST);
            if (cached) return JSON.parse(cached);
        }

        const where: any = {};

        if (paisId) {
            where.paisId = paisId;
        }

        if (estado) {
            where.estado = estado;
        }

        if (busqueda) {
            where.nombre = {
                contains: busqueda,
                mode: 'insensitive',
            };
        }

        const [universidades, total] = await Promise.all([
            this.prisma.universidad.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { nombre: 'asc' },
                include: {
                    pais: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            }),
            this.prisma.universidad.count({ where }),
        ]);

        const resultado = {
            universidades: universidades.map(u => new Universidad(u)),
            total,
        };

        // Guardar en caché solo si es la consulta por defecto
        if (!paisId && !estado && !busqueda && pagina === 1 && limite === 10) {
            await this.redis.set(this.CACHE_KEY_LIST, JSON.stringify(resultado), 3600);
        }

        return resultado;
    }

    async obtenerPorPais(paisId: number): Promise<Universidad[]> {
        // Intentar obtener de caché
        const cacheKey = `${this.CACHE_KEY_POR_PAIS}${paisId}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const universidades = await this.prisma.universidad.findMany({
            where: {
                paisId,
                estado: 'Activo',
            },
            orderBy: { nombre: 'asc' },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });

        const resultado = universidades.map(u => new Universidad(u));
        // Guardar en caché (TTL 1 hora)
        await this.redis.set(cacheKey, JSON.stringify(resultado), 3600);

        return resultado;
    }

    async actualizar(id: number, universidad: Partial<Universidad>): Promise<Universidad> {
        // Obtener la universidad actual para invalidar caché de país
        const universidadActual = await this.prisma.universidad.findUnique({
            where: { id },
        });

        const universidadActualizada = await this.prisma.universidad.update({
            where: { id },
            data: {
                nombre: universidad.nombre,
                paisId: universidad.paisId,
                estado: universidad.estado,
            },
            include: {
                pais: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });

        // Invalidar caché del registro y caché de país (tanto anterior como nuevo)
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        if (universidadActual) {
            await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidadActual.paisId}`);
        }
        await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidad.paisId}`);

        return new Universidad(universidadActualizada);
    }

    async eliminar(id: number): Promise<void> {
        // Obtener la universidad actual para invalidar caché de país
        const universidad = await this.prisma.universidad.findUnique({
            where: { id },
        });

        await this.prisma.universidad.update({
            where: { id },
            data: { estado: 'Inactivo' },
        });

        // Invalidar caché del registro y del país
        await this.redis.del(`${this.CACHE_KEY_PREFIX}${id}`);
        await this.redis.del(this.CACHE_KEY_LIST);
        if (universidad) {
            await this.redis.del(`${this.CACHE_KEY_POR_PAIS}${universidad.paisId}`);
        }
    }
}
