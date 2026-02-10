"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptPasswordHasher = void 0;
const bcryptjs_1 = require("bcryptjs");
const tsyringe_1 = require("tsyringe");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
let BcryptPasswordHasher = class BcryptPasswordHasher {
    constructor() {
        this.SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');
    }
    async hash(password) {
        return (0, bcryptjs_1.hash)(password, this.SALT_ROUNDS);
    }
    async compare(plain, hashed) {
        return (0, bcryptjs_1.compare)(plain, hashed);
    }
};
exports.BcryptPasswordHasher = BcryptPasswordHasher;
exports.BcryptPasswordHasher = BcryptPasswordHasher = __decorate([
    (0, tsyringe_1.injectable)()
], BcryptPasswordHasher);
