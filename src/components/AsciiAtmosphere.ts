import { AsciiBirdFlocks } from './AsciiBirdFlocks'
import { AsciiBoat } from './AsciiBoat'
import { AsciiBreezes } from './AsciiBreezes'
import { AsciiRiverAir } from './AsciiRiverAir'
import { HORIZON } from './AsciiPerspective'

/** Decorations share the water's clock; no additional animation loop or DOM. */
export class AsciiAtmosphere {
  private readonly wind = new AsciiBreezes()
  private readonly birds = new AsciiBirdFlocks()
  private readonly air = new AsciiRiverAir()
  readonly boat = new AsciiBoat()
  readonly breezes = this.wind.fields

  /** The ship appears once the reveal reaches the horizon; other actors follow. */
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

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const horizon = height * HORIZON
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, horizon, width, height - horizon)
    ctx.clip()
    this.wind.draw(ctx)
    this.air.drawMist(ctx)
    ctx.restore()
    this.boat.draw(ctx)
    this.air.drawMotes(ctx)
    this.birds.draw(ctx)
  }
}
