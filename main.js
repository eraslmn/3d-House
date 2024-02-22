import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement)
const textureLoader = new THREE.TextureLoader();
const gui = new dat.GUI();

camera.position.set(-5, 20, 25)
controls.enableDamping = true;
document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
gui.width = 300;

const doorTexture = textureLoader.load('./textures/door/color.jpg');
const doorAlphaTexture = textureLoader.load('./textures/door/alpha.jpg');
const doorNormalTexture = textureLoader.load('./textures/door/normal.jpg');

const bricksTexture = textureLoader.load('./textures/bricks/ddtext.jpg');
const bricksNormalTexture = textureLoader.load('./textures/bricks/ddtext.jpg');

const roofTexture = textureLoader.load('./textures/bricks/roof.jpg');
const roofNormalTexture = textureLoader.load('./textures/bricks/roof.jpg');

const floorTexture = textureLoader.load('./textures/floor/scrub-texture.jpg');
const floorNormalTexture = textureLoader.load('./textures/floor/floorMap.jpg');

floorTexture.repeat.set(4, 4);
floorNormalTexture.repeat.set(4, 4);
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping;

const gridHelper = new THREE.GridHelper(30, 50, 50);
scene.add(gridHelper);
gridHelper.visible = false;
gui.add(gridHelper, 'visible').name('Grid Helper');

const ambitionLight = new THREE.AmbientLight(0xb9d5ff, 0.2);
scene.add(ambitionLight);
gui.add(ambitionLight, 'intensity').min(0).max(1).step(0.01).name('Ambient Light');

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-10, 20, 10); //Position the light to the left, above, and in front of the house
directionalLight.castShadow = true;
directionalLight.intensity = 0.5;       //Increase and decrease the light intensity
scene.add(directionalLight);

directionalLight.target.position.set(0, 0, 0); //Target the center of the house
scene.add(directionalLight.target);

directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;

//Shadow map size for better quality
directionalLight.shadow.mapSize.width = 2048; //Higher values give better shadow quality
directionalLight.shadow.mapSize.height = 2048;

//Update light and shadow properties
directionalLight.shadow.camera.updateProjectionMatrix();

//HDR environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('hdri/puresky_4k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

const house = new THREE.Group();
scene.add(house);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({
    color: 0xa9c388,
    map: floorTexture,
    normalMap: floorNormalTexture,
    side: THREE.DoubleSide
  })
)

floor.rotation.x = Math.PI * -0.5;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor)
gui.add(floor, 'receiveShadow').name('Enable Shadow');

//Size of the wall
const wallWidth = 19;
const wallHeight = 12;

const frontWallGeometry = new THREE.PlaneGeometry(wallWidth, wallHeight);

//Interior and exterior textures for the front wall
const frontWallExteriorTexture = textureLoader.load('./textures/bricks/ddtext.jpg');
const frontWallInteriorTexture = textureLoader.load('./textures/floor/interior.jpg');

const frontWallExteriorMaterial = new THREE.MeshStandardMaterial({
  map: frontWallExteriorTexture,
  side: THREE.DoubleSide 
});

const frontWallInteriorMaterial = new THREE.MeshStandardMaterial({
  map: frontWallInteriorTexture,
  side: THREE.BackSide //Interior side
});

//Front Wall Exterior Plane
const frontWallExterior = new THREE.Mesh(frontWallGeometry, frontWallExteriorMaterial);
frontWallExterior.position.z = -7.5 - 0.01; 
frontWallExterior.position.y = wallHeight / 2;
house.add(frontWallExterior);
frontWallExterior.castShadow = true;

//Front Wall Interior Plane
const frontWallInterior = new THREE.Mesh(frontWallGeometry, frontWallInteriorMaterial);
frontWallInterior.position.z = -7.5 + 0.01; 
frontWallInterior.position.y = wallHeight / 2;
frontWallInterior.rotation.y = Math.PI; 
house.add(frontWallInterior);
frontWallInterior.castShadow = true;

//Wall material   
const wallMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.33,
  map: bricksTexture,
  normalMap: bricksNormalTexture,
  side: THREE.DoubleSide 
});       

