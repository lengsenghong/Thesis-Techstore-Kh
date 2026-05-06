"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  glbPath: string;
  size?: number;
}

export default function MascotViewer({ glbPath, size = 200 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = mountRef.current;
    if (!el) return;

    let cancelled = false;
    let rafId = 0;

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader, DRACOLoader } = await import("three-stdlib");
        if (cancelled) return;

        // Render at min 256px internally, CSS-scale down to `size`
        const RENDER = Math.max(size, 256);

        const renderer = new THREE.WebGLRenderer({
          antialias: true, alpha: true, premultipliedAlpha: false,
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(RENDER, RENDER);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.6;
        renderer.shadowMap.enabled = false;
        renderer.domElement.style.cssText = `display:block;background:transparent!important;width:${size}px;height:${size}px;`;
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 100);

        // Generous lighting from all sides — model will be visible regardless of orientation
        scene.add(new THREE.AmbientLight(0xffffff, 3.0));
        const d1 = new THREE.DirectionalLight(0xffffff, 3.0); d1.position.set(0, 5, 5); scene.add(d1);
        const d2 = new THREE.DirectionalLight(0xffffff, 2.0); d2.position.set(0, 5,-5); scene.add(d2);
        const d3 = new THREE.DirectionalLight(0xffffff, 1.5); d3.position.set(5, 0, 0); scene.add(d3);
        const d4 = new THREE.DirectionalLight(0xffffff, 1.5); d4.position.set(-5,0, 0); scene.add(d4);
        const d5 = new THREE.DirectionalLight(0xffffff, 1.0); d5.position.set(0,-5, 0); scene.add(d5);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.0));

        const draco = new DRACOLoader();
        draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        const gltf: any = await new Promise((res, rej) =>
          loader.load(glbPath, res, undefined, rej)
        );
        if (cancelled) { renderer.dispose(); return; }

        const model = gltf.scene;

        // Wrap in a pivot group so we can rotate freely
        const pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(model);

        // Compute bounding box AFTER adding to scene
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const boxSize = box.getSize(new THREE.Vector3());

        // Center the model within the pivot
        model.position.set(-center.x, -center.y, -center.z);

        // Scale so the tallest dimension fits nicely in view
        const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
        const sc = 1.3 / maxDim;
        pivot.scale.setScalar(sc);

        // This GLB: nodes have rotation ~Y=-90deg (quaternion 0,-0.707,0,0.707)
        // meaning the model faces toward +X in local space.
        // Rotate pivot so the face points toward camera (+Z):
        // Y=90deg rotates +X to face +Z (camera direction)
        pivot.rotation.y = -Math.PI / 2;

        // Camera: straight ahead, slightly above center
        camera.position.set(0, 0.05, 3.2);
        camera.lookAt(0, 0, 0);

        // Play animation if present
        let mixer: any = null;
        if (gltf.animations?.length) {
          const { AnimationMixer } = THREE;
          mixer = new AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }

        setReady(true);

        const clock = new THREE.Clock();
        const tick = () => {
          rafId = requestAnimationFrame(tick);
          if (mixer) mixer.update(clock.getDelta());
          renderer.render(scene, camera);
        };
        tick();

      } catch (err) {
        console.error("[MascotViewer] Load error:", err);
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      mountRef.current?.querySelector("canvas")?.remove();
    };
  }, [glbPath, size]); // eslint-disable-line

  return (
    <div
      ref={mountRef}
      style={{
        width: size, height: size,
        position: "relative",
        background: "none", border: "none",
        boxShadow: "none", borderRadius: 0,
        display: "block", overflow: "visible",
        flexShrink: 0,
      }}
    >
      {(!ready || error) && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.max(size * 0.38, 14),
          background: "none",
        }}>
          🤖
        </div>
      )}
    </div>
  );
}