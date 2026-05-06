import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// This import is critical to stop the "Clock is deprecated" warning
import { Timer } from 'three/examples/jsm/misc/Timer.js';

export const SkeletonViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- INITIALIZATION ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const light = new THREE.AmbientLight(0xffffff, 1.618);
    scene.add(light);

    // --- FIX: USE TIMER INSTEAD OF CLOCK ---
    const timer = new Timer();
    camera.position.z = 5;

    // --- SKELETON PLACEHOLDER ---
    // This is what Gemma 2 E2B will eventually control
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff41 });
    const bone = new THREE.Mesh(geometry, material);
    scene.add(bone);

    // --- ANIMATION LOOP ---
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update the Timer
      timer.update();
      
      // Only rotate/move if the AI Model is actually synced
      if ((window as any).activeModelHandle) {
        bone.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '400px', 
        border: '1px solid #333', 
        borderRadius: '8px',
        marginTop: '20px' 
      }} 
    />
  );
};