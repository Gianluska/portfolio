import { AsciiBirdFlocks } from './AsciiBirdFlocks'
import { AsciiBoat } from './AsciiBoat'
import { AsciiBreezes } from './AsciiBreezes'
import { AsciiRiverAir } from './AsciiRiverAir';

/** Decorations share the water's clock; no additional animation loop or DOM. */
export class AsciiAtmosphere {
  private readonly wind = new AsciiBreezes()
  private readonly birds = new AsciiBirdFlocks()
  private readonly air = new AsciiRiverAir()
  readonly boat = new AsciiBoat()
  readonly breezes = this.wind.fields

  /** Air/wind/birds start after full reveal; the ship's clock starts at bottom contact. */
  update(
    time: number, boatTime: number, width: number, height: number, enabled: boolean,
    pointerX = Number.NaN, pointerY = Number.NaN,
  ): void {
    this.wind.update(time, width, height, enabled)
    this.air.update(time, width, height, enabled)
    // The pointer steers the boat; only the boat frightens the birds.
    this.boat.update(boatTime, width, height, enabled, pointerX, pointerY)
    const boat = this.boat
    this.birds.update(
      time, width, height, enabled,
      boat.active ? boat.x : Number.NaN, boat.active ? boat.y : Number.NaN,
    )
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.air.drawMist(ctx)
    this.wind.draw(ctx)
    // The boat sits on the water; birds fly over it.
    this.boat.draw(ctx)
    this.air.drawMotes(ctx)
    this.birds.draw(ctx)
  }
}
