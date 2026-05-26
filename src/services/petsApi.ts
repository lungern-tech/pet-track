import { requestManager } from './RequestManager';

export type CreatePetPayload = {
  name: string;
  linkedDeviceId: number;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  avatarUrl: string;
  notes: string;
};

export type PetRecord = {
  id: number;
  linkedDeviceId: number | null;
  name: string;
  species: string;
  breed: string;
  gender: 'male' | 'female' | string;
  birthDate: string;
  avatarUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function pickString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function pickId(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  const o = asRecord(v);
  if (o) {
    const inner = o.id ?? o.value;
    return pickId(inner);
  }
  return null;
}

function pickName(v: unknown): string {
  if (typeof v === 'string') return v;
  const o = asRecord(v);
  if (!o) return '';
  if (typeof o.name === 'string') return o.name;
  if (typeof o.label === 'string') return o.label;
  if (typeof o.value === 'string') return o.value;
  return '';
}

function normalizePet(raw: unknown): PetRecord {
  const root = asRecord(raw) ?? {};
  const inner = (asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root) as Record<
    string,
    unknown
  >;

  const id = pickId(inner.id) ?? 0;
  const linkedDeviceId = pickId(inner.linkedDeviceId);
  const name = pickString(inner.name);
  const species = pickName(inner.species);
  const breed = pickName(inner.breed);
  const gender = pickName(inner.gender) || pickString(inner.gender);
  const birthDate = pickString(inner.birthDate);
  const avatarUrl = pickName(inner.avatarUrl) || pickString(inner.avatarUrl);
  const notes = pickName(inner.notes) || pickString(inner.notes);
  const createdAt = pickString(inner.createdAt);
  const updatedAt = pickString(inner.updatedAt);

  return {
    id,
    linkedDeviceId,
    name,
    species,
    breed,
    gender,
    birthDate,
    avatarUrl,
    notes,
    createdAt,
    updatedAt,
  };
}

/** POST /pets（需登录态） */
export async function createPet(payload: CreatePetPayload): Promise<PetRecord> {
  const raw = await requestManager.post<unknown>('/pets', payload);
  return normalizePet(raw);
}

function normalizePetsList(raw: unknown): PetRecord[] {
  if (Array.isArray(raw)) return raw.map(normalizePet);
  const root = asRecord(raw);
  if (!root) return [];
  const inner =
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(root.pets) && root.pets) ||
    (asRecord(root.data) && Array.isArray((root.data as any).items) && (root.data as any).items) ||
    null;
  if (Array.isArray(inner)) return inner.map(normalizePet);
  return [];
}

/** GET /pets（需登录态） */
export async function fetchPets(): Promise<PetRecord[]> {
  const raw = await requestManager.get<unknown>('/pets');
  return normalizePetsList(raw);
}

