import { AsciiBirdFlocks } from './AsciiBirdFlocks'
import { AsciiBoat } from './AsciiBoat'
import { AsciiBreezes } from './AsciiBreezes'

/** Decorations share the water's clock; no additional animation loop or DOM. */
export class AsciiAtmosphere {
  private readonly wind = new AsciiBreezes()
  private readonly birds = new AsciiBirdFlocks()
  readonly boat = new AsciiBoat()
  readonly breezes = this.wind.fields

  /** Seconds since the impact wave finished revealing the surface; pointer is NaN when absent. */
  update(
    time: number, width: number, height: number, enabled: boolean,
    pointerX = Number.NaN, pointerY = Number.NaN,
  ): void {
    this.wind.update(time, width, height, enabled)
    // The pointer steers the boat; only the boat frightens the birds.
    this.boat.update(time, width, height, enabled, pointerX, pointerY)
    const boat = this.boat
    this.birds.update(
      time, width, height, enabled,
      boat.active ? boat.x : Number.NaN, boat.active ? boat.y : Number.NaN,
    )
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.wind.draw(ctx)
    // The boat sits on the water; birds fly over it.
    this.boat.draw(ctx)
    this.birds.draw(ctx)
  }
}