const textureLoad = new THREE.TextureLoader();

textureLoad.load('./textures/bricks/ddtext.jpg', function(texture) {
    // Set the wrapping to clamp to edge to avoid repetition
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  
    // Set the minification filter to avoid mipmap generation
    texture.minFilter = THREE.LinearFilter;
  
  
    // Use a standard material with the texture
    const backWallTextureMaterial = new THREE.MeshStandardMaterial({ map: texture });
  
    const wallDepth = 7.5; 

    const wallShape = new THREE.Shape();
    wallShape.moveTo(-wallWidth / 2, 0);
    wallShape.lineTo(-wallWidth / 2, wallHeight);
    wallShape.lineTo(wallWidth / 2, wallHeight);
    wallShape.lineTo(wallWidth / 2, 0);
    wallShape.lineTo(-wallWidth / 2, 0);

 //Function to add a window hole to the wall shape
    function addWindowHole(shape, x, y, width, height) {
      const holePath = new THREE.Path();
      holePath.moveTo(x - width / 2, y);
      holePath.lineTo(x - width / 2, y + height);
      holePath.lineTo(x + width / 2, y + height);
      holePath.lineTo(x + width / 2, y);
      holePath.lineTo(x - width / 2, y);
      shape.holes.push(holePath);
    }

 //Dimensions and positions for the windows
    const windowWidth = 3;
    const windowHeight = 2.8;
    const leftWindowX = -6; //Left window position
    const rightWindowX = 5; //Right window position
    const windowY = 7; //Vertical position

    //Window holes to the wall shape
    addWindowHole(wallShape, leftWindowX, windowY, windowWidth, windowHeight);
    addWindowHole(wallShape, rightWindowX, windowY, windowWidth, windowHeight);

    //Geometry from the shape
    const backWallGeometry = new THREE.ShapeGeometry(wallShape);
    backWallGeometry.computeBoundingBox();
    const max = backWallGeometry.boundingBox.max;
    const min = backWallGeometry.boundingBox.min;
    const uvAttribute = backWallGeometry.attributes.uv;

    for (let i = 0; i < uvAttribute.count; i++) {
        const u = (uvAttribute.getX(i) - min.x) / (max.x - min.x);
        const v = (uvAttribute.getY(i) - min.y) / (max.y - min.y);
        uvAttribute.setXY(i, u, v);
    }
    const baseh = 0;
    const backWall = new THREE.Mesh(backWallGeometry, backWallTextureMaterial);
    backWall.position.set(0, baseh, wallDepth); // Adjust position as necessary
    house.add(backWall);
});

const sideWallLength = 15; 
const leftWallGeometry = new THREE.PlaneGeometry(sideWallLength, wallHeight); 

//Left Wall Exterior Plane
const leftWallExterior = new THREE.Mesh(leftWallGeometry, frontWallExteriorMaterial); 
leftWallExterior.position.x = -(wallWidth / 2 + 0.01); 
leftWallExterior.position.y = wallHeight / 2;
leftWallExterior.rotation.y = -Math.PI / 2; 
house.add(leftWallExterior);
leftWallExterior.castShadow = true;

//Left Wall Interior Plane
const leftWallInterior = new THREE.Mesh(leftWallGeometry, frontWallInteriorMaterial); 
leftWallInterior.position.x = -(wallWidth / 2 - 0.01); 
leftWallInterior.position.y = wallHeight / 2;
leftWallInterior.rotation.y = -Math.PI / 2; 
house.add(leftWallInterior);
leftWallInterior.castShadow = true;

//Right Wall Geometry
const rightWallGeometry = new THREE.PlaneGeometry(sideWallLength, wallHeight);

// Right Wall Exterior Plane
const rightWallExterior = new THREE.Mesh(rightWallGeometry, frontWallExteriorMaterial);
rightWallExterior.position.x = wallWidth / 2 + 0.01; 
rightWallExterior.position.y = wallHeight / 2;
rightWallExterior.rotation.y = Math.PI / 2; 
house.add(rightWallExterior);
rightWallExterior.castShadow = true;

