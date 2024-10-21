import gsap from "gsap";
import type { AmbientLight, SpotLight } from "three";
import { useGSAP } from "@gsap/react";

import { RefObject } from "react";

export function useSpotlightAnimation(
  spotLightRef: RefObject<SpotLight>,
  ambientLightRef: RefObject<AmbientLight>,
  isFinished: boolean
) {
  useGSAP(() => {
    if (isFinished && spotLightRef.current && ambientLightRef.current) {
      const INTRO_DURATION = 5.3;

      const timeline = gsap.timeline({ delay: INTRO_DURATION });

      timeline
        .to(spotLightRef.current, { duration: 0.1, intensity: 3.1 })
        .to(spotLightRef.current, { duration: 0.1, intensity: 0 })
        .to(spotLightRef.current, { duration: 0.1, intensity: 3.1 })
        .to(spotLightRef.current, { duration: 0.1, intensity: 0 })
        .to(spotLightRef.current, { duration: 2, intensity: 3.1 }, "+=0.35")
        .to(ambientLightRef.current, { duration: 2, intensity: 0.1 }, "<");
    }
  }, [isFinished, spotLightRef, ambientLightRef]);
}
