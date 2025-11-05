// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn;
let circleColor; // 원의 색상 (RGB 값)

// 가속도 센서 관련 변수
let accelBtn, accelStatusP, accelDataP;
let accelX = 0, accelY = 0, accelZ = 0;
let isAccelActive = false;
let ballX, ballY; // 원의 위치
let ballVX = 0, ballVY = 0; // 원의 속도

function setup() {
  createCanvas(windowWidth, windowHeight);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // Send 버튼들
  let send1Btn = createButton("send 1");
  send1Btn.mousePressed(() => {
    sendNumber(1);
    changeCircleColor(1);
  });
  send1Btn.size(120, 30);
  send1Btn.position(20, 100);

  let send2Btn = createButton("send 2");
  send2Btn.mousePressed(() => {
    sendNumber(2);
    changeCircleColor(2);
  });
  send2Btn.size(120, 30);
  send2Btn.position(20, 140);

  let send3Btn = createButton("send 3");
  send3Btn.mousePressed(() => {
    sendNumber(3);
    changeCircleColor(3);
  });
  send3Btn.size(120, 30);
  send3Btn.position(20, 180);

  // 초기 색상 설정 (기본값)
  circleColor = [255, 255, 255]; // 흰색으로 시작

  // 가속도 센서 활성화 버튼
  accelBtn = createButton("가속도 센서 활성화");
  accelBtn.mousePressed(activateAccelerometer);
  accelBtn.size(150, 30);
  accelBtn.position(20, 220);

  accelStatusP = createP("가속도 센서: 비활성화");
  accelStatusP.position(22, 240);

  accelDataP = createP("X: 0.00, Y: 0.00, Z: 0.00");
  accelDataP.position(22, 260);

  // 원의 초기 위치 (캔버스 중앙)
  ballX = width / 2;
  ballY = height / 2;
}

function draw() {
  background(240); // 배경색
  
  // 가속도 센서가 활성화된 경우 원의 물리 운동 업데이트
  if (isAccelActive) {
    // 가속도를 속도에 적용 (감쇠 적용)
    ballVX += accelX * 0.1;
    ballVY += accelY * 0.1;
    
    // 마찰 적용
    ballVX *= 0.98;
    ballVY *= 0.98;
    
    // 위치 업데이트
    ballX += ballVX;
    ballY += ballVY;
    
    // 캔버스 경계 체크 및 반사
    const radius = 10; // 원의 반지름
    if (ballX < radius) {
      ballX = radius;
      ballVX *= -0.8; // 반사
    } else if (ballX > width - radius) {
      ballX = width - radius;
      ballVX *= -0.8;
    }
    
    if (ballY < radius) {
      ballY = radius;
      ballVY *= -0.8;
    } else if (ballY > height - radius) {
      ballY = height - radius;
      ballVY *= -0.8;
    }
  } else {
    // 비활성화 시 중앙에 고정
    ballX = width / 2;
    ballY = height / 2;
    ballVX = 0;
    ballVY = 0;
  }
  
  // 지름 20인 파란색 원 그리기
  fill(0, 0, 255); // 파란색
  noStroke();
  circle(ballX, ballY, 20);
  
  // 기존 큰 원은 제거됨 (send 버튼으로 색상 변경하는 원)
}

// ---- BLE Connect ----
async function connectAny() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    statusP.html("Status: Error - " + e);
    console.error(e);
  }
}

// ---- 원의 색상 변경 ----
function changeCircleColor(n) {
  if (n === 1) {
    circleColor = [255, 0, 0]; // Red
  } else if (n === 2) {
    circleColor = [0, 255, 0]; // Green
  } else if (n === 3) {
    circleColor = [0, 0, 255]; // Blue
  }
}

// ---- 가속도 센서 활성화 ----
function activateAccelerometer() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ 권한 요청
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          setupAccelerometer();
        } else {
          accelStatusP.html("가속도 센서: 권한 거부됨");
        }
      })
      .catch(console.error);
  } else {
    // Android 또는 구형 iOS
    setupAccelerometer();
  }
}

// ---- 가속도 센서 설정 ----
function setupAccelerometer() {
  window.addEventListener('devicemotion', handleMotion);
  isAccelActive = true;
  accelStatusP.html("가속도 센서: 활성화됨");
  accelBtn.html("가속도 센서 비활성화");
  accelBtn.mousePressed(deactivateAccelerometer);
}

// ---- 가속도 센서 비활성화 ----
function deactivateAccelerometer() {
  window.removeEventListener('devicemotion', handleMotion);
  isAccelActive = false;
  accelX = 0;
  accelY = 0;
  accelZ = 0;
  accelStatusP.html("가속도 센서: 비활성화");
  accelBtn.html("가속도 센서 활성화");
  accelBtn.mousePressed(activateAccelerometer);
  accelDataP.html("X: 0.00, Y: 0.00, Z: 0.00");
}

// ---- 가속도 센서 데이터 처리 ----
function handleMotion(event) {
  if (event.accelerationIncludingGravity) {
    // 중력 포함 가속도 (g 단위)
    accelX = event.accelerationIncludingGravity.x || 0;
    accelY = event.accelerationIncludingGravity.y || 0;
    accelZ = event.accelerationIncludingGravity.z || 0;
    
    // 화면에 표시 (소수점 2자리)
    accelDataP.html(`X: ${accelX.toFixed(2)}, Y: ${accelY.toFixed(2)}, Z: ${accelZ.toFixed(2)}`);
  }
}

// ---- Write 1 byte to BLE ----
async function sendNumber(n) {
  if (!writeChar) {
    statusP.html("Status: Not connected");
    return;
  }
  try {
    await writeChar.writeValue(new Uint8Array([n & 0xff]));
    statusP.html("Status: Sent " + n);
  } catch (e) {
    statusP.html("Status: Write error - " + e);
  }
}
