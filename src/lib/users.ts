import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PublicUser, UserRole } from "./user-types";

export type { PublicUser, UserRole };

export type StoredUser = {
  id: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
  email?: string;
  username?: string;
  phone?: string;
  address?: string;
};

type UserStore = {
  users: StoredUser[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const DEFAULT_MERCHANT_USERNAME = "admin";
const DEFAULT_MERCHANT_PASSWORD = "admin";
const SEED_MERCHANT_ID = "merchant-admin";

function looksLikeBcryptHash(s: string): boolean {
  return /^\$2[aby]?\$\d{2}\$/.test(s);
}

function merchantUsernameKey(username: string | undefined): string {
  return (username ?? "").trim().toLowerCase();
}

async function readRaw(): Promise<UserStore> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as UserStore;
    if (!parsed || !Array.isArray(parsed.users)) return { users: [] };
    return parsed;
  } catch {
    return { users: [] };
  }
}

async function writeRaw(store: UserStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function ensureDefaultMerchant(): Promise<void> {
  const store = await readRaw();
  let changed = false;

  const adminIdx = store.users.findIndex(
    (u) =>
      u.role === "merchant" &&
      merchantUsernameKey(u.username) === DEFAULT_MERCHANT_USERNAME,
  );

  if (adminIdx < 0) {
    store.users.push({
      id: SEED_MERCHANT_ID,
      role: "merchant",
      username: DEFAULT_MERCHANT_USERNAME,
      passwordHash: bcrypt.hashSync(DEFAULT_MERCHANT_PASSWORD, 10),
      createdAt: new Date().toISOString(),
    });
    changed = true;
  } else {
    const u = store.users[adminIdx];
    const h = u.passwordHash ?? "";
    const hashBroken = !h || !looksLikeBcryptHash(h);
    if (hashBroken) {
      store.users[adminIdx] = {
        ...u,
        username: DEFAULT_MERCHANT_USERNAME,
        passwordHash: bcrypt.hashSync(DEFAULT_MERCHANT_PASSWORD, 10),
      };
      changed = true;
    }
  }

  if (changed) await writeRaw(store);
}

export async function findMerchantByUsername(
  username: string,
): Promise<StoredUser | null> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  const key = username.trim().toLowerCase();
  return (
    store.users.find(
      (u) => u.role === "merchant" && merchantUsernameKey(u.username) === key,
    ) ?? null
  );
}

export async function findConsumerByEmail(
  email: string,
): Promise<StoredUser | null> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  const key = normalizeEmail(email);
  return (
    store.users.find(
      (u) => u.role === "consumer" && normalizeEmail(u.email ?? "") === key,
    ) ?? null
  );
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  return store.users.find((u) => u.id === id) ?? null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.trim();
}

export async function createConsumer(
  email: string,
  plainPassword: string,
  phone: string,
  address: string,
): Promise<StoredUser> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  const norm = normalizeEmail(email);
  if (!norm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    throw new Error("invalid_email");
  }
  const exists = store.users.some(
    (u) => u.role === "consumer" && normalizeEmail(u.email ?? "") === norm,
  );
  if (exists) throw new Error("email_taken");
  if (plainPassword.length < 6) throw new Error("password_short");
  const p = normalizePhone(phone);
  if (p.length < 6) throw new Error("invalid_phone");
  const a = address.trim();
  if (a.length < 2) throw new Error("invalid_address");
  const passwordHash = bcrypt.hashSync(plainPassword, 10);
  const user: StoredUser = {
    id: randomUUID(),
    role: "consumer",
    email: norm,
    phone: p,
    address: a,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  await writeRaw(store);
  return user;
}

export async function updateConsumerProfile(
  userId: string,
  phone: string,
  address: string,
): Promise<StoredUser | null> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  const idx = store.users.findIndex(
    (u) => u.id === userId && u.role === "consumer",
  );
  if (idx < 0) return null;
  const p = normalizePhone(phone);
  if (p.length < 6) throw new Error("invalid_phone");
  const a = address.trim();
  if (a.length < 2) throw new Error("invalid_address");
  store.users[idx] = {
    ...store.users[idx],
    phone: p,
    address: a,
  };
  await writeRaw(store);
  return store.users[idx];
}

export async function updateConsumerPassword(
  userId: string,
  oldPlain: string,
  newPlain: string,
): Promise<boolean> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  const idx = store.users.findIndex(
    (u) => u.id === userId && u.role === "consumer",
  );
  if (idx < 0) return false;
  const u = store.users[idx];
  if (!(await verifyPassword(oldPlain, u.passwordHash))) return false;
  if (newPlain.length < 6) throw new Error("password_short");
  store.users[idx] = {
    ...u,
    passwordHash: bcrypt.hashSync(newPlain, 10),
  };
  await writeRaw(store);
  return true;
}

export function toPublicUser(u: StoredUser): PublicUser {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

export async function listAllUsersPublic(): Promise<PublicUser[]> {
  await ensureDefaultMerchant();
  const store = await readRaw();
  return store.users.map(toPublicUser);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!hash || typeof hash !== "string") return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