//Right Wall Interior Plane
const rightWallInterior = new THREE.Mesh(rightWallGeometry, frontWallInteriorMaterial);
rightWallInterior.position.x = wallWidth / 2 - 0.01; 
rightWallInterior.position.y = wallHeight / 2;
rightWallInterior.rotation.y = Math.PI / 2; 
house.add(rightWallInterior);
rightWallInterior.castShadow = true;

//Load the texture
const textureLoader2 = new THREE.TextureLoader();
const platform2Texture = textureLoader.load('./textures/floor/parket.jpeg');

platform2Texture.wrapS = THREE.RepeatWrapping;
platform2Texture.wrapT = THREE.RepeatWrapping;
platform2Texture.repeat.set(4, 4); 

//Platform geometry
const platform2Geometry = new THREE.BoxGeometry(19, 0.2, 14.9);

const platform2Material = new THREE.MeshStandardMaterial({
  map: platform2Texture, 
  roughness: 1 
});

const platform2 = new THREE.Mesh(platform2Geometry, platform2Material);
platform2.position.x = 0;
platform2.position.y = 0.3; 
platform2.receiveShadow = true;

scene.add(platform2);

//Room group
const room = new THREE.Group();

//Size of the room
const roomWidth = 10;
const roomHeight = 9; 
const roomDepth = 10; 

const roomMaterial = wallMaterial;

//Front Wall
const roomFrontWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const roomFrontWall = new THREE.Mesh(roomFrontWallGeometry, roomMaterial);
roomFrontWall.position.z = -roomDepth / 2;
roomFrontWall.position.y = roomHeight / 2;
room.add(roomFrontWall);
roomFrontWall.castShadow = true;

//Back Wall
const roomBackWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const roomBackWall = new THREE.Mesh(roomBackWallGeometry, roomMaterial);
roomBackWall.position.z = roomDepth / 2;
roomBackWall.position.y = roomHeight / 2;
roomBackWall.rotation.y = Math.PI; 
room.add(roomBackWall);
roomBackWall.castShadow = true;

//Left Wall
const roomLeftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const roomLeftWall = new THREE.Mesh(roomLeftWallGeometry, roomMaterial);
roomLeftWall.position.x = -roomWidth / 2;
roomLeftWall.position.y = roomHeight / 2;
roomLeftWall.rotation.y = -Math.PI / 2; 
room.add(roomLeftWall);
roomLeftWall.castShadow = true;

//Right Wall
const roomRightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const roomRightWall = new THREE.Mesh(roomRightWallGeometry, roomMaterial);
roomRightWall.position.x = roomWidth / 2;
roomRightWall.position.y = roomHeight / 2;
roomRightWall.rotation.y = Math.PI / 2; 
room.add(roomRightWall);
roomRightWall.castShadow = true;

//Position of the room is next to the house
room.position.set(wallWidth / 2 + roomWidth / 2, 0, 0);

house.add(room);

const roomRoofRadius = roomWidth / 2 + 2.5; 
const roomRoofHeight = roomHeight / 2; 

const roomRoofGeometry = new THREE.ConeGeometry(roomRoofRadius, roomRoofHeight, 4); 

//Room Roof Material
const roomRoofMaterial = new THREE.MeshStandardMaterial({
  color: 0xb35f45,
  roughness: 0.45,
  map: roofTexture,
  normalMap: roofNormalTexture,
});

const roomRoof = new THREE.Mesh(roomRoofGeometry, roomRoofMaterial);

//Roof's position to accommodate the increased size
roomRoof.position.y = roomHeight + roomRoofHeight / 2;
roomRoof.rotation.y = Math.PI / 4; 

room.add(roomRoof);

const roof = new THREE.Mesh(
  new THREE.ConeGeometry(
    wallWidth * 0.85, 
    wallHeight * 0.4, 
    4
  ),
  new THREE.MeshStandardMaterial({
    color: 0xb35f45,
    roughness: 0.45,
    map: roofTexture,
    normalMap: roofNormalTexture,
  })
);
roof.position.y = wallHeight + (wallHeight * 0.4) / 2; 
roof.rotation.y = Math.PI * 0.25; 
house.add(roof);
roof.castShadow = true;

