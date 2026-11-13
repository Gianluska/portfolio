import { AsciiBirdFlocks } from './AsciiBirdFlocks'
import { AsciiBreezes } from './AsciiBreezes'

/** Decorations share the water's clock; no additional animation loop or DOM. */
export class AsciiAtmosphere {
  private readonly wind = new AsciiBreezes()
  private readonly birds = new AsciiBirdFlocks()
  readonly breezes = this.wind.fields

  /** Seconds since the impact wave finished revealing the surface. */
  update(time: number, width: number, height: number, enabled: boolean): void {
    this.wind.update(time, width, height, enabled)
    this.birds.update(time, width, height, enabled)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.wind.draw(ctx)
    this.birds.draw(ctx)
  }
}
