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

        // 侧面视图：外框高 = 总高度 + 上折边 + 下折边，宽 = 深度 + 延伸
        const outerW = depth + extension;
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

        // 外框矩形
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(startX, startY, drawW, drawH);

        // 内框矩形（深度 × 总高度），与外框左侧对齐，顶部/底部缩进折边
        const innerW = depth * scale;
        const innerH = totalHeight * scale;
        const innerX = startX;
        const innerY = startY + topFold * scale;

        ctx.lineWidth = 2;
        ctx.strokeRect(innerX, innerY, innerW, innerH);

        // 层板（带厚度）
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

        const extX = innerX + innerW + extension * scale;

        // 外框延伸线（右侧，只画线条，不画完整矩形）
        if (extension > 0) {
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#000000';

            // 右侧竖线（外框延伸）
            ctx.beginPath();
            ctx.moveTo(extX, startY);
            ctx.lineTo(extX, startY + drawH);
            ctx.stroke();

            // 顶部横线连接
            ctx.beginPath();
            ctx.moveTo(innerX + innerW, startY);
            ctx.lineTo(extX, startY);
            ctx.stroke();

            // 底部横线连接
            ctx.beginPath();
            ctx.moveTo(innerX + innerW, startY + drawH);
            ctx.lineTo(extX, startY + drawH);
            ctx.stroke();

            // extension 标注
            if (extension * scale > 10) {
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 16px Arial, sans-serif';
                ctx.fillText(extension.toString(), innerX + innerW + (extension * scale) / 2 - 5, startY + 20);
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
        }

        // 尺寸标注
        // 内高（左侧）
        drawDimension(ctx, innerX, innerY, innerX, innerY + innerH, totalHeight.toString(), 42, 'left');
        // 外高（右侧，以外框右边缘为基准）
        const outerRightX = (extension > 0) ? extX : (innerX + innerW);
        drawDimension(ctx, outerRightX, startY, outerRightX, startY + drawH, outerH.toString(), 22, 'right');
        // 深度（中间横向）
        const midY = innerY + innerH / 2;
        drawDimension(ctx, innerX, midY, innerX + innerW, midY, depth.toString(), 24, 'bottom');
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
