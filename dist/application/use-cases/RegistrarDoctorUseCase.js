"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrarDoctorUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let RegistrarDoctorUseCase = class RegistrarDoctorUseCase {
    constructor(usuarioRepository, especialidadRepository, passwordHasher, storageService, authService) {
        this.usuarioRepository = usuarioRepository;
        this.especialidadRepository = especialidadRepository;
        this.passwordHasher = passwordHasher;
        this.storageService = storageService;
        this.authService = authService;
    }
    async execute(dto, files, token) {
        // Validar token y obtener email. Soportar token de registro estándar y token de registro desde Google
        let email = await this.authService.validateRegistrationToken(token);
        if (!email) {
            const googlePayload = this.authService.validateGoogleRegistrationToken(token);
            if (googlePayload) {
                email = googlePayload.email;
            }
        }
        if (!email) {
            throw new Error('Token inválido o expirado');
        }
        // Validar que no exista usuario ACTIVO con este email
        // Esto permite re-registro si la cuenta anterior fue eliminada
        const emailActivo = await this.usuarioRepository.existeEmailActivo(email);
        if (emailActivo) {
            throw new Error('El email ya está registrado');
        }
        // Validar que no exista doctor con el mismo número de documento
        const documentoExistente = await this.usuarioRepository.existeDoctorConNumeroDocumento(dto.numero_documento);
        if (documentoExistente) {
            throw new Error('Ya existe un doctor registrado con este número de documento. Por favor, verifica tus datos o contacta con soporte si crees que esto es un error.');
        }
        // Validar que no exista doctor con el mismo exequatur
        const exequaturExistente = await this.usuarioRepository.existeDoctorConExequatur(dto.exequatur);
        if (exequaturExistente) {
            throw new Error('Ya existe un doctor registrado con este número de exequatur. Por favor, verifica tus datos o contacta con soporte si crees que esto es un error.');
        }
        // Validar que la especialidad principal exista
        const especialidadPrincipal = await this.especialidadRepository.obtenerPorId(dto.id_especialidad_principal);
        if (!especialidadPrincipal) {
            throw new Error(`La especialidad principal con ID ${dto.id_especialidad_principal} no existe. Por favor, selecciona una especialidad válida.`);
        }
        // Validar que las especialidades secundarias existan (si se proporcionan)
        if (dto.ids_especialidades_secundarias && dto.ids_especialidades_secundarias.length > 0) {
            for (const idEspecialidad of dto.ids_especialidades_secundarias) {
                const especialidadSecundaria = await this.especialidadRepository.obtenerPorId(idEspecialidad);
                if (!especialidadSecundaria) {
                    throw new Error(`La especialidad secundaria con ID ${idEspecialidad} no existe. Por favor, verifica las especialidades seleccionadas.`);
                }
            }
            // Validación de negocio: la especialidad principal NO debe estar en las secundarias
            if (dto.ids_especialidades_secundarias.includes(dto.id_especialidad_principal)) {
                throw new Error('La especialidad principal no puede estar incluida en las especialidades secundarias');
            }
        }
        // VALIDACIONES DE ARCHIVOS MÚLTIPLES
        const MAX_FOTO_DOCUMENTO = 2;
        const MAX_TITULO_ACADEMICO = 10;
        // fotoPerfil y certificaciones son opcionales
        // Validar archivos requeridos
        if (!files.fotoDocumento || files.fotoDocumento.length === 0) {
            throw new Error('Al menos una foto de documento es requerida');
        }
        if (files.fotoDocumento.length > MAX_FOTO_DOCUMENTO) {
            throw new Error(`Máximo ${MAX_FOTO_DOCUMENTO} fotos de documento permitidas`);
        }
        if (!files.tituloAcademico || files.tituloAcademico.length === 0) {
            throw new Error('Al menos un título académico es requerido');
        }
        if (files.tituloAcademico.length > MAX_TITULO_ACADEMICO) {
            throw new Error(`Máximo ${MAX_TITULO_ACADEMICO} títulos académicos permitidos`);
        }
        // Hashear contraseña
        const hashedPassword = await this.passwordHasher.hash(dto.password);
        try {
            // Subir foto de perfil (opcional)
            let fotoPerfilUrl = null;
            if (files.fotoPerfil?.[0]) {
                fotoPerfilUrl = await this.storageService.uploadFile(files.fotoPerfil[0].buffer, `doctors/${email}/profile.jpg`, 'public-assets', files.fotoPerfil[0].mimetype);
            }
            // Subir múltiples fotos de documento (en paralelo)
            const fotosDocumentoPromises = files.fotoDocumento.map((file, index) => this.storageService.uploadFile(file.buffer, `doctors/${email}/documents/document-${index + 1}.${this.getExtension(file.mimetype)}`, 'secure-documents', file.mimetype).then(url => ({
                tipo_documento: 'foto_documento',
                url_archivo: url,
                nombre_original: file.originalname,
                tipo_mime: file.mimetype,
                tamanio_bytes: file.size,
                descripcion: dto.descripciones_documentos?.[index] || null,
            })));
            // Subir múltiples títulos académicos (en paralelo)
            const titulosAcademicosPromises = files.tituloAcademico.map((file, index) => this.storageService.uploadFile(file.buffer, `doctors/${email}/titles/title-${index + 1}.${this.getExtension(file.mimetype)}`, 'secure-documents', file.mimetype).then(url => ({
                tipo_documento: 'titulo_academico',
                url_archivo: url,
                nombre_original: file.originalname,
                tipo_mime: file.mimetype,
                tamanio_bytes: file.size,
                descripcion: dto.descripciones_titulos?.[index] || null,
            })));
            // Subir múltiples certificaciones (en paralelo) - opcional
            let certificacionesPromises = [];
            if (files.certificaciones && files.certificaciones.length > 0) {
                certificacionesPromises = files.certificaciones.map((file, index) => this.storageService.uploadFile(file.buffer, `doctors/${email}/certifications/cert-${index + 1}.${this.getExtension(file.mimetype)}`, 'secure-documents', file.mimetype).then(url => ({
                    tipo_documento: 'certificacion',
                    url_archivo: url,
                    nombre_original: file.originalname,
                    tipo_mime: file.mimetype,
                    tamanio_bytes: file.size,
                    descripcion: dto.descripciones_certificaciones?.[index] || null,
                })));
            }
            // Esperar a que todos los archivos se suban en paralelo
            const [fotosDocumento, titulosAcademicos, certificaciones] = await Promise.all([
                Promise.all(fotosDocumentoPromises),
                Promise.all(titulosAcademicosPromises),
                certificacionesPromises.length > 0 ? Promise.all(certificacionesPromises) : Promise.resolve([]),
            ]);
            // Combinar todos los documentos
            const todosLosDocumentos = [
                ...fotosDocumento,
                ...titulosAcademicos,
                ...certificaciones,
            ];
            // Persistir en base de datos (transacción atómica)
            await this.usuarioRepository.saveDoctorWithDocuments({
                email,
                password: hashedPassword,
                rol: 'Doctor',
                doctor: {
                    nombre: dto.nombre,
                    apellido: dto.apellido,
                    genero: dto.genero,
                    fecha_nacimiento: dto.fecha_nacimiento,
                    nacionalidad: dto.nacionalidad,
                    telefono: dto.telefono,
                    tipo_documento_identificacion: dto.tipo_documento,
                    numero_documento_identificacion: dto.numero_documento,
                    foto_perfil: fotoPerfilUrl,
                    exequatur: dto.exequatur,
                    biografia: dto.biografia || '',
                    estado_verificacion: 'En revisión',
                },
                formaciones: dto.formaciones || [],
                id_especialidad_principal: dto.id_especialidad_principal,
                ids_especialidades_secundarias: dto.ids_especialidades_secundarias || [],
                documentos: todosLosDocumentos,
            });
        }
        catch (error) {
            // Aquí podrías implementar limpieza de archivos subidos en caso de error
            throw error;
        }
    }
    getExtension(mimeType) {
        const map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
        };
        return map[mimeType] || 'bin';
    }
};
exports.RegistrarDoctorUseCase = RegistrarDoctorUseCase;
exports.RegistrarDoctorUseCase = RegistrarDoctorUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('EspecialidadRepository')),
    __param(2, (0, tsyringe_1.inject)('PasswordHasher')),
    __param(3, (0, tsyringe_1.inject)('StorageService')),
    __param(4, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, AuthService_1.AuthService])
], RegistrarDoctorUseCase);
