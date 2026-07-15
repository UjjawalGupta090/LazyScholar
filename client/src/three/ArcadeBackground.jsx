import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ArcadeBackground = ({ path, lowPowerMode }) => {
  const mountRef = useRef(null);
  const stateRef = useRef({
    targetCamPos: new THREE.Vector3(0, 5, 20),
    targetCamRot: new THREE.Euler(-0.2, 0, 0),
    mouse: { x: 0, y: 0 }
  });

  // Track page state and map to specific camera positions
  useEffect(() => {
    const state = stateRef.current;
    if (path === 'landing' || path === '/') {
      state.targetCamPos.set(0, 5, 20);
      state.targetCamRot.set(-0.25, 0, 0);
    } else if (path === 'dashboard') {
      state.targetCamPos.set(-8, 3, 16);
      state.targetCamRot.set(-0.1, 0.4, 0);
    } else if (path === 'leaderboard') {
      state.targetCamPos.set(0, 15, 12);
      state.targetCamRot.set(-0.8, 0, 0);
    } else if (path.startsWith('game/')) {
      state.targetCamPos.set(6, 4, 14);
      state.targetCamRot.set(-0.2, -0.3, 0);
    }
  }, [path]);

  // Track mouse coordinates for subtle parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      stateRef.current.mouse.x = (e.clientX / window.innerWidth) - 0.5;
      stateRef.current.mouse.y = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // If low power mode is active, completely skip rendering the 3D scene
    if (lowPowerMode) {
      return;
    }

    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06040c, 0.035);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 20);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06040c, 1);
    currentMount.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00ffff, 2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff00dc, 2);
    dirLight2.position.set(-5, -10, -7);
    scene.add(dirLight2);

    // 5. Synthwave Grid Floor
    const gridHelper = new THREE.GridHelper(80, 40, 0xff00dc, 0x4a0e4e);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // 6. Floating Neon Primitives
    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    const geometries = [
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.TorusGeometry(1, 0.3, 8, 24),
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.BoxGeometry(1.5, 1.5, 1.5)
    ];

    const meshes = [];
    const numShapes = 8;
    for (let i = 0; i < numShapes; i++) {
      const geom = geometries[i % geometries.length];
      
      // Wireframe/Retro cyber material
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x00ffff : 0xff00dc,
        wireframe: true,
        roughness: 0.1,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(geom, material);
      
      // Distribute shapes randomly in the scene space
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 8 + 1,
        (Math.random() - 0.5) * 20 - 5
      );
      
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0
      );

      shapesGroup.add(mesh);
      meshes.push({
        mesh,
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.015,
        floatSpeed: 0.005 + Math.random() * 0.005,
        floatHeight: 0.3 + Math.random() * 0.5,
        initialY: mesh.position.y
      });
    }

    // 7. Particle Stars Field
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorCyan = new THREE.Color(0x00ffff);
    const colorPink = new THREE.Color(0xff00dc);

    for (let i = 0; i < particleCount; i++) {
      // Positions
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 25 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      // Colors (mix of cyan and pink)
      const mixedColor = Math.random() > 0.5 ? colorCyan : colorPink;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Simple canvas-drawn circle texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.25,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starParticles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(starParticles);

    // 8. Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let animId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      const state = stateRef.current;
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Pan camera smoothly (lerp) to target position & rotation
      camera.position.lerp(state.targetCamPos, 0.04);
      
      // Create a target rotation based on base camera path rotation + mouse parallax input
      const targetPitch = state.targetCamRot.x + (state.mouse.y * -0.15);
      const targetYaw = state.targetCamRot.y + (state.mouse.x * -0.15);

      camera.rotation.x += (targetPitch - camera.rotation.x) * 0.04;
      camera.rotation.y += (targetYaw - camera.rotation.y) * 0.04;

      // Animate shapes
      meshes.forEach(item => {
        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        
        // Hover float animation
        item.mesh.position.y = item.initialY + Math.sin(elapsedTime * 2 + item.initialY) * item.floatHeight;
      });

      // Slowly drift grid to create scrolling floor illusion
      gridHelper.position.z = (elapsedTime * 4) % 2;

      // Slowly rotate particle field
      starParticles.rotation.y = elapsedTime * 0.015;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      // Dispose materials/geometries
      geometries.forEach(g => g.dispose());
      meshes.forEach(m => m.mesh.material.dispose());
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, [lowPowerMode]);

  if (lowPowerMode) {
    // Pure CSS styled static gradient backdrop when in low power mode to save resources
    return (
      <div className="fixed inset-0 w-full h-full bg-radial from-[#19112a] via-[#090610] to-[#040307] -z-10 pointer-events-none" />
    );
  }

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden"
      style={{ filter: 'brightness(0.9)' }}
    />
  );
};

export default ArcadeBackground;
