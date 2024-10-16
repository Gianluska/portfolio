import { useProgress } from "@react-three/drei";

export function LoadingScreen() {
  const { progress } = useProgress();

  return (
    <div className="bg-black fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center">
      <h1 className="text-white">Loading...</h1>
      <progress value={progress} max={100} />
    </div>
  );
}