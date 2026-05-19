const Drawer = (function() {
    function drawArrow(ctx, x, y, dir) {
        const s = 3;
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
        ctx.font = '11px Arial, sans-serif';
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 0.8;

        const textWidth = ctx.measureText(text).width;

        if (side === 'top') {
            const y = Math.min(y1, y2) - offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            drawArrow(ctx, x1, y, 'left');
            drawArrow(ctx, x2, y, 'right');
            ctx.fillText(text, (x1 + x2) / 2 - textWidth / 2, y - 3);
        } else if (side === 'bottom') {
            const y = Math.max(y1, y2) + offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            drawArrow(ctx, x1, y, 'left');
            drawArrow(ctx, x2, y, 'right');
            ctx.fillText(text, (x1 + x2) / 2 - textWidth / 2, y + 11);
        } else if (side === 'left') {
            const x = Math.min(x1, x2) - offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x, y1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
            drawArrow(ctx, x, y1, 'up');
            drawArrow(ctx, x, y2, 'down');
            ctx.fillText(text, x - textWidth - 4, (y1 + y2) / 2 + 4);
        } else if (side === 'right') {
            const x = Math.max(x1, x2) + offset;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x, y1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
            drawArrow(ctx, x, y1, 'up');
            drawArrow(ctx, x, y2, 'down');
            ctx.fillText(text, x + 4, (y1 + y2) / 2 + 4);
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

        const margin = 55;
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
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, drawW, drawH);

        // 内框
        const innerX = startX + leftFold * scale;
        const innerY = startY + topFold * scale;
        const innerW = width * scale;
        const innerH = totalHeight * scale;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(innerX, innerY, innerW, innerH);

        // 层板
        ctx.lineWidth = 1;
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
        // 外宽
        drawDimension(ctx, startX, startY, startX + drawW, startY, outerW.toString(), 30, 'top');
        // 内宽
        drawDimension(ctx, innerX, innerY, innerX + innerW, innerY, width.toString(), 16, 'top');
        // 外高（左侧）
        drawDimension(ctx, startX, startY, startX, startY + drawH, outerH.toString(), 36, 'left');
        // 内高（左侧）
        drawDimension(ctx, innerX, innerY, innerX, innerY + innerH, totalHeight.toString(), 20, 'left');

        // 每层高度（右侧）
        currentY = innerY;
        for (let i = 0; i < layers; i++) {
            const h = layerHeights[i];
            const nextY = currentY + h * scale;
            if (h * scale > 18) {
                drawDimension(ctx, innerX + innerW, currentY, innerX + innerW, nextY, h.toString(), 14, 'right');
            }
            currentY = nextY;
        }

        // 层板厚度标注（第一个层板）
        if (layers > 1) {
            const shelfCenterY = innerY + layerHeights[0] * scale;
            ctx.fillStyle = '#e74c3c';
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText(layerThickness.toString(), innerX + innerW + 20, shelfCenterY + 4);
        }
    }

    function drawSideView(canvas, params) {
        const ctx = canvas.getContext('2d');
        const { depth, totalHeight, layers, layerThickness,
                topFold, bottomFold, layerHeights } = params;

        const outerW = depth + 5;
        const outerH = totalHeight + topFold + bottomFold;

        const dpr = window.devicePixelRatio || 1;
        const logicalW = canvas.width / dpr;
        const logicalH = canvas.height / dpr;

        const margin = 55;
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
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, drawW, drawH);

        // 内框（深度方向前面与外侧对齐，后面少5mm）
        const innerX = startX;
        const innerY = startY + topFold * scale;
        const innerW = depth * scale;
        const innerH = totalHeight * scale;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(innerX, innerY, innerW, innerH);

        // 层板（水平线）
        ctx.lineWidth = 1;
        let currentY = innerY;
        for (let i = 0; i < layers - 1; i++) {
            currentY += layerHeights[i] * scale;
            ctx.beginPath();
            ctx.moveTo(innerX, currentY);
            ctx.lineTo(innerX + innerW, currentY);
            ctx.stroke();
        }

        // 5mm延伸标注
        if (5 * scale > 6) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText('5', startX + innerW + (5 * scale) / 2 - 3, startY + 14);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(startX + innerW, startY + 4);
            ctx.lineTo(startX + innerW, startY + 22);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(startX + drawW, startY + 4);
            ctx.lineTo(startX + drawW, startY + 22);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(startX + innerW, startY + 13);
            ctx.lineTo(startX + drawW, startY + 13);
            ctx.stroke();
        }

        // 尺寸标注
        // 外高（左侧）
        drawDimension(ctx, startX, startY, startX, startY + drawH, outerH.toString(), 30, 'left');
        // 内高（右侧）
        drawDimension(ctx, innerX + innerW, innerY, innerX + innerW, innerY + innerH, totalHeight.toString(), 16, 'right');
        // 深度（中间横向）
        const midY = innerY + innerH / 2;
        drawDimension(ctx, innerX, midY, innerX + innerW, midY, depth.toString(), 18, 'bottom');
    }

    return {
        drawFrontView,
        drawSideView
    };
})();
