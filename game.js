// ============================================
//   game.js — لعبة قيادة في الشارع
//   المطوّر: مهند نايف سيف | الإصدار 1.01
// ============================================

// =============================================
//   إعداد المشهد (Scene Setup)
// =============================================
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xB0C4DE, 80, 300);
scene.background = new THREE.Color(0xB0C4DE);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================
//   الإضاءة (Lighting)
// =============================================
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const sunLight = new THREE.DirectionalLight(0xFFF5E0, 1.2);
sunLight.position.set(80, 120, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width  = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near   = 1;
sunLight.shadow.camera.far    = 400;
sunLight.shadow.camera.left   = -100;
sunLight.shadow.camera.right  =  100;
sunLight.shadow.camera.top    =  100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

scene.add(new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.4));

// =============================================
//   السماء (Sky)
// =============================================
function buildSky() {
  const skyGeo = new THREE.SphereGeometry(450, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  const colors = [];
  const posAttr = skyGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const t = Math.max(0, Math.min(1, (y + 450) / 900));
    colors.push(
      THREE.MathUtils.lerp(0.78, 0.45, t),
      THREE.MathUtils.lerp(0.82, 0.55, t),
      THREE.MathUtils.lerp(0.88, 0.72, t)
    );
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  skyMat.vertexColors = true;
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}
buildSky();

// =============================================
//   الطريق (Road)
// =============================================
const ROAD_WIDTH  = 14;
const ROAD_LENGTH = 2000;

// أرضية خضراء (عشب المدينة)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, ROAD_LENGTH),
  new THREE.MeshLambertMaterial({ color: 0x4A7C4E })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.05, -ROAD_LENGTH / 2);
ground.receiveShadow = true;
scene.add(ground);

// الإسفلت
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
  new THREE.MeshLambertMaterial({ color: 0x2C2C2C })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -ROAD_LENGTH / 2);
road.receiveShadow = true;
scene.add(road);

// خطوط حافة الطريق الصفراء
function makeEdgeLine(x) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, ROAD_LENGTH),
    new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.01, -ROAD_LENGTH / 2);
  scene.add(mesh);
}
makeEdgeLine(-(ROAD_WIDTH / 2) + 0.3);
makeEdgeLine( (ROAD_WIDTH / 2) - 0.3);

// خطوط الوسط البيضاء المتقطعة
for (let z = 0; z > -ROAD_LENGTH; z -= 8) {
  const dash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 4),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
  );
  dash.rotation.x = -Math.PI / 2;
  dash.position.set(0, 0.01, z - 4);
  scene.add(dash);
}

// =============================================
//   بيئة المدينة (City Environment)
// =============================================

// رصيف جانبي
function makeSidewalk(x) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3, ROAD_LENGTH),
    new THREE.MeshLambertMaterial({ color: 0xBBBBBB })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.02, -ROAD_LENGTH / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);
}
makeSidewalk(-(ROAD_WIDTH / 2) - 1.5);
makeSidewalk( (ROAD_WIDTH / 2) + 1.5);

// حافة الرصيف (Curb)
function makeCurb(x) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, ROAD_LENGTH),
    new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
  );
  mesh.position.set(x, 0.075, -ROAD_LENGTH / 2);
  scene.add(mesh);
}
makeCurb(-(ROAD_WIDTH / 2));
makeCurb( (ROAD_WIDTH / 2));

// مباني المدينة
function createBuilding(x, z) {
  const group = new THREE.Group();
  const w = 4 + Math.random() * 5;
  const h = 6 + Math.random() * 14;
  const d = 4 + Math.random() * 5;
  const pallete = [0x8899AA, 0x99AABB, 0x778899, 0xAABBCC, 0x667788, 0x556677];
  const col = pallete[Math.floor(Math.random() * pallete.length)];

  // جسم المبنى
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color: col })
  );
  body.position.y = h / 2;
  body.castShadow = true;
  group.add(body);

  // سقف
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2),
    new THREE.MeshLambertMaterial({ color: 0x334455 })
  );
  roof.position.y = h + 0.15;
  group.add(roof);

  // نوافذ
  const winMat = new THREE.MeshBasicMaterial({ color: 0xFFEE88 });
  const rows = Math.floor(h / 2.5);
  const cols = Math.floor(w / 1.8);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.35) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7), winMat);
        win.position.set(-w/2 + 1.1 + c * 1.8, 1.5 + r * 2.5, d/2 + 0.01);
        group.add(win);
      }
    }
  }
  group.position.set(x, 0, z);
  scene.add(group);
}

