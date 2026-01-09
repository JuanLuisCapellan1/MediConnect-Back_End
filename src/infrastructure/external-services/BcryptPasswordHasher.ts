import { hash, compare } from 'bcryptjs';
import { injectable } from 'tsyringe';
import { IPasswordHasher } from '../../application/interfaces/IPasswordHasher';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');

  async hash(password: string): Promise<string> {
    return hash(password, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}