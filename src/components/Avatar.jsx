import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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

      // For demo purposes, we'll use the fallback avatar
      // In production, you would load the actual GLTF model here
      const avatarInstance = {
        mesh: null,
        mixer: null,
        morphTargetDictionary: {},
        morphTargetInfluences: []
      };

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

  // Use fallback avatar for demo
  return <FallbackAvatar isConnected={isConnected} />;
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

export default Avatar; 