// أعمدة إنارة
function createLamp(x, z) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
    new THREE.MeshLambertMaterial({ color: 0x555566 })
  );
  pole.position.y = 2.5;
  pole.castShadow = true;
  group.add(pole);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.18, 0.18),
    new THREE.MeshLambertMaterial({ color: 0x444455 })
  );
  head.position.set(x > 0 ? -0.3 : 0.3, 5.1, 0);
  group.add(head);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFFFF99 })
  );
  bulb.position.set(x > 0 ? -0.3 : 0.3, 5.0, 0);
  group.add(bulb);

  group.position.set(x, 0, z);
  scene.add(group);
}

// أشجار الشارع
function createStreetTree(x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 2.2, 8),
    new THREE.MeshLambertMaterial({ color: 0x4A2E0A })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  group.add(trunk);

  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 10, 10),
    new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(0.3, 0.55, 0.25) })
  );
  leaf.position.y = 3.0;
  leaf.castShadow = true;
  group.add(leaf);

  group.position.set(x, 0, z);
  scene.add(group);
}

// توزيع عناصر المدينة
for (let z = -10; z > -ROAD_LENGTH + 30; z -= 18) {
  const ox = ROAD_WIDTH / 2 + 3;
  createBuilding( ox + 3 + Math.random() * 2, z - Math.random() * 5);
  createBuilding(-ox - 3 - Math.random() * 2, z - Math.random() * 5);
}
for (let z = -5; z > -ROAD_LENGTH; z -= 20) {
  createLamp( ROAD_WIDTH / 2 + 0.5, z);
  createLamp(-ROAD_WIDTH / 2 - 0.5, z);
}
for (let z = -12; z > -ROAD_LENGTH; z -= 10) {
  createStreetTree( ROAD_WIDTH / 2 + 2.5, z);
  createStreetTree(-ROAD_WIDTH / 2 - 2.5, z);
}

// =============================================
//   السيارة (Car)
// =============================================
function buildCar() {
  const car = new THREE.Group();

  // جسم السيارة السفلي
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.6, 4.4),
    new THREE.MeshLambertMaterial({ color: 0xCC2200 })
  );
  body.position.y = 0.55;
  body.castShadow = true;
  car.add(body);

  // الكابينة
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.55, 2.4),
    new THREE.MeshLambertMaterial({ color: 0xAA1800 })
  );
  cabin.position.set(0, 1.12, -0.2);
  cabin.castShadow = true;
  car.add(cabin);

  // الزجاج الأمامي والخلفي
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.6 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.48, 0.08), glassMat);
  windshield.position.set(0, 1.12, 0.98);
  car.add(windshield);
  const rearGlass = windshield.clone();
  rearGlass.position.set(0, 1.12, -1.38);
  car.add(rearGlass);

  // المصابيح الأمامية
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99 });
  const hlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.08);
  [-0.7, 0.7].forEach(x => {
    const h = new THREE.Mesh(hlGeo, hlMat);
    h.position.set(x, 0.58, 2.22);
    car.add(h);
  });

  // المصابيح الخلفية
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xFF2200 });
  [-0.7, 0.7].forEach(x => {
    const t = new THREE.Mesh(hlGeo, tlMat);
    t.position.set(x, 0.58, -2.22);
    car.add(t);
  });

  // العجلات
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 18);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const rimGeo   = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
  const rimMat   = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
  const wheelPositions = [
    [-1.15, 0.38,  1.4],
    [ 1.15, 0.38,  1.4],
    [-1.15, 0.38, -1.4],
    [ 1.15, 0.38, -1.4],
  ];
  const wheels = [];
  wheelPositions.forEach(pos => {
    const wg = new THREE.Group();
    const w  = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.castShadow = true;
    const r = new THREE.Mesh(rimGeo, rimMat);
    r.rotation.z = Math.PI / 2;
    wg.add(w); wg.add(r);
    wg.position.set(...pos);
    car.add(wg);
    wheels.push(wg);
  });

  // المصدات
  const bumperMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const bumperGeo = new THREE.BoxGeometry(2.2, 0.2, 0.15);
  const fb = new THREE.Mesh(bumperGeo, bumperMat);
  fb.position.set(0, 0.3, 2.28);
  car.add(fb);
  const rb = fb.clone();
  rb.position.set(0, 0.3, -2.28);
  car.add(rb);

  return { car, wheels };
}

const { car: carMesh, wheels } = buildCar();
carMesh.position.set(0, 0, 0);
scene.add(carMesh);

