const Drawer = (function() {
    function drawArrow(ctx, x, y, dir) {
        const s = 5;
        ctx.beginPath();
        if (dir === 'left') {
            ctx.moveTo(x, y);
            ctx.lineTo(x + s, y - s);
            ctx.lineTo(x + s, y + s);
        } else if (dir === 'right') {
            ctx.moveTo(x, y);
            ctx.lineTo(x - s, y - s);
            ctx.lineTo(x - s, y + s);
        } else if (dir === 'up') {
            ctx.moveTo(x, y);
            ctx.lineTo(x - s, y + s);
            ctx.lineTo(x + s, y + s);
        } else if (dir === 'down') {
            ctx.moveTo(x, y);
            ctx.lineTo(x - s, y - s);
            ctx.lineTo(x + s, y - s);
        }
        ctx.closePath();
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
    }

    function drawDimension(ctx, x1, y1, x2, y2, text, offset, side) {
        ctx.save();
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1.2;

        const textWidth = ctx.measureText(text).width;

        if (side === 'top') {
            const y = Math.min(y1, y2) - offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            drawArrow(ctx, x1, y, 'left');
            drawArrow(ctx, x2, y, 'right');
            ctx.fillText(text, (x1 + x2) / 2 - textWidth / 2, y - 5);
        } else if (side === 'bottom') {
            const y = Math.max(y1, y2) + offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            drawArrow(ctx, x1, y, 'left');
            drawArrow(ctx, x2, y, 'right');
            ctx.fillText(text, (x1 + x2) / 2 - textWidth / 2, y + 16);
        } else if (side === 'left') {
            const x = Math.min(x1, x2) - offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x, y1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
            drawArrow(ctx, x, y1, 'up');
            drawArrow(ctx, x, y2, 'down');
            ctx.fillText(text, x - textWidth - 6, (y1 + y2) / 2 + 5);
        } else if (side === 'right') {
            const x = Math.max(x1, x2) + offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x, y1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
            drawArrow(ctx, x, y1, 'up');
            drawArrow(ctx, x, y2, 'down');
            ctx.fillText(text, x + 6, (y1 + y2) / 2 + 5);
        }

        ctx.restore();
    }

    function drawFrontView(canvas, params) {
        const ctx = canvas.getContext('2d');
        const { width, totalHeight, layers, layerThickness,
                topFold, bottomFold, leftFold, rightFold, layerHeights } = params;

        const outerW = width + leftFold + rightFold;
        const outerH = totalHeight + topFold + bottomFold;

        const dpr = window.devicePixelRatio || 1;
        const logicalW = canvas.width / dpr;
        const logicalH = canvas.height / dpr;

        const margin = 65;
        const availW = logicalW - margin * 2;
        const availH = logicalH - margin * 2;
        const scale = Math.min(availW / outerW, availH / outerH) * 0.88;

        const drawW = outerW * scale;
        const drawH = outerH * scale;
        const startX = (logicalW - drawW) / 2;
        const startY = (logicalH - drawH) / 2;

        ctx.clearRect(0, 0, logicalW, logicalH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, logicalW, logicalH);

        // 外框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(startX, startY, drawW, drawH);

        // 内框
        const innerX = startX + leftFold * scale;
        const innerY = startY + topFold * scale;
        const innerW = width * scale;
        const innerH = totalHeight * scale;
        ctx.lineWidth = 2;
        ctx.strokeRect(innerX, innerY, innerW, innerH);

        // 层板
        ctx.lineWidth = 1.5;
        let currentY = innerY;
        for (let i = 0; i < layers - 1; i++) {
            currentY += layerHeights[i] * scale;
            const shelfY = currentY - (layerThickness * scale) / 2;
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(innerX, shelfY, innerW, layerThickness * scale);
            ctx.strokeStyle = '#000000';
            ctx.strokeRect(innerX, shelfY, innerW, layerThickness * scale);
        }

        // 尺寸标注
        drawDimension(ctx, startX, startY, startX + drawW, startY, outerW.toString(), 42, 'top');
        drawDimension(ctx, innerX, innerY, innerX + innerW, innerY, width.toString(), 22, 'top');
        drawDimension(ctx, startX, startY, startX, startY + drawH, outerH.toString(), 46, 'left');
        drawDimension(ctx, innerX, innerY, innerX, innerY + innerH, totalHeight.toString(), 26, 'left');

        currentY = innerY;
        for (let i = 0; i < layers; i++) {
            const h = layerHeights[i];
            const nextY = currentY + h * scale;
            if (h * scale > 24) {
                drawDimension(ctx, innerX + innerW, currentY, innerX + innerW, nextY, h.toString(), 20, 'right');
            }
            currentY = nextY;
        }

        if (layers > 1) {
            const shelfCenterY = innerY + layerHeights[0] * scale;
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.fillText(layerThickness.toString(), innerX + innerW + 26, shelfCenterY + 5);
        }
    }

    function drawSideView(canvas, params) {
        const ctx = canvas.getContext('2d');
        const { depth, totalHeight, layers, layerThickness, extension,
                topFold, bottomFold, layerHeights } = params;

        // 侧面视图逻辑：
        // depth 参数已包含延伸，所以内框深度 = depth - extension
        const innerDepth = depth - extension;
        const outerH = totalHeight + topFold + bottomFold;

        const dpr = window.devicePixelRatio || 1;
        const logicalW = canvas.width / dpr;
        const logicalH = canvas.height / dpr;

        const margin = 65;
        const availW = logicalW - margin * 2;
        const availH = logicalH - margin * 2;
        const scale = Math.min(availW / depth, availH / outerH) * 0.88;

        const drawW = depth * scale;
        const drawH = outerH * scale;
        const startX = (logicalW - drawW) / 2;
        const startY = (logicalH - drawH) / 2;

        ctx.clearRect(0, 0, logicalW, logicalH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, logicalW, logicalH);

        // 内框矩形（宽 = innerDepth，高 = totalHeight）
        const innerW = innerDepth * scale;
        const innerH = totalHeight * scale;
        const innerX = startX;
        const innerY = startY + topFold * scale;

        // 层板（带厚度）
        let currentY = innerY;
        for (let i = 0; i < layers - 1; i++) {
            currentY += layerHeights[i] * scale;
            const shelfY = currentY - (layerThickness * scale) / 2;
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(innerX, shelfY, innerW, layerThickness * scale);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(innerX, shelfY, innerW, layerThickness * scale);
        }

        // 内框线
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(innerX, innerY, innerW, innerH);

        // 外框折边（右侧 5mm 延伸区）—— 用浅灰填充 + 黑边框，突出"翻边"效果
        const extW = extension * scale;
        const extX = innerX + innerW + extW;

        if (extension > 0) {
            ctx.fillStyle = '#d0d0d0';
            ctx.fillRect(innerX + innerW, startY, extW, drawH);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(innerX + innerW, startY, extW, drawH);
        }

        // 外框左侧线（高 = outerH，与内框左边缘重合但上下延伸）
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY + drawH);
        ctx.stroke();

        // 外框顶部线（从左到右 = depth）
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(extX, startY);
        ctx.stroke();

        // 外框底部线（从左到右 = depth）
        ctx.beginPath();
        ctx.moveTo(startX, startY + drawH);
        ctx.lineTo(extX, startY + drawH);
        ctx.stroke();

        // 延伸标注（顶部）
        if (extension * scale > 10) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.fillText(extension.toString(), innerX + innerW + extW / 2 - 5, startY + 20);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(innerX + innerW, startY + 6);
            ctx.lineTo(innerX + innerW, startY + 32);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(extX, startY + 6);
            ctx.lineTo(extX, startY + 32);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(innerX + innerW, startY + 19);
            ctx.lineTo(extX, startY + 19);
            ctx.stroke();
        }

        // 尺寸标注
        // 外高（左侧，从外框顶部到外框底部）
        drawDimension(ctx, startX, startY, startX, startY + drawH, outerH.toString(), 42, 'left');
        // 内高（右侧，以内框右边缘为基准）
        drawDimension(ctx, innerX + innerW, innerY, innerX + innerW, innerY + innerH, totalHeight.toString(), 22, 'right');
        // 深度（中间横向，从内框左边缘到内框右边缘 = innerDepth）
        const midY = innerY + innerH / 2;
        drawDimension(ctx, innerX, midY, innerX + innerW, midY, innerDepth.toString(), 24, 'bottom');
    }

    function drawCombinedView(canvas, frontCanvas, sideCanvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const logicalW = canvas.width / dpr;
        const logicalH = canvas.height / dpr;

        ctx.clearRect(0, 0, logicalW, logicalH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, logicalW, logicalH);

        const gap = 24;
        const leftAreaW = (logicalW - gap) / 2;
        const rightAreaW = (logicalW - gap) / 2;
        const areaH = logicalH;

        const fW = frontCanvas.width / dpr;
        const fH = frontCanvas.height / dpr;
        const sW = sideCanvas.width / dpr;
        const sH = sideCanvas.height / dpr;

        const fScale = Math.min(leftAreaW / fW, areaH / fH) * 0.95;
        const sScale = Math.min(rightAreaW / sW, areaH / sH) * 0.95;

        const fTargetW = fW * fScale;
        const fTargetH = fH * fScale;
        const sTargetW = sW * sScale;
        const sTargetH = sH * sScale;

        const fX = (leftAreaW - fTargetW) / 2;
        const fY = (areaH - fTargetH) / 2;
        const sX = leftAreaW + gap + (rightAreaW - sTargetW) / 2;
        const sY = (areaH - sTargetH) / 2;

        ctx.drawImage(frontCanvas, 0, 0, frontCanvas.width, frontCanvas.height, fX, fY, fTargetW, fTargetH);
        ctx.drawImage(sideCanvas, 0, 0, sideCanvas.width, sideCanvas.height, sX, sY, sTargetW, sTargetH);

        // 中间虚线
        const midX = leftAreaW + gap / 2;
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX, 20);
        ctx.lineTo(midX, logicalH - 20);
        ctx.stroke();
        ctx.restore();
    }

    return {
        drawFrontView,
        drawSideView,
        drawCombinedView
    };
})();
