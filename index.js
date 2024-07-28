const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const penPencil = document.querySelector('.pen-pencil');
const clearButton = document.getElementById('clear');
const eraserButton = document.getElementById('eraser');
const resetButton = document.getElementById('reset');
const saveButton = document.getElementById('save');
const resizeButton = document.getElementById('resize');
const sizeTabs = document.querySelectorAll('#size-tab1, #size-tab2, #size-tab3, #size-tab4');
const colorButtons = document.querySelectorAll('.colors button');

let isDrawing = false;
let isEraser = false;
let currentSize = 2;
let currentColor = '#000000';
let canvasState = [];

function initializeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.backgroundColor = "white";
}

// Change cursor style
function setCursor(type) {
    canvas.style.cursor = type;
}

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    draw(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        draw(e);
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.beginPath();
    saveCanvasState();
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
    ctx.beginPath();
});

canvas.addEventListener('mouseenter', (e) => {
    if (e.buttons === 1) { // Check if the left mouse button is pressed
        isDrawing = true;
        draw(e);
    }
});

// Touch event handlers
canvas.addEventListener('touchstart', (e) => {
    isDrawing = true;
    drawTouch(e);
});

canvas.addEventListener('touchmove', (e) => {
    if (isDrawing) {
        drawTouch(e);
    }
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
    ctx.beginPath();
    saveCanvasState();
});

canvas.addEventListener('touchcancel', () => {
    isDrawing = false;
    ctx.beginPath();
});

sizeTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        currentSize = (index + 1) * 2; // Size 2, 4, 6, 8
        sizeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

colorButtons.forEach(button => {
    button.addEventListener('mouseover', () => {
        button.style.border = '2px solid black';
    });
    button.addEventListener('mouseout', () => {
        button.style.border = '1px solid black';
    });
    button.addEventListener('click', () => {
        currentColor = button.style.backgroundColor;
        isEraser = false;
        setCursor('crosshair');
    });
});

clearButton.addEventListener('click', () => {
    if (canvasState.length > 0) {
        canvasState.pop();
        if (canvasState.length > 0) {
            restoreCanvasState();
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
});

resetButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasState = [];
    saveCanvasToLocalStorage();
});

saveButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'canvas_image.png';
    link.href = canvas.toDataURL();
    link.click();
});

resizeButton.addEventListener('click', () => {
    const newWidth = prompt('Enter new width:', canvas.width);
    const newHeight = prompt('Enter new height:', canvas.height);
    if (newWidth && newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        initializeCanvas();
        restoreCanvasState();
    }
});

eraserButton.addEventListener('click', () => {
    isEraser = true;
    currentSize = 10;
    setCursor('url("eraser-icon.png"), auto'); // Change to an eraser cursor, use a custom eraser icon if available
});

penPencil.addEventListener('click', () => {
    isEraser = false;
    currentSize = 2;
    setCursor('url("pencil-icon.png"), auto'); // Change to a pencil cursor, use a custom pencil icon if available
});

window.addEventListener('beforeunload', () => {
    saveCanvasToLocalStorage();
});

// Drawing function for mouse
function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraser ? 'white' : currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Drawing function for touch
function drawTouch(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraser ? 'white' : currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    e.preventDefault(); // Prevent scrolling on touch devices
}

// Save canvas state
function saveCanvasState() {
    canvasState.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    saveCanvasToLocalStorage();
}

// Restore canvas state
function restoreCanvasState() {
    if (canvasState.length > 0) {
        const state = canvasState[canvasState.length - 1];
        ctx.putImageData(state, 0, 0);
    }
}

// Save canvas to localStorage
function saveCanvasToLocalStorage() {
    localStorage.setItem('canvasState', JSON.stringify({
        dataURL: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height
    }));
}

// Load canvas from localStorage
function loadCanvasFromLocalStorage() {
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
        const { dataURL, width, height } = JSON.parse(savedState);
        canvas.width = width;
        canvas.height = height;
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            saveCanvasState();
        };
        img.src = dataURL;
    }
}

// Initialize canvas state
initializeCanvas();
loadCanvasFromLocalStorage();
if (canvasState.length === 0) {
    saveCanvasState();
}