// =============================================
//   فيزياء السيارة (Physics)
// =============================================
const carState = {
  x: 0, z: 0,
  angle: 0,
  speed: 0,
  throttle: 0,
  brake: 0,
  steer: 0,
  distanceTraveled: 0,
  isOnRoad: true,
};

const PHYSICS = {
  maxSpeed:        16,
  acceleration:    0.14,
  brakeForce:      0.28,
  friction:        0.983,
  offRoadFriction: 0.93,
  steerSpeed:      0.045,
  maxSteer:        0.065,
  steerReturn:     0.08,
};

// =============================================
//   الصوت (بدون صوت)
// =============================================
function startAudio() {}
function updateEngineSound() {}

// =============================================
//   الجوي ستيك (Mobile Joystick)
// =============================================
const joystickZone  = document.getElementById('joystick-zone');
const joystickBase  = document.getElementById('joystick-base');
const joystickThumb = document.getElementById('joystick-thumb');
const btnGas        = document.getElementById('btn-gas');
const btnBrake      = document.getElementById('btn-brake');
const btnHandbrake  = document.getElementById('btn-handbrake');

const joystick = { active: false, id: null, startX: 0, startY: 0, dx: 0, dy: 0 };
const JOYSTICK_RADIUS = 38;

function joystickStart(e) {
  e.preventDefault();
  const touch = e.changedTouches ? e.changedTouches[0] : e;
  joystick.active = true;
  joystick.id = touch.identifier ?? 0;
  const rect = joystickBase.getBoundingClientRect();
  joystick.startX = rect.left + rect.width  / 2;
  joystick.startY = rect.top  + rect.height / 2;
}
function joystickMove(e) {
  e.preventDefault();
  if (!joystick.active) return;
  let touch = null;
  if (e.changedTouches) {
    for (let t of e.changedTouches) { if (t.identifier === joystick.id) { touch = t; break; } }
  } else { touch = e; }
  if (!touch) return;
  let dx = touch.clientX - joystick.startX;
  let dy = touch.clientY - joystick.startY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > JOYSTICK_RADIUS) { dx = dx/dist*JOYSTICK_RADIUS; dy = dy/dist*JOYSTICK_RADIUS; }
  joystick.dx = dx / JOYSTICK_RADIUS;
  joystick.dy = dy / JOYSTICK_RADIUS;
  joystickThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function joystickEnd(e) {
  e.preventDefault();
  joystick.active = false;
  joystick.dx = 0; joystick.dy = 0;
  joystickThumb.style.transform = 'translate(-50%, -50%)';
}
joystickZone.addEventListener('touchstart', joystickStart, { passive: false });
joystickZone.addEventListener('touchmove',  joystickMove,  { passive: false });
joystickZone.addEventListener('touchend',   joystickEnd,   { passive: false });
joystickZone.addEventListener('mousedown',  joystickStart);
window.addEventListener('mousemove', e => { if (joystick.active) joystickMove(e); });
window.addEventListener('mouseup',   e => { if (joystick.active) joystickEnd(e); });

// ربط أزرار الجوال بالمفاتيح
function bindBtn(el, keyCode) {
  const press   = e => { e.preventDefault(); keys[keyCode] = true;  el.classList.add('pressed'); };
  const release = e => { e.preventDefault(); keys[keyCode] = false; el.classList.remove('pressed'); };
  el.addEventListener('touchstart', press,   { passive: false });
  el.addEventListener('touchend',   release, { passive: false });
  el.addEventListener('mousedown',  press);
  el.addEventListener('mouseup',    release);
  el.addEventListener('mouseleave', release);
}

// =============================================
//   الكيبورد (Keyboard)
// =============================================
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

bindBtn(btnGas,       'ArrowUp');
bindBtn(btnBrake,     'ArrowDown');
bindBtn(btnHandbrake, 'Space');

// =============================================
//   الكاميرا (Camera)
// =============================================
const camOffset = new THREE.Vector3(0, 4.5, 11);
const camTarget = new THREE.Vector3();
const camPos    = new THREE.Vector3();

// =============================================
//   HUD — تحديث العرض
// =============================================
const speedDisplay = document.getElementById('speed-display');
const gearDisplay  = document.getElementById('gear-display');
const throttleFill = document.getElementById('throttle-fill');
const brakeFill    = document.getElementById('brake-fill');
const distVal      = document.getElementById('dist-val');
const offRoadWarn  = document.getElementById('off-road-warn');
const directionText= document.getElementById('direction-text');

