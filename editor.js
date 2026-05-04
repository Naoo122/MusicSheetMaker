let audio = new Audio();
let notes = [];
let selectedHand = 0;
let selectedRotation = 0;
let bpm = 120;
let timelineCanvas, ctx;
let timelineScale = 100;   // 1秒 = 100px（ズーム用にも使える）
let offsetX = 0;           // タイムラインの表示オフセット（自由移動の肝）

let isPanning = false;
let panStartX = 0;
let panStartOffsetX = 0;


let timelineCanvas, ctx;

window.onload = () => {
    setupGrid();
    setupTimeline();
};

/* ---------------- グリッド ---------------- */

function setupGrid() {
    const grid = document.getElementById("grid");

    for (let i = 0; i < 25; i++) {
        const cell = document.createElement("div");
        cell.onclick = () => addNoteAtCurrentTime(i);
        grid.appendChild(cell);
    }
}

/* ---------------- 音楽 ---------------- */

document.getElementById("musicFile").onchange = function(e) {
    const file = e.target.files[0];
    audio.src = URL.createObjectURL(file);
};

function playMusic() { audio.play(); }
function pauseMusic() { audio.pause(); }
function changeSpeed() { audio.playbackRate = parseFloat(speed.value); }
function changeBPM() { bpm = parseInt(document.getElementById("bpm").value); }

/* ---------------- ノーツ追加 ---------------- */

function addNoteAtCurrentTime(gridIndex) {
    const time = audio.currentTime;

    notes.push({
        time: time,
        spawnPos: gridIndex,
        hand: selectedHand,
        rotation: selectedRotation
    });

    drawTimeline();
}

function setHand(h) { selectedHand = h; }
function setRotation(r) { selectedRotation = r; }

/* ---------------- JSON 保存 ---------------- */

function saveJson() {
    const data = {
        bpm: bpm,
        musicFile: "song1",
        notes: notes
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "chart.json";
    a.click();
}

/* ---------------- タイムライン描画 ---------------- */

function setupTimeline() {
    timelineCanvas = document.getElementById("timeline");
    ctx = timelineCanvas.getContext("2d");

    // 既存の setInterval はそのまま
    setInterval(drawTimeline, 50);

    // ★ ドラッグでタイムラインを動かす
    timelineCanvas.addEventListener("mousedown", onTimelineMouseDown);
    window.addEventListener("mousemove", onTimelineMouseMove);
    window.addEventListener("mouseup", onTimelineMouseUp);
}

function onTimelineMouseDown(e) {
    // 左クリックでパン開始
    if (e.button === 0) {
        isPanning = true;
        panStartX = e.clientX;
        panStartOffsetX = offsetX;
    }
}

function onTimelineMouseMove(e) {
    if (!isPanning) return;

    const dx = e.clientX - panStartX;
    offsetX = panStartOffsetX + dx;
}

function onTimelineMouseUp(e) {
    isPanning = false;
}


function drawTimeline() {
    ctx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);

    // 小節線などを描くならここで offsetX を使う

    // ノーツ描画
    notes.forEach(n => {
        const x = n.time * timelineScale + offsetX;  // ★ ここに offsetX を足す
        const y = 20 + (n.spawnPos * 3);

        ctx.fillStyle = n.hand === 0 ? "#4af" : "#f44";
        ctx.fillRect(x, y, 20, 20);
    });

    // 再生カーソル
    const cursorX = audio.currentTime * timelineScale + offsetX; // ★ ここも
    ctx.fillStyle = "#0f0";
    ctx.fillRect(cursorX, 0, 2, 300);
}
