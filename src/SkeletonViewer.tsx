import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Timer } from 'three/examples/jsm/misc/Timer.js';

export const SkeletonViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1.618);
    scene.add(light);

    const timer = new Timer(); // FIXED: No more deprecation warning
    camera.position.z = 5;

    // The Skeleton Bone
    const bone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff41 })
    );
    scene.add(bone);

    const animate = () => {
      requestAnimationFrame(animate);
      timer.update();
      
      // ZERO-DRIFT: No auto-timer. Only moves if Gemma 4 is active.
      if ((window as any).gemmaActive) {
        bone.rotation.y += 0.01; 
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};
