import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { useProgress } from "@react-three/drei";

import { DecoderText } from "@components/DecoderText";

export function LoadingScreen() {
  const { total } = useProgress();

  const totalPercentage = (total / 64) * 100;

  const [stopShuffle, setStopShuffle] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const loadingScreenRef = useRef<HTMLDivElement>(null);
  const decoderTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (totalPercentage >= 100) {
      setTimeout(() => {
        setStopShuffle(true);
      }, 2500)

      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          duration: 1,
          opacity: 0,
          y: 20,
          ease: "power2.inOut",
          delay: 1,
        });
      }

      if (decoderTextRef.current) {
        gsap.to(decoderTextRef.current, {
          duration: 1,
          y: 20,
          ease: "power2.inOut",
          delay: 1.2,
        });
      }

      if (loadingScreenRef.current) {
        gsap.to(loadingScreenRef.current, {
          duration: 1,
          opacity: 0,
          delay: 6,
          onComplete: () => {
            if (loadingScreenRef.current) {
              loadingScreenRef.current.style.display = "none";
            }
          },
        });
      }
    }
  }, [totalPercentage]);

  return (
    <div
      ref={loadingScreenRef}
      className="bg-black fixed inset-0 flex justify-center items-center flex-col"
    >
      <div ref={decoderTextRef}>
        <DecoderText
          text="lvsk"
          speed={2000}
          className="text-white flex text-center"
          stopShuffle={stopShuffle}
        />
      </div>
      <div className="w-44 h-0.5 bg-gray-800 mt-4" ref={progressBarRef}>
        <div
          className="bg-white h-0.5"
          style={{ width: `${totalPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
