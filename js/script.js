'use strict';

const form       = document.getElementById('point-form');
const yInput     = document.getElementById('y-input');
const errorBox   = document.getElementById('error');
const tbody      = document.getElementById('results-body');
const canvas     = document.getElementById('graph');
const ctx        = canvas.getContext('2d');
const xButtons   = document.querySelectorAll('.x-btn');
const rRadios    = document.querySelectorAll('input[name="r"]');

const STORAGE_KEY = 'lab1-results';
let selectedX = null;
let results   = [];

xButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        selectedX = btn.value;
        xButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

function validate(xStr, yStr, rStr) {
    if (xStr === null) return { error: 'Выберите X' };
    if (rStr === null) return { error: 'Выберите R' };

    const yClean = yStr.trim().replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(yClean)) {
        return { error: 'Y должен быть числом (например, 1.5)' };
    }
    const y = Number(yClean);
    if (!(y >= -3 && y <= 3)) {
        return { error: 'Y должен быть в диапазоне от -3 до 3' };
    }
    return { x: Number(xStr), y: y, r: Number(rStr) };
}

function isHit(x, y, r) {
    if (x >= 0 && y >= 0) return y <= r / 2 - x / 2;
    if (x >= 0 && y <  0) return x <= r && y >= -r;
    if (x <  0 && y <  0) return x * x + y * y <= r * r;
    return y === 0 && x >= -r;
}

function formatDate(ts) {
    return new Date(ts).toLocaleString('ru-RU');
}

function addRow(rec) {
    const tr = document.createElement('tr');
    const cells = [rec.x, rec.y, rec.r, rec.hit ? 'Попал' : 'Не попал', formatDate(rec.time)];
    cells.forEach(function (text, i) {
        const td = document.createElement('td');
        td.textContent = text;
        if (i === 3) td.className = rec.hit ? 'hit' : 'miss';
        tr.appendChild(td);
    });
    tbody.prepend(tr);
}

function saveResults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function loadResults() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        results = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        results = [];
    }
    results.forEach(addRow);
}

function drawGraph(r) {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = 150;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#3399ff';

    //(I четверть)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - R / 2);
    ctx.lineTo(cx + R, cy);
    ctx.closePath();
    ctx.fill();

    //(IV четверть)
    ctx.fillRect(cx, cy, R, R);

    //(III четверть)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, Math.PI / 2, Math.PI);
    ctx.closePath();
    ctx.fill();

    // оси
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(10, cy);  ctx.lineTo(W-10, cy);
    ctx.moveTo(cx, 10);  ctx.lineTo(cx, H-10);
    ctx.stroke();

    // подписи
    ctx.fillStyle = '#000';
    const label = r === null ? 'R' : String(r);
    const half  = r === null ? 'R/2' : String(r / 2);
    ctx.fillText(label,  cx + R - 4, cy - 6);
    ctx.fillText('-' + label, cx - R - 4, cy - 6);
    ctx.fillText(half, cx + 6, cy - R / 2);
    ctx.fillText('-' + label, cx + 6, cy + R);
}

function getSelectedR() {
    const checked = document.querySelector('input[name="r"]:checked');
    return checked ? checked.value : null;
}

rRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
        drawGraph(Number(getSelectedR()));
    });
});

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const v = validate(selectedX, yInput.value, getSelectedR());
    if (v.error) {
        errorBox.textContent = v.error;
        return;
    }
    errorBox.textContent = '';

    const rec = {
        x: v.x, y: v.y, r: v.r,
        hit: isHit(v.x, v.y, v.r),
        time: Date.now()
    };
    results.push(rec);
    saveResults();
    addRow(rec);
});

loadResults();
drawGraph(null);