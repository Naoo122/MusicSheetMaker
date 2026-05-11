// ====== Three.js 3D Preview ======

let scene, camera, renderer;
let noteObjects = [];

init3D();
animate3D();

function init3D() {
    const container = document.getElementById("preview3d");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // ライト
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 2, 5);
    scene.add(light);
}

// ====== ノーツの 3D モデル生成 ======
function createNoteMesh(hand, rotation) {
    const color = hand === 0 ? 0xff4444 : 0x4444ff;
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    // 回転（▲▶▼◀）
    mesh.rotation.z = rotation * (Math.PI / 2);

    return mesh;
}

// ====== プレビュー更新 ======
function update3DPreview() {
    if (!audioBuffer) return;

    // 既存ノーツ削除
    for (const obj of noteObjects) scene.remove(obj);
    noteObjects = [];

    // 2秒以内のノーツだけ表示
    const visible = notes.filter(n =>
        n.time >= currentTime && n.time <= currentTime + 2
    );

    for (const n of visible) {
        const mesh = createNoteMesh(n.hand, n.rotation);

        // レーン → X,Y 位置
        const x = ((n.lane - 1) % gridSize) - (gridSize - 1) / 2;
        const y = -Math.floor((n.lane - 1) / gridSize) + (gridSize - 1) / 2;

        mesh.position.x = x * 0.4;
        mesh.position.y = y * 0.4;

        // 時間差 → Z（奥行き）
        const dt = n.time - currentTime;
        mesh.position.z = -dt * 5;

        scene.add(mesh);
        noteObjects.push(mesh);
    }
}

// ====== 毎フレーム描画 ======
function animate3D() {
    requestAnimationFrame(animate3D);
    renderer.render(scene, camera);
}