import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AvatarLipSyncController } from '../services/lipSync.js';
import { AVATAR_MODELS } from '../models/Avatar.js';

function Avatar({ avatarId, lipSyncService, isConnected }) {
  const meshRef = useRef();
  const [avatar, setAvatar] = useState(null);
  const [lipSyncController, setLipSyncController] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load avatar model
  useEffect(() => {
    loadAvatar();
  }, [avatarId]);

  const loadAvatar = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const modelConfig = AVATAR_MODELS[avatarId];
      if (!modelConfig) {
        throw new Error(`Avatar model not found: ${avatarId}`);
      }

      // Load GLTF model
      const gltf = await useLoader(GLTFLoader, modelConfig.path);
      
      // Create avatar instance
      const avatarInstance = {
        mesh: gltf.scene,
        mixer: null,
        morphTargetDictionary: gltf.scene.children[0]?.morphTargetDictionary || {},
        morphTargetInfluences: gltf.scene.children[0]?.morphTargetInfluences || []
      };

      // Set up animations if available
      if (gltf.animations.length > 0) {
        const { AnimationMixer } = await import('three');
        avatarInstance.mixer = new AnimationMixer(gltf.scene);
        gltf.animations.forEach(clip => {
          avatarInstance.mixer.clipAction(clip).play();
        });
      }

      // Apply model configuration
      avatarInstance.mesh.scale.setScalar(modelConfig.scale);
      avatarInstance.mesh.position.set(
        modelConfig.position.x,
        modelConfig.position.y,
        modelConfig.position.z
      );
      avatarInstance.mesh.rotation.set(
        modelConfig.rotation.x,
        modelConfig.rotation.y,
        modelConfig.rotation.z
      );

      setAvatar(avatarInstance);

      // Set up lip-sync controller
      if (lipSyncService) {
        const controller = new AvatarLipSyncController(avatarInstance, lipSyncService);
        setLipSyncController(controller);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load avatar:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Animation loop
  useFrame((state, delta) => {
    if (avatar?.mixer) {
      avatar.mixer.update(delta);
    }

    // Add subtle breathing animation
    if (meshRef.current && isConnected) {
      const time = state.clock.elapsedTime;
      const breathing = Math.sin(time * 0.5) * 0.01;
      meshRef.current.position.y = 0 + breathing;
    }
  });

  // Handle lip-sync service changes
  useEffect(() => {
    if (avatar && lipSyncService && !lipSyncController) {
      const controller = new AvatarLipSyncController(avatar, lipSyncService);
      setLipSyncController(controller);
    }
  }, [avatar, lipSyncService, lipSyncController]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (lipSyncController) {
        lipSyncController.resetToNeutral();
      }
    };
  }, [lipSyncController]);

  if (isLoading) {
    return (
      <group>
        {/* Loading placeholder */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      </group>
    );
  }

  if (error) {
    return (
      <group>
        {/* Error placeholder */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    );
  }

  if (!avatar) {
    return null;
  }

  return (
    <group ref={meshRef}>
      <primitive object={avatar.mesh} />
      
      {/* Connection indicator */}
      {isConnected && (
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      )}
    </group>
  );
}

// Fallback avatar component for when models aren't available
function FallbackAvatar({ isConnected }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && isConnected) {
      const time = state.clock.elapsedTime;
      const breathing = Math.sin(time * 0.5) * 0.01;
      meshRef.current.position.y = 1.6 + breathing;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Simple head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 1.7, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.1, 1.7, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      
      {/* Mouth */}
      <mesh position={[0, 1.5, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      
      {/* Connection indicator */}
      {isConnected && (
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      )}
    </group>
  );
}

// Main avatar component with fallback
function AvatarWithFallback(props) {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Check if GLTF loader is available
    try {
      // This will throw if GLTFLoader is not available
      const loader = new GLTFLoader();
      setUseFallback(false);
    } catch (error) {
      console.warn('GLTFLoader not available, using fallback avatar');
      setUseFallback(true);
    }
  }, []);

  if (useFallback) {
    return <FallbackAvatar {...props} />;
  }

  return <Avatar {...props} />;
}

export default AvatarWithFallback; 