const door = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 6, 10, 10),
  new THREE.MeshStandardMaterial({
    // color: '#00ff00'
    roughness: 0.1,
    map: doorTexture,
    alphaMap: doorAlphaTexture,
    transparent: true,
    normalMap: doorNormalTexture,
  })
)
door.position.z = wallWidth / 2 - 1.8; 
door.position.y = (door.geometry.parameters.height * 0.5) - 0.1; 

house.add(door);

const doorLight = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 10, 10),
  new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: 1,
    color: 0xffffee,
    roughness: 1
  })
)
doorLight.position.set(0, 3.9, 3.25);
doorLight.castShadow = true;
house.add(doorLight);

const doorPointLight = new THREE.PointLight(0xffffff, 1, 20, 2);
doorPointLight.position.copy(doorLight.position);
doorPointLight.castShadow = true;
house.add(doorPointLight);

gui.add(doorPointLight, 'intensity').min(0).max(2).step(0.01).name('Door Light Intensity');
gui.add(doorPointLight.position, 'y').min(0).max(10).step(0.01).name('Door Light Y')
  .onChange(() => { doorLight.position.y = doorPointLight.position.y; });

gui.add(doorPointLight.position, 'z').min(0).max(10).step(0.01).name('Door Light Z')
  .onChange(() => { doorLight.position.z = doorPointLight.position.z });


const bushesGroup = new THREE.Group();
const bushGeometry = new THREE.SphereGeometry(0.8, 6, 6);
const bushMaterial = new THREE.MeshStandardMaterial({
  color: 0x59981A
})
scene.add(bushesGroup);

const bushes = [
  { x: 15, z: -9, scale: 2 },
  { x: 15, z: 17, scale: 2 },
  { x: 14, z: 17, scale: 2 },

  { x: -10, z: 9, scale: 1 },
  { x: -18, z: -7, scale: 1 },
  { x: -14, z: -9, scale: 0.4 },
]
//Generate bushes
bushes.forEach((bush) => {
  const bushMesh = new THREE.Mesh(bushGeometry, bushMaterial);
  bushMesh.position.set(bush.x, 0.4 * bush.scale, bush.z);
  bushMesh.scale.set(bush.scale, bush.scale, bush.scale);
  bushMesh.castShadow = true;
  bushesGroup.add(bushMesh);
})

const textureLoader1 = new THREE.TextureLoader();
const platformTexture = textureLoader.load('./textures/bricks/tiles.jpg');

platformTexture.wrapS = THREE.RepeatWrapping;
platformTexture.wrapT = THREE.RepeatWrapping;
platformTexture.repeat.set(4, 4); 

const platformGeometry = new THREE.BoxGeometry(47, 1, 37); 

const platformMaterial = new THREE.MeshStandardMaterial({
  map: platformTexture, 
  roughness: 1 
});

const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.position.x = -0.5;
platform.position.y = -0.25; 
platform.receiveShadow = true;

scene.add(platform);

const grassSize = 30;

//Group for flowers
const flowers = new THREE.Group();
scene.add(flowers);

//Materials for the flower parts
const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347 }); //Petal color
const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); 


const petalGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.6); //Petal shape
const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5); 


const platform2CenterX = 0; 
const platform2CenterZ = 0; 
const platform2Width = 5; 
const platform2Length = 5; 

//Function to check if a position is within the Platform2Texture area
function isInPlatform2Area(x, z) {
  return x > (platform2CenterX - platform2Width / 2) && x < (platform2CenterX + platform2Width / 2) &&
         z > (platform2CenterZ - platform2Length / 2) && z < (platform2CenterZ + platform2Length / 2);
}

