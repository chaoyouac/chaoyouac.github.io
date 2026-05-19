document.addEventListener('DOMContentLoaded', function() {
    const els = {
        totalHeight: document.getElementById('totalHeight'),
        width: document.getElementById('width'),
        depth: document.getElementById('depth'),
        layers: document.getElementById('layers'),
        layerThickness: document.getElementById('layerThickness'),
        extension: document.getElementById('extension'),
        foldMode: document.getElementById('foldMode'),
        foldUniform: document.getElementById('foldUniform'),
        foldTop: document.getElementById('foldTop'),
        foldBottom: document.getElementById('foldBottom'),
        foldLeft: document.getElementById('foldLeft'),
        foldRight: document.getElementById('foldRight'),
        layerInputs: document.getElementById('layerInputs'),
        generateBtn: document.getElementById('generateBtn'),
        exportBtn: document.getElementById('exportBtn'),
        frontView: document.getElementById('frontView'),
        sideView: document.getElementById('sideView'),
        combinedView: document.getElementById('combinedView'),
        qrcode: document.getElementById('qrcode'),
        threeContainer: document.getElementById('three-container')
    };

    // 折边模式切换
    els.foldMode.addEventListener('change', function() {
        const isUniform = this.value === 'uniform';
        document.querySelectorAll('.fold-uniform').forEach(el => el.classList.toggle('hidden', !isUniform));
        document.querySelectorAll('.fold-separate').forEach(el => el.classList.toggle('hidden', isUniform));
    });

    // 动态更新每层高度输入框
    function updateLayerInputs() {
        const layers = parseInt(els.layers.value) || 1;
        const totalHeight = parseInt(els.totalHeight.value) || 880;
        const currentInputs = els.layerInputs.querySelectorAll('input');
        const currentValues = Array.from(currentInputs).map(i => parseInt(i.value));

        const avg = Math.floor(totalHeight / layers);
        const defaultHeights = Array(layers).fill(avg);
        const sum = avg * layers;
        defaultHeights[layers - 1] += totalHeight - sum;

        let html = '';
        for (let i = 0; i < layers; i++) {
            const val = (currentValues[i] !== undefined && !isNaN(currentValues[i])) ? currentValues[i] : defaultHeights[i];
            html += `<div class="layer-input-group">
                <label>第${i+1}层高度 (mm)</label>
                <input type="number" class="layer-height-input" data-index="${i}" value="${val}" min="1">
            </div>`;
        }
        els.layerInputs.innerHTML = html;
    }

    els.layers.addEventListener('input', updateLayerInputs);
    els.totalHeight.addEventListener('input', updateLayerInputs);
    els.layerThickness.addEventListener('input', updateLayerInputs);

    function getParams() {
        const layers = parseInt(els.layers.value) || 1;
        const totalHeight = parseInt(els.totalHeight.value) || 880;
        const layerInputs = els.layerInputs.querySelectorAll('.layer-height-input');
        let layerHeights = Array.from(layerInputs).map(i => parseInt(i.value) || 1);

        let topFold, bottomFold, leftFold, rightFold;
        if (els.foldMode.value === 'uniform') {
            const f = parseInt(els.foldUniform.value) || 0;
            topFold = bottomFold = leftFold = rightFold = f;
        } else {
            topFold = parseInt(els.foldTop.value) || 0;
            bottomFold = parseInt(els.foldBottom.value) || 0;
            leftFold = parseInt(els.foldLeft.value) || 0;
            rightFold = parseInt(els.foldRight.value) || 0;
        }

        return {
            width: parseInt(els.width.value) || 260,
            depth: parseInt(els.depth.value) || 250,
            layers: layers,
            layerThickness: parseInt(els.layerThickness.value) || 10,
            extension: parseInt(els.extension.value) || 5,
            totalHeight: totalHeight,
            topFold: topFold,
            bottomFold: bottomFold,
            leftFold: leftFold,
            rightFold: rightFold,
            layerHeights: layerHeights
        };
    }

    function initCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        const parentW = els.combinedView.parentElement.clientWidth;

        // 隐藏画布尺寸（离屏绘制用，稍大些保证清晰度）
        const offW = 480;
        const offH = Math.round(offW * 1.6);

        els.frontView.style.width = offW + 'px';
        els.frontView.style.height = offH + 'px';
        els.sideView.style.width = offW + 'px';
        els.sideView.style.height = offH + 'px';

        els.frontView.width = offW * dpr;
        els.frontView.height = offH * dpr;
        els.sideView.width = offW * dpr;
        els.sideView.height = offH * dpr;

        const fctx = els.frontView.getContext('2d');
        fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const sctx = els.sideView.getContext('2d');
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 合成画布尺寸
        const combinedH = Math.round(parentW * 0.75);
        els.combinedView.style.width = parentW + 'px';
        els.combinedView.style.height = combinedH + 'px';
        els.combinedView.width = parentW * dpr;
        els.combinedView.height = combinedH * dpr;
        const cctx = els.combinedView.getContext('2d');
        cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function generate() {
        initCanvasSize();
        const params = getParams();

        Drawer.drawFrontView(els.frontView, params);
        Drawer.drawSideView(els.sideView, params);
        Drawer.drawCombinedView(els.combinedView, els.frontView, els.sideView);

        if (!window.threeInited) {
            ThreeViewer.init(els.threeContainer, params);
            window.threeInited = true;
        } else {
            ThreeViewer.generateModel(params);
        }

        updateQRCode(params);
    }

    function updateQRCode(params) {
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            els.qrcode.innerHTML = '<p style="color:red;font-size:12px">二维码库加载失败</p>';
            return;
        }

        const p = new URLSearchParams();
        p.set('h', params.totalHeight);
        p.set('w', params.width);
        p.set('d', params.depth);
        p.set('l', params.layers);
        p.set('t', params.layerThickness);
        p.set('ext', params.extension);
        p.set('ft', params.topFold);
        p.set('fb', params.bottomFold);
        p.set('fl', params.leftFold);
        p.set('fr', params.rightFold);
        p.set('lh', params.layerHeights.join(','));

        const url = `https://chaoyouac.github.io/壁龛定制/viewer.html?${p.toString()}`;

        els.qrcode.innerHTML = '';
        new QRCode(els.qrcode, {
            text: url,
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    function exportViews() {
        const params = getParams();
        const dpr = window.devicePixelRatio || 1;
        const src = els.combinedView;
        const srcW = src.width / dpr;
        const srcH = src.height / dpr;

        const padding = 30;
        const titleH = 44;
        const infoH = 100;
        const canvasW = srcW + padding * 2;
        const canvasH = srcH + padding * 2 + titleH + infoH;

        const composite = document.createElement('canvas');
        composite.width = Math.round(canvasW * dpr);
        composite.height = Math.round(canvasH * dpr);
        const ctx = composite.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 白底
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 标题
        ctx.fillStyle = '#222222';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('壁龛定制工程图', canvasW / 2, 32);

        // 合成视图
        ctx.drawImage(src, 0, 0, src.width, src.height, padding, titleH, srcW, srcH);

        // 参数信息
        const outerW = params.width + params.leftFold + params.rightFold;
        const outerH = params.totalHeight + params.topFold + params.bottomFold;
        const infoY = titleH + srcH + 18;

        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`外径: ${outerW} x ${outerH} mm`, padding, infoY);
        ctx.fillText(`内径: ${params.width} x ${params.totalHeight} mm`, padding, infoY + 22);
        ctx.fillText(`深度: ${params.depth} mm`, padding, infoY + 44);
        ctx.fillText(`层数: ${params.layers} 层`, padding + 260, infoY);
        ctx.fillText(`层板厚度: ${params.layerThickness} mm`, padding + 260, infoY + 22);
        ctx.fillText(`外框延伸: ${params.extension} mm`, padding + 260, infoY + 44);

        // 下载
        const link = document.createElement('a');
        link.download = `壁龛定制_${outerW}x${outerH}x${params.depth}.png`;
        link.href = composite.toDataURL('image/png');
        link.click();
    }

    els.generateBtn.addEventListener('click', generate);
    els.exportBtn.addEventListener('click', exportViews);

    // 初始化层高度输入并首次生成
    updateLayerInputs();
    setTimeout(generate, 100);
});
