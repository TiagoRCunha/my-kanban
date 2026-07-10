export interface Repository<T, CreateInput, UpdateInput> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T>;
  create(input: CreateInput): Promise<T>;
  update(id: number, input: UpdateInput): Promise<T>;
  delete(id: number): Promise<void>;
}