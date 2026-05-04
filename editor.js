let audio = new Audio();
let notes = [];
let selectedHand = 0;
let selectedRotation = 0;
let bpm = 120;

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

    setInterval(drawTimeline, 50);
}

function drawTimeline() {
    ctx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);

    const scale = 100; // 1秒 = 100px

    // ノーツ描画
    notes.forEach(n => {
        const x = n.time * scale;
        const y = 20 + (n.spawnPos * 3);

        ctx.fillStyle = n.hand === 0 ? "#4af" : "#f44";
        ctx.fillRect(x, y, 20, 20);
    });

    // 再生カーソル
    const cursorX = audio.currentTime * scale;
    ctx.fillStyle = "#0f0";
    ctx.fillRect(cursorX, 0, 2, 300);
}
