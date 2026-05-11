// ====== データ ======
let notes = [];
let bpm = 120;
let gridSize = 4;
let selected = null;

let audioBuffer = null;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentTime = 0;

let draggingNote = null;
let draggingPlayhead = false;

// ====== DOM ======
const grid = document.getElementById("grid");
const waveform = document.getElementById("waveform");
const timeline = document.getElementById("timeline");

// ====== グリッド生成 ======
function rebuildGrid() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement("div");
        cell.style.border = "1px solid #666";
        cell.dataset.lane = i + 1;

        cell.addEventListener("click", () => {
            addNote(currentTime, i + 1, 0);
        });

        cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            addNote(currentTime, i + 1, 1);
        });

        grid.appendChild(cell);
    }
}

function addNote(time, lane, hand) {
    const n = {
        time: snapTime(time),
        lane: lane,
        hand: hand,
        rotation: 0
    };
    notes.push(n);
    selected = n;
    updateProperties();
    drawTimeline();
}

// ====== プロパティ更新 ======
function updateProperties() {
    if (!selected) {
        document.getElementById("prop-none").style.display = "block";
        document.getElementById("prop-edit").style.display = "none";
        return;
    }

    document.getElementById("prop-none").style.display = "none";
    document.getElementById("prop-edit").style.display = "block";

    document.getElementById("prop-time").value = selected.time;
    document.getElementById("prop-lane").value = selected.lane;
    document.getElementById("prop-hand").value = selected.hand;
    document.getElementById("prop-rot").value = selected.rotation;
}

// ====== スナップ ======
function snapTime(t) {
    const beatSec = 60 / bpm;
    const snapSec = beatSec / 4;
    return Math.round(t / snapSec) * snapSec;
}

// ====== 波形描画 ======
function drawWaveform() {
    if (!audioBuffer) return;

    const ctx = waveform.getContext("2d");
    waveform.width = window.innerWidth;
    waveform.height = 120;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, waveform.width, waveform.height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.floor(data.length / waveform.width);

    ctx.strokeStyle = "#0af";
    ctx.beginPath();

    for (let x = 0; x < waveform.width; x++) {
        let sum = 0;
        for (let i = 0; i < step; i++) {
            sum += Math.abs(data[x * step + i]);
        }
        const v = sum / step;
        const y = (1 - v) * waveform.height;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

// ====== タイムライン描画 ======
function drawTimeline() {
    if (!audioBuffer) return;

    const ctx = timeline.getContext("2d");
    timeline.width = window.innerWidth;
    timeline.height = 300;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, timeline.width, timeline.height);

    // 白線（スナップ）
    const beatSec = 60 / bpm;
    const snapSec = beatSec / 4;

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    for (let t = 0; t < audioBuffer.duration; t += snapSec) {
        const x = (t / audioBuffer.duration) * timeline.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, timeline.height);
        ctx.stroke();
    }

    // ノーツ描画
    for (const n of notes) {
        const x = (n.time / audioBuffer.duration) * timeline.width;
        const y = (n.lane - 1) * (timeline.height / (gridSize * gridSize));

        ctx.fillStyle = n.hand === 0 ? "#f55" : "#55f";
        ctx.fillRect(x, y, 40, 20);

        // 回転矢印
        const arrows = ["▲", "▶", "▼", "◀"];
        ctx.fillStyle = "white";
        ctx.fillText(arrows[n.rotation], x + 12, y + 15);
    }

    // 再生位置
    const px = (currentTime / audioBuffer.duration) * timeline.width;
    ctx.strokeStyle = "#0f0";
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, timeline.height);
    ctx.stroke();
}

// ====== タイムライン操作 ======
timeline.addEventListener("mousedown", (e) => {
    draggingPlayhead = true;
    updatePlayhead(e);
});

timeline.addEventListener("mousemove", (e) => {
    if (draggingPlayhead) updatePlayhead(e);
});

timeline.addEventListener("mouseup", () => {
    draggingPlayhead = false;
});

function updatePlayhead(e) {
    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    currentTime = (x / timeline.width) * audioBuffer.duration;
    drawTimeline();
}

// ====== ノーツの右クリックメニュー ======
timeline.addEventListener("contextmenu", (e) => {
    e.preventDefault();

    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = (x / timeline.width) * audioBuffer.duration;

    const clicked = notes.find(n => Math.abs(n.time - t) < 0.1);
    if (!clicked) return;

    selected = clicked;
    updateProperties();

    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
    menu.style.background = "#333";
    menu.style.border = "1px solid #666";
    menu.style.padding = "5px";

    menu.innerHTML = `
        <div id="dup">複製</div>
        <div id="del">削除</div>
    `;

    document.body.appendChild(menu);

    document.getElementById("dup").onclick = () => {
        notes.push({ ...clicked });
        drawTimeline();
        menu.remove();
    };

    document.getElementById("del").onclick = () => {
        notes = notes.filter(n => n !== clicked);
        selected = null;
        updateProperties();
        drawTimeline();
        menu.remove();
    };

    document.body.addEventListener("click", () => menu.remove(), { once: true });
});

// ====== JSON 読み込み ======
document.getElementById("load-json").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
        const text = await e.target.files[0].text();
        const data = JSON.parse(text);
        notes = data.notes;
        bpm = data.bpm;
        document.getElementById("bpm").value = bpm;
        drawTimeline();
    };
    input.click();
};

// ====== JSON 保存 ======
document.getElementById("save-json").onclick = () => {
    const data = {
        bpm: bpm,
        notes: notes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "chart.json";
    a.click();
};

// ====== 音声読み込み ======
document.getElementById("audio-file").onchange = async (e) => {
    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    drawWaveform();
    drawTimeline();
};

// ====== 初期化 ======
rebuildGrid();