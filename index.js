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
let socket;

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
    sendDrawEvent(e, 'mousedown');
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        draw(e);
        sendDrawEvent(e, 'mousemove');
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.beginPath();
    saveCanvasState();
    sendDrawEvent(null, 'mouseup');
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
    sendDrawEvent(e, 'touchstart');
});

canvas.addEventListener('touchmove', (e) => {
    if (isDrawing) {
        drawTouch(e);
        sendDrawEvent(e, 'touchmove');
    }
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
    ctx.beginPath();
    saveCanvasState();
    sendDrawEvent(null, 'touchend');
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
        sendSizeChangeEvent(currentSize);
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
        sendColorChangeEvent(currentColor);
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
        sendClearEvent();
    }
});

resetButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasState = [];
    saveCanvasToLocalStorage();
    sendResetEvent();
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
        sendResizeEvent(newWidth, newHeight);
    }
});

eraserButton.addEventListener('click', () => {
    isEraser = true;
    currentSize = 10;
    setCursor('url("eraser-icon.png"), auto'); // Change to an eraser cursor, use a custom eraser icon if available
    sendEraserEvent(currentSize);
});

penPencil.addEventListener('click', () => {
    isEraser = false;
    currentSize = 2;
    setCursor('url("pencil-icon.png"), auto'); // Change to a pencil cursor, use a custom pencil icon if available
    sendPenEvent(currentSize);
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

// WebSocket setup
function setupWebSocket() {
    socket = new WebSocket('wss://task-2-real-time-collaborative-backend.onrender.com');
    
    socket.addEventListener('open', () => {
        console.log('Connected to WebSocket');
    });
    
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
    });

    socket.addEventListener('close', () => {
        console.log('Disconnected from WebSocket');
    });
}

function sendDrawEvent(e, type) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    socket.send(JSON.stringify({
        type: 'draw',
        x,
        y,
        size: currentSize,
        color: isEraser ? 'white' : currentColor,
        isEraser,
        action: type
    }));
}

function sendDrawTouchEvent(e, type) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    socket.send(JSON.stringify({
        type: 'draw',
        x,
        y,
        size: currentSize,
        color: isEraser ? 'white' : currentColor,
        isEraser,
        action: type
    }));
}

function sendClearEvent() {
    socket.send(JSON.stringify({
        type: 'clear'
    }));
}

function sendResetEvent() {
    socket.send(JSON.stringify({
        type: 'reset'
    }));
}

function sendResizeEvent(width, height) {
    socket.send(JSON.stringify({
        type: 'resize',
        width,
        height
    }));
}

function sendSizeChangeEvent(size) {
    socket.send(JSON.stringify({
        type: 'sizeChange',
        size
    }));
}

function sendColorChangeEvent(color) {
    socket.send(JSON.stringify({
        type: 'colorChange',
        color
    }));
}

function sendEraserEvent(size) {
    socket.send(JSON.stringify({
        type: 'eraser',
        size
    }));
}

function sendPenEvent(size) {
    socket.send(JSON.stringify({
        type: 'pen',
        size
    }));
}

function handleSocketMessage(data) {
    switch (data.type) {
        case 'draw':
            handleDraw(data);
            break;
        case 'clear':
            handleClear();
            break;
        case 'reset':
            handleReset();
            break;
        case 'resize':
            handleResize(data);
            break;
        case 'sizeChange':
            handleSizeChange(data);
            break;
        case 'colorChange':
            handleColorChange(data);
            break;
        case 'eraser':
            handleEraser(data);
            break;
        case 'pen':
            handlePen(data);
            break;
    }
}

function handleDraw(data) {
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.strokeStyle = data.color;

    if (data.action === 'mousedown') {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    } else if (data.action === 'mousemove') {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
    } else if (data.action === 'mouseup') {
        ctx.beginPath();
    }
}

function handleClear() {
    if (canvasState.length > 0) {
        canvasState.pop();
        if (canvasState.length > 0) {
            restoreCanvasState();
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

function handleReset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasState = [];
    saveCanvasToLocalStorage();
}

function handleResize(data) {
    canvas.width = data.width;
    canvas.height = data.height;
    initializeCanvas();
    restoreCanvasState();
}

function handleSizeChange(data) {
    currentSize = data.size;
}

function handleColorChange(data) {
    currentColor = data.color;
    isEraser = false;
    setCursor('crosshair');
}

function handleEraser(data) {
    isEraser = true;
    currentSize = data.size;
    setCursor('url("eraser-icon.png"), auto');
}

function handlePen(data) {
    isEraser = false;
    currentSize = data.size;
    setCursor('url("pencil-icon.png"), auto');
}

// Initialize WebSocket connection
setupWebSocket();
