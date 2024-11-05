export function InteractiveCanvas() {
  return (
    <mesh position={[-0.3, 3.8, 0.46]} rotation-x={-0.2}>
      <planeGeometry args={[3.3, 4.5]} />
      <meshBasicMaterial color="pink" />
    </mesh>
  );
}