function getDirection(angle) {
  const deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
  if (deg < 22.5  || deg >= 337.5) return 'شمال';
  if (deg < 67.5)  return 'شمال-شرق';
  if (deg < 112.5) return 'شرق';
  if (deg < 157.5) return 'جنوب-شرق';
  if (deg < 202.5) return 'جنوب';
  if (deg < 247.5) return 'جنوب-غرب';
  if (deg < 292.5) return 'غرب';
  return 'شمال-غرب';
}

function getGear(speed) {
  const s = Math.abs(speed);
  if (speed < -0.1) return 'R';
  if (s < 0.2)  return 'N';
  if (s < 4)    return '1';
  if (s < 8)    return '2';
  if (s < 12)   return '3';
  if (s < 15)   return '4';
  return '5';
}

function updateHUD() {
  const kmh = Math.abs(carState.speed) * 3.6 * 3;
  speedDisplay.textContent  = Math.round(kmh);
  gearDisplay.textContent   = getGear(carState.speed);
  throttleFill.style.width  = (carState.throttle * 100).toFixed(0) + '%';
  brakeFill.style.width     = (carState.brake    * 100).toFixed(0) + '%';
  distVal.textContent       = Math.round(carState.distanceTraveled);
  offRoadWarn.style.display = carState.isOnRoad ? 'none' : 'block';
  directionText.textContent = getDirection(carState.angle);
}

// =============================================
//   حلقة اللعبة (Game Loop)
// =============================================
let gameRunning = false;
let isPaused    = false;
let lastTime    = 0;
let wheelRotation = 0;

function update(dt) {
  // إدخال المستخدم — كيبورد + جوي ستيك
  const fwd   = keys['ArrowUp']    || keys['KeyW'] || joystick.dy < -0.25;
  const back  = keys['ArrowDown']  || keys['KeyS'] || joystick.dy >  0.25;
  const left  = keys['ArrowLeft']  || keys['KeyA'] || joystick.dx < -0.2;
  const right = keys['ArrowRight'] || keys['KeyD'] || joystick.dx >  0.2;
  const hand  = keys['Space'];

  // إعادة تعيين
  if (keys['KeyR']) {
    carState.x = 0; carState.z = 0;
    carState.angle = 0; carState.speed = 0;
    carState.distanceTraveled = 0;
  }

  // فيزياء السرعة
  const friction = carState.isOnRoad ? PHYSICS.friction : PHYSICS.offRoadFriction;

  if (fwd) {
    carState.speed += PHYSICS.acceleration * (1 - Math.abs(carState.speed) / PHYSICS.maxSpeed);
    carState.throttle = Math.min(1, carState.throttle + 0.06);
  } else {
    carState.throttle = Math.max(0, carState.throttle - 0.06);
  }

  if (back) {
    if (carState.speed > 0.2) {
      carState.speed -= PHYSICS.brakeForce;
      carState.brake  = Math.min(1, carState.brake + 0.1);
    } else {
      carState.speed -= PHYSICS.acceleration * 0.6;
      carState.brake  = Math.min(1, carState.brake + 0.04);
    }
  } else {
    carState.brake = Math.max(0, carState.brake - 0.08);
  }

  if (hand) {
    carState.speed *= 0.93;
    carState.brake  = Math.min(1, carState.brake + 0.12);
  }

  carState.speed *= friction;
  carState.speed  = Math.max(-PHYSICS.maxSpeed * 0.4, Math.min(PHYSICS.maxSpeed, carState.speed));

  // التوجيه
  if (Math.abs(carState.speed) > 0.1) {
    const sf = Math.min(1, Math.abs(carState.speed) / 3);
    const ja = joystick.active ? Math.abs(joystick.dx) : 1;
    if (left)  carState.steer = Math.max(-PHYSICS.maxSteer, carState.steer - PHYSICS.steerSpeed * sf * ja);
    if (right) carState.steer = Math.min( PHYSICS.maxSteer, carState.steer + PHYSICS.steerSpeed * sf * ja);
  }
  if (!left && !right) carState.steer *= (1 - PHYSICS.steerReturn);
  carState.angle -= carState.steer * Math.sign(carState.speed);

  // تحريك السيارة
  const prevZ = carState.z;
  carState.x += Math.sin(carState.angle) * carState.speed * dt * 60;
  carState.z -= Math.cos(carState.angle) * carState.speed * dt * 60;

  // حدود الطريق
  const halfRoad = (ROAD_WIDTH / 2) - 1.2;
  carState.isOnRoad = Math.abs(carState.x) < halfRoad;
  if (carState.z > 5)              { carState.z = 5;                carState.speed *= -0.3; }
  if (carState.z < -(ROAD_LENGTH - 10)) { carState.z = -(ROAD_LENGTH - 10); carState.speed = 0; }

  // المسافة المقطوعة
  const dz = Math.abs(carState.z - prevZ);
  const dx = Math.abs(carState.x);
  carState.distanceTraveled += Math.sqrt(dz*dz + dx*dx) * 0.5;

  // تحديث الموضع
  carMesh.position.set(carState.x, 0, carState.z);
  carMesh.rotation.y = carState.angle;

  // دوران العجلات
  wheelRotation += carState.speed * dt * 60 * 0.25;
  wheels.forEach((w, i) => {
    w.rotation.x = wheelRotation;
    if (i < 2) w.rotation.y = carState.steer * 12;
  });

  // الكاميرا
  const idealOffset = camOffset.clone().applyEuler(new THREE.Euler(0, carState.angle, 0));
  camPos.lerp(carMesh.position.clone().add(idealOffset), 0.08);
  camera.position.copy(camPos);
  camTarget.lerp(carMesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0.12);
  camera.lookAt(camTarget);

  // تحريك الشمس
  sunLight.target.position.copy(carMesh.position);
  sunLight.position.set(carMesh.position.x + 80, 120, carMesh.position.z + 50);

  updateHUD();
}

