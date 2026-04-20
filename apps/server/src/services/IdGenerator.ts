export class IdGenerator {
  private static instance: IdGenerator

  private constructor() {}

  public static getInstance(): IdGenerator {
    if (!IdGenerator.instance) {
      IdGenerator.instance = new IdGenerator()
    }
    return IdGenerator.instance
  }

  public generate(): string {
    return crypto.randomUUID()
  }

  public generateSessionCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }
}
