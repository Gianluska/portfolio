import { useGLTF } from "@react-three/drei";

export function Easel() {
  const { scene } = useGLTF('/models/easel.glb');
  const seila1 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/anvil/model.gltf');
  const seila2 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/ruins/model.gltf');
  const seila3 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/desk/model.gltf');
  const seila5 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/giraffe/model.gltf');
  const seila6 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/korrigan-wolf/model.gltf');
  const seila7 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/ankou-with-cart/model.gltf');
  const seila8 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/korrigan-taning/model.gltf');
  const seila9 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/old-korrigan/model.gltf');
  const seila10 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/druid/model.gltf');
  const seila11 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/barn/model.gltf');
  const seila12 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/turntable/model.gltf');
  const seila13 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table/model.gltf');
  const seila15 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/bunny/model.gltf');

  return (
    <group>
      <primitive object={scene} />
    </group>
  );
}