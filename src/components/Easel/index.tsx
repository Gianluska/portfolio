import { useGLTF } from "@react-three/drei";

export function Easel() {
  // const { scene } = useGLTF('/models/easel.glb');

  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila1 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/anvil/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila2 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/ruins/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila3 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/desk/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila5 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/giraffe/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila6 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/korrigan-wolf/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila7 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/ankou-with-cart/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila8 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/korrigan-taning/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila9 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/old-korrigan/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila10 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/druid/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila11 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/barn/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila12 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/turntable/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila13 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table/model.gltf');
  // @ts-expect-error - this is a hack to get around the fact that the useGLTF hook doesn't support loading from URLs
  const seila15 = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/bunny/model.gltf');

  return (
    <group>
      {/* <primitive object={scene} /> */}
    </group>
  );
}