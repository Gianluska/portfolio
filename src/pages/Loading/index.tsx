import { useProgress } from "@react-three/drei";

export function LoadingScreen() {
  const { progress } = useProgress();

  console.log(progress);
  
  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
}