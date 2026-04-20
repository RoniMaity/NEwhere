export abstract class BaseRepository<T extends { id: string }> {
  abstract findById(id: string): Promise<T | undefined> | T | undefined
  abstract save(entity: T): Promise<void> | void
  abstract delete(id: string): Promise<void> | void
  abstract findAll(): Promise<T[]> | T[]
}
