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
    constructor(usuarioRepository, passwordHasher, storageService, authService) {
        this.usuarioRepository = usuarioRepository;
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
        // Validar que no exista usuario con este email
        const usuarioExistente = await this.usuarioRepository.buscarPorEmail(email);
        if (usuarioExistente) {
            throw new Error('El email ya está registrado');
        }
        // Hashear contraseña
        const hashedPassword = await this.passwordHasher.hash(dto.password);
        try {
            // Subir archivos a Supabase
            const fotoPerfilUrl = await this.storageService.uploadFile(files.fotoPerfil[0].buffer, `doctors/${email}/profile.jpg`, 'public-assets', files.fotoPerfil[0].mimetype);
            const fotoDocumentoPath = await this.storageService.uploadFile(files.fotoDocumento[0].buffer, `doctors/${email}/document.jpg`, 'secure-documents', files.fotoDocumento[0].mimetype);
            const tituloAcademicoPath = await this.storageService.uploadFile(files.tituloAcademico[0].buffer, `doctors/${email}/titulo.pdf`, 'secure-documents', files.tituloAcademico[0].mimetype);
            const certificacionesPath = await this.storageService.uploadFile(files.certificaciones[0].buffer, `doctors/${email}/certificaciones.pdf`, 'secure-documents', files.certificaciones[0].mimetype);
            // Persistir en base de datos (transacción atómica). Exequatur es solo el número (texto), no un archivo.
            await this.usuarioRepository.saveDoctor({
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
                    foto_documento: fotoDocumentoPath,
                    foto_perfil: fotoPerfilUrl,
                    exequatur: dto.exequatur,
                    biografia: dto.biografia || '',
                    titulo_academico: tituloAcademicoPath,
                    certificaciones_adicionales: certificacionesPath,
                    estado_verificacion: 'En revisión',
                },
                ubicacion: dto.ubicacion,
                formaciones: dto.formaciones,
            });
        }
        catch (error) {
            // Aquí podrías implementar limpieza de archivos subidos en caso de error
            throw error;
        }
    }
};
exports.RegistrarDoctorUseCase = RegistrarDoctorUseCase;
exports.RegistrarDoctorUseCase = RegistrarDoctorUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __param(2, (0, tsyringe_1.inject)('StorageService')),
    __param(3, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __metadata("design:paramtypes", [Object, Object, Object, AuthService_1.AuthService])
], RegistrarDoctorUseCase);