//Generate flowers within the bounds of the grassy area & avoid the Platform2Texture area
for (let i = 0; i < 20; i++) {
  let x, z, positionValid = false;

  //Generate random positions within the bounds of the grassy area, but not on the Platform2Texture
  while (!positionValid) {
    x = (Math.random() - 0.5) * 2 * grassSize; 
    z = (Math.random() - 0.5) * 2 * grassSize; 

    //Checks if the generated position is within the Platform2Texture area
    if (!isInPlatform2Area(x, z)) {
      positionValid = true;
    }
  }

  //Create stem
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.set(x, 0.25, z); 
  stem.castShadow = true;
  flowers.add(stem);

  for (let j = 0; j < 4; j++) {
    const petal = new THREE.Mesh(petalGeometry, flowerMaterial);
    petal.position.set(x, 0.5, z); 
    petal.rotation.y = Math.PI / 2 * j; 
    petal.castShadow = true;
    flowers.add(petal);
  }
}

const streetLightOptions = {
  height: 2.5,
  intensity: 1,
  distance: 25,
  decay: 2,
  penumbra: 0.5,
}

const createStreetLight = (x, z, color) => {
  const { height, intensity, decay, distance } = streetLightOptions;

  const streetLight = new THREE.Group();
  streetLight.position.set(x, height, z);

  const lightPoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, height * 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  lightPoll.castShadow = true; 
  streetLight.add(lightPoll);

  const lightBulb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.5, 0.5, 10),
    new THREE.MeshBasicMaterial({
      color: color
    })
  );
  lightBulb.position.y = height;
  lightBulb.rotation.y = Math.PI * 0.25;
  lightBulb.castShadow = true; 
  streetLight.add(lightBulb);

  const lightBulbPointLight = new THREE.PointLight(color, intensity, distance, decay);
  lightBulbPointLight.position.y = height;
  lightBulbPointLight.castShadow = true; 
  streetLight.add(lightBulbPointLight);

  return streetLight;
}

const streetLight1 = createStreetLight(-10, 10, 0x00ffff);
scene.add(streetLight1);

const streetLight2 = createStreetLight(10, 10, 0xff0000);
scene.add(streetLight2);

const streetLight3 = createStreetLight(10, -10, 0x00ff00);
scene.add(streetLight3);

const streetLight4 = createStreetLight(-10, -10, 0xff00ff);
scene.add(streetLight4);


gui.add(streetLightOptions, 'intensity').min(0.1).max(2).step(0.01).name('Poll Light Intensity')
  .onChange(() => {
    streetLight1.children[2].intensity = streetLightOptions.intensity;
    streetLight2.children[2].intensity = streetLightOptions.intensity;
    streetLight3.children[2].intensity = streetLightOptions.intensity;
    streetLight4.children[2].intensity = streetLightOptions.intensity;
  });


gui.add(streetLightOptions, 'decay').min(0.1).max(3).step(0.01).name('Poll Light Decay')
  .onChange(() => {
    streetLight1.children[2].decay = streetLightOptions.decay;
    streetLight2.children[2].decay = streetLightOptions.decay;
    streetLight3.children[2].decay = streetLightOptions.decay;
    streetLight4.children[2].decay = streetLightOptions.decay;
  });


gui.add(streetLightOptions, 'distance').min(0.1).max(50).step(0.01).name('Poll Light Distance')
  .onChange(() => {
    streetLight1.children[2].distance = streetLightOptions.distance;
    streetLight2.children[2].distance = streetLightOptions.distance;
    streetLight3.children[2].distance = streetLightOptions.distance;
    streetLight4.children[2].distance = streetLightOptions.distance;
  });

  const raindropCount = 10000;
  const rainGeometry = new THREE.BufferGeometry();
  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true
  });
  
  //Array to store positions of each raindrop
  const positions = new Float32Array(raindropCount * 3);
  
  for (let i = 0; i < raindropCount; i++) {
    //Positions
    positions[i * 3 + 0] = Math.random() * 400 - 200; // x
    positions[i * 3 + 1] = Math.random() * 500 - 250; // y
    positions[i * 3 + 2] = Math.random() * 400 - 200; // z
  }
  
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  //Particle system
  const rain = new THREE.Points(rainGeometry, rainMaterial);
  
  scene.add(rain);
  
  const tick = () => {
  
    requestAnimationFrame(tick);
  
    //Rain animation
    if (rainGeometry && rainGeometry.attributes.position) {
      const positions = rainGeometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) { 
        positions[i] -= 0.5; 
        if (positions[i] < -250) { 
          positions[i] = 250; 
        }
      }
      rainGeometry.attributes.position.needsUpdate = true;
    }
  
    controls.update();
    renderer.render(scene, camera);
  
  }
  tick();
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  


