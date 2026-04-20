import { InputEvent } from '@newhere/shared'

export interface InputSimulator {
  simulate(event: InputEvent): Promise<string | undefined>
}
