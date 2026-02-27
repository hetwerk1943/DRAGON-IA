import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

// In-memory store for demo; replace with database in production
const users: Map<string, User> = new Map();

export class AuthService {
  async register(email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const existing = Array.from(users.values()).find(u => u.email === email);
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    users.set(user.id, user);
    logger.info(`User registered: ${email}`);

    const token = this.generateToken(user);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...userWithoutPassword } = user;
    logger.info(`User logged in: ${email}`);
    return { user: userWithoutPassword, token };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  async getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = users.get(id);
    if (!user) return null;
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
