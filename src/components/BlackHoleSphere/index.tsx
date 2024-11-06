export function BlackHoleSphere() {
  return (
    <mesh scale={[0.5, 0.5, 0.5]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#000000" />
    </mesh>
  );
}