const loader = new GLTFLoader();
loader.load(
  'models/untitled.glb',
  function (gltf) {
    const carModel = gltf.scene;
    //Scale & position the model as before
    carModel.scale.set(3.5, 3.5, 3.5);
    carModel.position.set(-15, 0.2, 0);

    //Shadow casting for the car model and its children
    carModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true;
      }
    });
    scene.add(carModel);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

loader.load(
  'models/sofaa.glb',
  function (gltf) {
    const sofaModel = gltf.scene;

    sofaModel.scale.set(3.5, 3.5, 3.5);
    sofaModel.position.set(-5.5, 0.2, -3);

    sofaModel.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    scene.add(sofaModel);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);


loader.load(
  'models/tabchair.glb',
  function (gltf) {
    const chaiModel = gltf.scene;

    chaiModel.scale.set(3.5, 3.5, 3.5);
    chaiModel.position.set(-3, 0.2, 19);

    chaiModel.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    scene.add(chaiModel);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);


loader.load(
  'models/tree.glb',
  function (gltf) {
    const treeModel = gltf.scene;

    treeModel.scale.set(3.5, 3.5, 3.5); 
    treeModel.position.set(22, 0, -22); 

    treeModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });

    scene.add(treeModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);


loader.load(
  'models/tree.glb',
  function (gltf) {
    const treeModel = gltf.scene;

    treeModel.scale.set(3.5, 3.5, 3.5); 
    treeModel.position.set(-22, 0, -22); 

   
    treeModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });

    scene.add(treeModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);


loader.load(
  'models/tree.glb',
  function (gltf) {
    const treeModel = gltf.scene;
    treeModel.scale.set(3.5, 3.5, 3.5); 
    treeModel.position.set(8, 0, -22); 
   
    treeModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });

    scene.add(treeModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

loader.load(
  'models/tree.glb',
  function (gltf) {
    const treeModel = gltf.scene;

    treeModel.scale.set(3.5, 3.5, 3.5); //Scale of the model
    treeModel.position.set(-8, 0, -22); //Position of the model

    treeModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });
    scene.add(treeModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

loader.load(
  'models/fence.glb',
  function (gltf) {
    const fenceModel = gltf.scene;

    fenceModel.scale.set(0, 3.5, 10); 
    fenceModel.position.set(-24, 0, -25); 

    fenceModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });

    scene.add(fenceModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

loader.load(
  'models/fence.glb',
  function (gltf) {
    const fenceModel = gltf.scene;

    fenceModel.scale.set(0, 3.5, 10); 
    fenceModel.position.set(23, 0, -25); 

 
    fenceModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });

    scene.add(fenceModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

loader.load(
  'models/fence.glb',
  function (gltf) {
    const fenceModel = gltf.scene;

    fenceModel.scale.set(0, 3.5, 15); 
    fenceModel.position.set(35, 0, -18); 
    fenceModel.rotation.set(0, -1.59, 0); 


    fenceModel.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true; 
      }
    });
    scene.add(fenceModel); 
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
)
loader.load(
  'models/window.glb',
  function (gltf) {
    const wallModel = gltf.scene;

    wallModel.scale.set(0.1, 0.1, 0.1);
    wallModel.position.set(-6, 7, 7.5);
    wallModel.rotation.set(0, -3.2, 0); // Rotate 90 degrees around the Y axis

    wallModel.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    scene.add(wallModel);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

loader.load(
  'models/window.glb',
  function (gltf) {
    const wallModel = gltf.scene;

    wallModel.scale.set(0.1, 0.1, 0.1);
    wallModel.position.set(5, 7, 7.5);
    wallModel.rotation.set(0, -3.2, 0); //Rotate 

    wallModel.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    scene.add(wallModel);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);
