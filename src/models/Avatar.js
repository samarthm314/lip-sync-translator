/**
 * Avatar model definitions
 */

export const AVATAR_MODELS = {
  'default': {
    id: 'default',
    name: 'Default Avatar',
    path: '/models/default-avatar.glb',
    thumbnail: '/models/default-avatar-thumb.jpg',
    description: 'A neutral 3D avatar with lip-sync support',
    features: ['lip-sync', 'basic-expressions'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },
  'professional': {
    id: 'professional',
    name: 'Professional',
    path: '/models/professional-avatar.glb',
    thumbnail: '/models/professional-avatar-thumb.jpg',
    description: 'A professional-looking avatar for business meetings',
    features: ['lip-sync', 'expressions', 'gestures'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },
  'casual': {
    id: 'casual',
    name: 'Casual',
    path: '/models/casual-avatar.glb',
    thumbnail: '/models/casual-avatar-thumb.jpg',
    description: 'A friendly, casual avatar for informal conversations',
    features: ['lip-sync', 'expressions', 'head-movement'],
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },
  'cartoon': {
    id: 'cartoon',
    name: 'Cartoon',
    path: '/models/cartoon-avatar.glb',
    thumbnail: '/models/cartoon-avatar-thumb.jpg',
    description: 'A fun cartoon-style avatar',
    features: ['lip-sync', 'exaggerated-expressions'],
    scale: 1.2,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }
};

export const DEFAULT_AVATAR = AVATAR_MODELS.default;

/**
 * Avatar class for managing 3D avatar instances
 */
export class Avatar {
  constructor(modelId, scene) {
    this.modelId = modelId;
    this.model = AVATAR_MODELS[modelId] || DEFAULT_AVATAR;
    this.scene = scene;
    this.mesh = null;
    this.mixer = null;
    this.animations = new Map();
    this.isLoaded = false;
    this.onLoad = null;
    this.onError = null;
  }

  /**
   * Load avatar model
   * @returns {Promise} Loading promise
   */
  async load() {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();
      
      const gltf = await loader.loadAsync(this.model.path);
      
      this.mesh = gltf.scene;
      this.mesh.scale.setScalar(this.model.scale);
      this.mesh.position.set(
        this.model.position.x,
        this.model.position.y,
        this.model.position.z
      );
      this.mesh.rotation.set(
        this.model.rotation.x,
        this.model.rotation.y,
        this.model.rotation.z
      );
      
      // Set up animations
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.mesh);
        gltf.animations.forEach(clip => {
          this.animations.set(clip.name, this.mixer.clipAction(clip));
        });
      }
      
      this.isLoaded = true;
      
      if (this.onLoad) {
        this.onLoad(this);
      }
      
      return this;
    } catch (error) {
      console.error('Failed to load avatar:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  /**
   * Add avatar to scene
   */
  addToScene() {
    if (this.mesh && this.scene) {
      this.scene.add(this.mesh);
    }
  }

  /**
   * Remove avatar from scene
   */
  removeFromScene() {
    if (this.mesh && this.scene) {
      this.scene.remove(this.mesh);
    }
  }

  /**
   * Play animation
   * @param {string} animationName - Name of animation to play
   * @param {Object} options - Animation options
   */
  playAnimation(animationName, options = {}) {
    const action = this.animations.get(animationName);
    if (action) {
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
    }
  }

  /**
   * Update avatar (call in animation loop)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  /**
   * Set avatar position
   * @param {Object} position - Position object
   */
  setPosition(position) {
    if (this.mesh) {
      this.mesh.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Set avatar rotation
   * @param {Object} rotation - Rotation object
   */
  setRotation(rotation) {
    if (this.mesh) {
      this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  /**
   * Get avatar mesh
   * @returns {THREE.Group} Avatar mesh
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Check if avatar has specific feature
   * @param {string} feature - Feature to check
   * @returns {boolean} Whether avatar has feature
   */
  hasFeature(feature) {
    return this.model.features.includes(feature);
  }

  /**
   * Clean up avatar resources
   */
  cleanup() {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    if (this.mesh) {
      this.mesh.traverse(child => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }
}

/**
 * Avatar manager for handling multiple avatars
 */
export class AvatarManager {
  constructor(scene) {
    this.scene = scene;
    this.avatars = new Map();
    this.currentAvatar = null;
  }

  /**
   * Load avatar
   * @param {string} modelId - Avatar model ID
   * @returns {Promise<Avatar>} Loaded avatar
   */
  async loadAvatar(modelId) {
    if (this.avatars.has(modelId)) {
      return this.avatars.get(modelId);
    }

    const avatar = new Avatar(modelId, this.scene);
    await avatar.load();
    this.avatars.set(modelId, avatar);
    
    return avatar;
  }

  /**
   * Set current avatar
   * @param {string} modelId - Avatar model ID
   */
  async setCurrentAvatar(modelId) {
    // Remove current avatar from scene
    if (this.currentAvatar) {
      this.currentAvatar.removeFromScene();
    }

    // Load and set new avatar
    const avatar = await this.loadAvatar(modelId);
    avatar.addToScene();
    this.currentAvatar = avatar;
    
    return avatar;
  }

  /**
   * Get current avatar
   * @returns {Avatar} Current avatar
   */
  getCurrentAvatar() {
    return this.currentAvatar;
  }

  /**
   * Get available avatars
   * @returns {Array} Available avatar models
   */
  getAvailableAvatars() {
    return Object.values(AVATAR_MODELS);
  }

  /**
   * Update all avatars
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    this.avatars.forEach(avatar => {
      avatar.update(deltaTime);
    });
  }

  /**
   * Clean up all avatars
   */
  cleanup() {
    this.avatars.forEach(avatar => {
      avatar.cleanup();
    });
    this.avatars.clear();
    this.currentAvatar = null;
  }
} 