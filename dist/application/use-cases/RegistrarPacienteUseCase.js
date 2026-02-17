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
exports.RegistrarPacienteUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let RegistrarPacienteUseCase = class RegistrarPacienteUseCase {
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
        // Validar que no exista usuario ACTIVO con este email
        // Esto permite re-registro si la cuenta anterior fue eliminada
        const emailActivo = await this.usuarioRepository.existeEmailActivo(email);
        if (emailActivo) {
            throw new Error('El email ya está registrado');
        }
        // Hashear contraseña
        const hashedPassword = await this.passwordHasher.hash(dto.password);
        try {
            // Subir archivos a Supabase (foto de perfil opcional)
            let fotoPerfilUrl = null;
            if (files.fotoPerfil?.[0]) {
                fotoPerfilUrl = await this.storageService.uploadFile(files.fotoPerfil[0].buffer, `patients/${email}/profile.jpg`, 'public-assets', files.fotoPerfil[0].mimetype);
            }
            let fotoDocumentoPath = null;
            if (files.fotoDocumento?.[0]) {
                fotoDocumentoPath = await this.storageService.uploadFile(files.fotoDocumento[0].buffer, `patients/${email}/document.jpg`, 'secure-documents', files.fotoDocumento[0].mimetype);
            }
            // Persistir en base de datos
            await this.usuarioRepository.savePaciente({
                email,
                password: hashedPassword,
                rol: 'Paciente',
                paciente: {
                    nombre: dto.nombre,
                    apellido: dto.apellido,
                    numero_documento_identificacion: dto.numero_documento,
                    tipo_documento_identificacion: dto.tipo_documento,
                    foto_documento: fotoDocumentoPath ?? null,
                    foto_perfil: fotoPerfilUrl ?? undefined,
                    fecha_nacimiento: dto.fecha_nacimiento,
                    genero: dto.genero,
                    altura: dto.altura, // Guardar directamente en CM
                    peso: dto.peso,
                    tipo_sangre: dto.tipo_sangre,
                },
            });
        }
        catch (error) {
            // Manejar errores de overflow de base de datos
            if (error.message && error.message.includes('numeric field overflow')) {
                // Detectar qué campo causó el overflow basándose en el mensaje de error
                if (error.message.includes('precision 4, scale 2')) {
                    throw new Error('La altura excede el límite permitido.');
                }
                else if (error.message.includes('precision 5, scale 2')) {
                    throw new Error('El peso no puede exceder 999.99 kg. Por favor, ingresa un valor válido.');
                }
                else {
                    throw new Error('Uno de los valores numéricos ingresados excede el límite permitido.');
                }
            }
            // Aquí podrías implementar limpieza de archivos subidos en caso de error
            throw error;
        }
    }
};
exports.RegistrarPacienteUseCase = RegistrarPacienteUseCase;
exports.RegistrarPacienteUseCase = RegistrarPacienteUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __param(2, (0, tsyringe_1.inject)('StorageService')),
    __param(3, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __metadata("design:paramtypes", [Object, Object, Object, AuthService_1.AuthService])
], RegistrarPacienteUseCase);
