import { randomUUID } from "node:crypto";
import type { CreateUserInput, StudioUser, UpdateUserInput, UserStore } from "./types.js";

// In-memory UserStore for local dev (STORAGE_DRIVER=memory) and tests.
export class InMemoryUserStore implements UserStore {
  private readonly byId = new Map<string, StudioUser>();
  private readonly byEmail = new Map<string, string>();
  private readonly otps = new Map<string, { tokenHash: string; expiresAt: string }>();

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async findByEmail(email: string): Promise<StudioUser | null> {
    const id = this.byEmail.get(this.normalizeEmail(email));
    return id ? this.byId.get(id) ?? null : null;
  }

  async findById(id: string): Promise<StudioUser | null> {
    return this.byId.get(id) ?? null;
  }

  async create(input: CreateUserInput): Promise<StudioUser> {
    const email = this.normalizeEmail(input.email);
    const user: StudioUser = {
      id: randomUUID(),
      email,
      name: input.name ?? null,
      image: input.image ?? null,
      passwordHash: input.passwordHash ?? null,
      emailVerified: input.emailVerified ?? false,
      onboarded: false,
      headline: null,
      targetRole: null,
      industry: null,
      experienceLevel: null,
      createdAt: new Date().toISOString(),
    };
    this.byId.set(user.id, user);
    this.byEmail.set(email, user.id);
    return user;
  }

  async update(id: string, patch: UpdateUserInput): Promise<StudioUser> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error(`user not found: ${id}`);
    const updated: StudioUser = { ...existing, ...patch };
    this.byId.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.byId.get(id);
    if (!existing) return;
    this.byId.delete(id);
    this.byEmail.delete(existing.email);
  }

  async saveOtp(identifier: string, tokenHash: string, expiresAt: string): Promise<void> {
    this.otps.set(this.normalizeEmail(identifier), { tokenHash, expiresAt });
  }

  async consumeOtp(identifier: string, tokenHash: string): Promise<boolean> {
    const key = this.normalizeEmail(identifier);
    const record = this.otps.get(key);
    if (!record) return false;
    const valid = record.tokenHash === tokenHash && Date.parse(record.expiresAt) > Date.now();
    if (valid) this.otps.delete(key);
    return valid;
  }
}
