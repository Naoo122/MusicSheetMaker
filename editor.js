let audio = new Audio();
let notes = [];
let selectedHand = 0;
let selectedRotation = 0;
let bpm = 120;

window.onload = () => {
    setupGrid();
    setupTimeline();
};

function setupGrid() {
    const grid = document.getElementById("grid");

    for (let i = 0; i < 25; i++) {
        const cell = document.createElement("div");
        cell.onclick = () => addNote(i, cell);
        grid.appendChild(cell);
    }
}

function playMusic() {
    audio.play();
}

function pauseMusic() {
    audio.pause();
}

document.getElementById("musicFile").onchange = function(e) {
    const file = e.target.files[0];
    audio.src = URL.createObjectURL(file);
};

function changeSpeed() {
    audio.playbackRate = parseFloat(document.getElementById("speed").value);
}

function changeBPM() {
    bpm = parseInt(document.getElementById("bpm").value);
}

function addNote(index, cell) {
    const time = audio.currentTime;

    notes.push({
        time: time,
        spawnPos: index,
        hand: selectedHand,
        rotation: selectedRotation
    });

    cell.classList.add("note");
    drawTimeline();
}

function setHand(h) {
    selectedHand = h;
}

function setRotation(r) {
    selectedRotation = r;
}

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

let timelineCanvas = null;
let ctx = null;

function setupTimeline() {
    timelineCanvas = document.getElementById("timeline");
    ctx = timelineCanvas.getContext("2d");

    setInterval(drawTimeline, 50);
}

function drawTimeline() {
    ctx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 50, timelineCanvas.width, 2);

    const scale = 100; // 1秒 = 100px

    notes.forEach(n => {
        const x = n.time * scale;

        ctx.fillStyle = n.hand === 0 ? "#4af" : "#f44";
        ctx.fillRect(x, 30, 10, 40);
    });

    const cursorX = audio.currentTime * scale;
    ctx.fillStyle = "#0f0";
    ctx.fillRect(cursorX, 0, 2, 120);
}
