import * as THREE from "three";

interface Bar {
  position: THREE.Vector3;
  radius: number;
}

class GymnasticsGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private gymnast: THREE.Group | null;
  private bars: Bar[];
  private currentBar: number;
  private isHoldingBar: boolean;
  private swingAngle: number;
  private swingVelocity: number;
  private gymnastVelocity: THREE.Vector3;
  private score: number;

  private gravity: number;
  private swingForce: number;
  private maxSwingForce: number;
  
  private mats: THREE.Mesh[];
  private fireParticles: THREE.Points | null;
  private fireActive: boolean;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();

    this.gymnast = null;
    this.bars = [];
    this.currentBar = 0;
    this.isHoldingBar = true;
    this.swingAngle = 0;
    this.swingVelocity = 0;
    this.gymnastVelocity = new THREE.Vector3(0, 0, 0);
    this.score = 0;

    this.gravity = -6.5;  // Reduced gravity for easier swinging
    this.swingForce = 0;
    this.maxSwingForce = 12;  // Increased force for building momentum
    
    this.mats = [];
    this.fireParticles = null;
    this.fireActive = false;

    this.init();
    this.animate();
  }

  private init(): void {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const container = document.getElementById("game-container");
    if (container) {
      container.appendChild(this.renderer.domElement);
    }

    // Setup camera - view from the side
    this.camera.position.set(15, 5, 0);
    this.camera.lookAt(0, 3, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // Add sky
    this.scene.background = new THREE.Color(0x87ceeb);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Create uneven bars
    this.createUnevenBars();
    
    // Create gymnastics mats
    this.createMats();

    // Create gymnast
    this.createGymnast();
    
    // Create fire particle system
    this.createFireParticles();

    // Setup controls
    this.setupControls();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  private createUnevenBars(): void {
    // Bar materials
    const barMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.3,
      roughness: 0.4,
    });

    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      metalness: 0.7,
      roughness: 0.3,
    });

    // Lower bar
    const lowerBarHeight = 2.5;
    const lowerBar = new THREE.Group();

    // Bar cylinder - oriented along X axis
    const lowerBarGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.4);
    const lowerBarMesh = new THREE.Mesh(lowerBarGeometry, barMaterial);
    lowerBarMesh.rotation.z = Math.PI / 2;
    lowerBarMesh.position.y = lowerBarHeight;
    lowerBarMesh.castShadow = true;
    lowerBar.add(lowerBarMesh);

    // Supports
    const supportGeometry = new THREE.CylinderGeometry(
      0.05,
      0.08,
      lowerBarHeight,
    );
    const leftSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    leftSupport.position.set(-1.2, lowerBarHeight / 2, 0);
    leftSupport.castShadow = true;
    lowerBar.add(leftSupport);

    const rightSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    rightSupport.position.set(1.2, lowerBarHeight / 2, 0);
    rightSupport.castShadow = true;
    lowerBar.add(rightSupport);

    lowerBar.position.z = -1.5;  // Position along Z axis instead of X
    this.scene.add(lowerBar);

    // Higher bar
    const higherBarHeight = 3.5;
    const higherBar = new THREE.Group();

    // Bar cylinder
    const higherBarMesh = new THREE.Mesh(lowerBarGeometry, barMaterial);
    higherBarMesh.rotation.z = Math.PI / 2;
    higherBarMesh.position.y = higherBarHeight;
    higherBarMesh.castShadow = true;
    higherBar.add(higherBarMesh);

    // Supports
    const higherSupportGeometry = new THREE.CylinderGeometry(
      0.05,
      0.08,
      higherBarHeight,
    );
    const leftSupportHigher = new THREE.Mesh(
      higherSupportGeometry,
      supportMaterial,
    );
    leftSupportHigher.position.set(-1.2, higherBarHeight / 2, 0);
    leftSupportHigher.castShadow = true;
    higherBar.add(leftSupportHigher);

    const rightSupportHigher = new THREE.Mesh(
      higherSupportGeometry,
      supportMaterial,
    );
    rightSupportHigher.position.set(1.2, higherBarHeight / 2, 0);
    rightSupportHigher.castShadow = true;
    higherBar.add(rightSupportHigher);

    higherBar.position.z = 1.5;  // Position along Z axis instead of X
    this.scene.add(higherBar);

    // Store bar positions for physics
    this.bars = [
      { position: new THREE.Vector3(0, lowerBarHeight, -1.5), radius: 0.04 },
      { position: new THREE.Vector3(0, higherBarHeight, 1.5), radius: 0.04 },
    ];
  }
  
  private createMats(): void {
    const matGeometry = new THREE.BoxGeometry(3, 0.3, 2);
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E90FF,  // Dodger Blue
      roughness: 0.8,
    });
    
    // Mat under lower bar
    const mat1 = new THREE.Mesh(matGeometry, matMaterial);
    mat1.position.set(0, 0.15, -1.5);
    mat1.receiveShadow = true;
    mat1.castShadow = true;
    this.scene.add(mat1);
    this.mats.push(mat1);
    
    // Mat under higher bar
    const mat2 = new THREE.Mesh(matGeometry, matMaterial);
    mat2.position.set(0, 0.15, 1.5);
    mat2.receiveShadow = true;
    mat2.castShadow = true;
    this.scene.add(mat2);
    this.mats.push(mat2);
  }

  private createGymnast(): void {
    const gymnast = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff69b4,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    gymnast.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbbd,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.5;
    head.castShadow = true;
    gymnast.add(head);

    // Arms - raised above head
    const armGeometry = new THREE.CapsuleGeometry(0.06, 0.4, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbbd,
      roughness: 0.8,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.15, 0.65, 0);
    leftArm.rotation.z = -Math.PI / 8;  // Slight outward angle
    leftArm.castShadow = true;
    gymnast.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.15, 0.65, 0);
    rightArm.rotation.z = Math.PI / 8;  // Slight outward angle
    rightArm.castShadow = true;
    gymnast.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xff69b4,
      roughness: 0.7,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.1, -0.5, 0);
    leftLeg.castShadow = true;
    gymnast.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.1, -0.5, 0);
    rightLeg.castShadow = true;
    gymnast.add(rightLeg);

    // Rotate gymnast to face sideways (along Z axis)
    gymnast.rotation.y = Math.PI / 2;
    
    // Position gymnast on first bar
    gymnast.position.copy(this.bars[0].position);
    gymnast.position.y -= 1.15; // Hang from bar by hands (0.65 arm pos + 0.5 head radius)

    this.gymnast = gymnast;
    this.scene.add(gymnast);
  }
  
  private createFireParticles(): void {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = 0;
      velocities[i] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xFF4500,  // Orange Red
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    this.fireParticles = new THREE.Points(geometry, material);
    this.fireParticles.visible = false;
    this.scene.add(this.fireParticles);
  }

  private setupControls(): void {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (this.isHoldingBar) {
        switch (event.key) {
          case "ArrowLeft":
            this.swingForce = -this.maxSwingForce;
            break;
          case "ArrowRight":
            this.swingForce = this.maxSwingForce;
            break;
          case " ":
            event.preventDefault();
            this.releaseBar();
            break;
        }
      }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        this.swingForce = 0;
      }
    });
  }

  private releaseBar(): void {
    if (!this.isHoldingBar) return;

    this.isHoldingBar = false;

    // Calculate release velocity based on swing
    const barPos = this.bars[this.currentBar].position;
    const radius = 1.15; // Distance from bar to gymnast center (hanging by hands)

    // Tangential velocity from swing
    const tangentialVelocity = this.swingVelocity * radius;

    // Convert to world velocity - now in Y-Z plane
    this.gymnastVelocity.x = 0;
    this.gymnastVelocity.y = tangentialVelocity * Math.sin(this.swingAngle);
    this.gymnastVelocity.z = tangentialVelocity * Math.cos(this.swingAngle);

    // Add some forward momentum along Z axis
    this.gymnastVelocity.z += this.currentBar === 0 ? 3 : -3;
  }

  private updatePhysics(deltaTime: number): void {
    if (!this.gymnast) return;

    if (this.isHoldingBar) {
      // Pendulum physics
      const barPos = this.bars[this.currentBar].position;

      // Apply swing force
      this.swingVelocity += this.swingForce * deltaTime;

      // Apply gravity (pendulum acceleration)
      const gravityComponent = (this.gravity / 1.15) * Math.sin(this.swingAngle);
      this.swingVelocity += gravityComponent * deltaTime;

      // Apply damping - reduced for better momentum preservation
      this.swingVelocity *= 0.995;

      // Update angle
      this.swingAngle += this.swingVelocity * deltaTime;

      // Update gymnast position - swinging in X-Z plane
      const radius = 1.15;
      this.gymnast.position.x = barPos.x;
      this.gymnast.position.y = barPos.y - radius * Math.cos(this.swingAngle);
      this.gymnast.position.z = barPos.z + radius * Math.sin(this.swingAngle);

      // Rotate gymnast with swing around X axis
      this.gymnast.rotation.x = this.swingAngle;
    } else {
      // Free fall physics
      this.gymnastVelocity.y += this.gravity * deltaTime;

      this.gymnast.position.x += this.gymnastVelocity.x * deltaTime;
      this.gymnast.position.y += this.gymnastVelocity.y * deltaTime;
      this.gymnast.position.z += this.gymnastVelocity.z * deltaTime;

      // Check for bar grab
      this.checkBarGrab();
      
      // Check for mat collision
      this.checkMatCollision();

      // Check if gymnast hit the ground (but not on a mat)
      if (this.gymnast.position.y < 0 && !this.fireActive) {
        this.resetGymnast();
      }
    }
  }

  private checkBarGrab(): void {
    if (!this.gymnast) return;

    const grabDistance = 0.5; // Distance within which gymnast can grab bar

    for (let i = 0; i < this.bars.length; i++) {
      if (i === this.currentBar && this.gymnastVelocity.y > 0) continue; // Don't grab same bar when going up

      const bar = this.bars[i];
      const distance = this.gymnast.position.distanceTo(bar.position);

      if (distance < grabDistance) {
        // Grab the bar
        this.isHoldingBar = true;
        this.currentBar = i;

        // Calculate swing angle based on approach in Y-Z plane
        const dz = this.gymnast.position.z - bar.position.z;
        const dy = this.gymnast.position.y - bar.position.y;
        this.swingAngle = Math.atan2(dz, -dy);

        // Convert linear velocity to angular velocity
        const radius = 1.15;
        this.swingVelocity =
          (this.gymnastVelocity.z * Math.cos(this.swingAngle)) / radius;

        // Reset linear velocity
        this.gymnastVelocity.set(0, 0, 0);

        // Update score
        this.score += 100;
        const scoreElement = document.getElementById("score-value");
        if (scoreElement) {
          scoreElement.textContent = this.score.toString();
        }

        break;
      }
    }
  }
  
  private checkMatCollision(): void {
    if (!this.gymnast || this.isHoldingBar || this.fireActive) return;
    
    // Check collision with each mat
    for (const mat of this.mats) {
      const matTop = mat.position.y + 0.15;  // Mat height / 2
      const matBounds = {
        minX: mat.position.x - 1.5,  // Mat width / 2
        maxX: mat.position.x + 1.5,
        minZ: mat.position.z - 1,    // Mat depth / 2
        maxZ: mat.position.z + 1,
      };
      
      // Check if gymnast is within mat bounds
      if (this.gymnast.position.y <= matTop + 0.5 &&
          this.gymnast.position.x >= matBounds.minX &&
          this.gymnast.position.x <= matBounds.maxX &&
          this.gymnast.position.z >= matBounds.minZ &&
          this.gymnast.position.z <= matBounds.maxZ) {
        
        // Land on mat
        this.gymnast.position.y = matTop + 0.5;
        this.gymnastVelocity.set(0, 0, 0);
        
        // Trigger fire effect
        this.startFireEffect();
        
        // Bonus points for landing on mat
        this.score += 200;
        const scoreElement = document.getElementById("score-value");
        if (scoreElement) {
          scoreElement.textContent = this.score.toString();
        }
        
        // Reset after delay
        setTimeout(() => this.resetGymnast(), 2000);
        break;
      }
    }
  }
  
  private startFireEffect(): void {
    if (!this.fireParticles || !this.gymnast) return;
    
    this.fireActive = true;
    this.fireParticles.visible = true;
    this.fireParticles.position.copy(this.gymnast.position);
    
    // Initialize particle positions and velocities
    const positions = this.fireParticles.geometry.attributes.position as THREE.BufferAttribute;
    const velocities = this.fireParticles.geometry.attributes.velocity as THREE.BufferAttribute;
    
    for (let i = 0; i < positions.count; i++) {
      positions.setXYZ(i, 
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      );
      
      velocities.setXYZ(i,
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 2,
        (Math.random() - 0.5) * 2
      );
    }
    
    positions.needsUpdate = true;
    velocities.needsUpdate = true;
  }
  
  private updateFireParticles(deltaTime: number): void {
    if (!this.fireParticles || !this.fireActive) return;
    
    const positions = this.fireParticles.geometry.attributes.position as THREE.BufferAttribute;
    const velocities = this.fireParticles.geometry.attributes.velocity as THREE.BufferAttribute;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const vx = velocities.getX(i);
      const vy = velocities.getY(i);
      const vz = velocities.getZ(i);
      
      // Update positions
      positions.setXYZ(i,
        x + vx * deltaTime,
        y + vy * deltaTime,
        z + vz * deltaTime
      );
      
      // Apply gravity to velocity
      velocities.setY(i, vy - 5 * deltaTime);
    }
    
    positions.needsUpdate = true;
  }

  private resetGymnast(): void {
    if (!this.gymnast) return;

    // Reset to first bar
    this.currentBar = 0;
    this.isHoldingBar = true;
    this.swingAngle = 0;
    this.swingVelocity = 0;
    this.gymnastVelocity.set(0, 0, 0);

    const barPos = this.bars[0].position;
    this.gymnast.position.copy(barPos);
    this.gymnast.position.y -= 1.15;
    this.gymnast.rotation.x = 0;
    this.gymnast.rotation.y = Math.PI / 2;  // Keep sideways orientation

    // Reset score
    this.score = 0;
    const scoreElement = document.getElementById("score-value");
    if (scoreElement) {
      scoreElement.textContent = this.score.toString();
    }
    
    // Hide fire effect
    this.fireActive = false;
    if (this.fireParticles) {
      this.fireParticles.visible = false;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap delta time

    this.updatePhysics(deltaTime);
    this.updateFireParticles(deltaTime);

    this.renderer.render(this.scene, this.camera);
  };
}

// Start the game
new GymnasticsGame();
