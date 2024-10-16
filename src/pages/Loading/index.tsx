import { useState } from "react";

import { useProgress } from "@react-three/drei";

import { DecoderText } from "@components/DecoderText";

export function LoadingScreen() {
  const { total } = useProgress();

  const [stopShuffle, setStopShuffle] = useState(false);

  const totalPercentage = (total / 64) * 100;

  return (
    <div className="bg-black fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center flex-col" onClick={() => setStopShuffle(!stopShuffle)}>
      <DecoderText text="lvsk" stopShuffle={stopShuffle} />
      <div className="w-44 h-0.5 bg-gray-950">
        <div className="bg-white h-0.5" style={{width : `${totalPercentage}%`}}></div>
      </div>
    </div>
  );
}