function animate(time) {
  if (!gameRunning || isPaused) return;
  requestAnimationFrame(animate);
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  renderer.render(scene, camera);
}

// ضبط الكاميرا الأولية
camera.position.set(0, 6, 14);
camera.lookAt(0, 0, 0);
camPos.copy(camera.position);
renderer.render(scene, camera);

// =============================================
//   قائمة الإيقاف المؤقت (Pause Menu)
// =============================================
const pauseScreen = document.getElementById('pause-screen');
const aboutScreen = document.getElementById('about-screen');
const howtoScreen = document.getElementById('howto-screen');

function openPause() {
  isPaused = true;
  gameRunning = false;
  pauseScreen.classList.add('active');
}
function closePause() {
  isPaused = false;
  gameRunning = true;
  pauseScreen.classList.remove('active');
  lastTime = performance.now();
  animate(lastTime);
}
function restartGame() {
  carState.x = 0; carState.z = 0;
  carState.angle = 0; carState.speed = 0;
  carState.steer = 0; carState.distanceTraveled = 0;
  closePause();
}

// ربط أزرار القائمة
document.getElementById('menu-btn').addEventListener('click', () => {
  if (!gameRunning && !isPaused) return;
  if (isPaused) closePause(); else openPause();
});
document.getElementById('pm-resume').addEventListener('click', closePause);
document.getElementById('pm-restart').addEventListener('click', restartGame);
document.getElementById('pm-exit').addEventListener('click', () => {
  pauseScreen.classList.remove('active');
  isPaused = false; gameRunning = false;
  carState.x=0; carState.z=0; carState.angle=0; carState.speed=0;
  carState.steer=0; carState.distanceTraveled=0;
  const s = document.getElementById('start-screen');
  s.style.display = 'flex';
  setTimeout(() => { s.style.opacity = '1'; }, 10);
});
document.getElementById('pm-howto').addEventListener('click', () => {
  pauseScreen.classList.remove('active');
  howtoScreen.style.display = 'flex';
});
document.getElementById('pm-about').addEventListener('click', () => {
  pauseScreen.classList.remove('active');
  aboutScreen.classList.add('active');
});
document.getElementById('howto-back').addEventListener('click', () => {
  howtoScreen.style.display = 'none';
  pauseScreen.classList.add('active');
});
document.getElementById('about-back').addEventListener('click', () => {
  aboutScreen.classList.remove('active');
  pauseScreen.classList.add('active');
});

// مفتاح ESC
window.addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (!gameRunning && !isPaused) return;
    if (howtoScreen.style.display === 'flex') {
      howtoScreen.style.display = 'none';
      pauseScreen.classList.add('active');
    } else if (aboutScreen.classList.contains('active')) {
      aboutScreen.classList.remove('active');
      pauseScreen.classList.add('active');
    } else if (isPaused) { closePause(); }
    else { openPause(); }
  }
});

// =============================================
//   زر البداية
// =============================================
document.getElementById('start-btn').addEventListener('click', () => {
  const screen = document.getElementById('start-screen');
  screen.style.opacity = '0';
  setTimeout(() => { screen.style.display = 'none'; }, 700);
  gameRunning = true;
  lastTime = performance.now();
  animate(lastTime);
});
