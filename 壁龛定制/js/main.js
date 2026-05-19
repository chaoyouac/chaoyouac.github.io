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

    els.foldMode.addEventListener('change', function() {
        const isUniform = this.value === 'uniform';
        document.querySelectorAll('.fold-uniform').forEach(el => el.classList.toggle('hidden', !isUniform));
        document.querySelectorAll('.fold-separate').forEach(el => el.classList.toggle('hidden', isUniform));
    });

    function updateLayerInputs() {
        const layers = parseInt(els.layers.value) || 1;
        const totalHeight = parseInt(els.totalHeight.value) || 880;
        const thickness = parseInt(els.layerThickness.value) || 10;

        const remaining = totalHeight - thickness * (layers - 1);
        const avg = Math.floor(remaining / layers);
        let heights = Array(layers).fill(avg);
        const sum = avg * layers;
        heights[layers - 1] += remaining - sum;

        let html = '';
        for (let i = 0; i < layers; i++) {
            html += `<div class="layer-input-group">
                <label>第${i+1}层高度 (mm)</label>
                <input type="number" class="layer-height-input" data-index="${i}" value="${heights[i]}" min="1">
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
            els.qrcode.innerHTML = '<p style="color:red;font-size:13px">二维码库未加载，请检查 js/qrcode.min.js 是否存在</p>';
            return;
        }

        const p = new URLSearchParams();
        p.set('h', params.totalHeight);
        p.set('w', params.width);
        p.set('d', params.depth);
        p.set('l', params.layers);
        p.set('t', params.layerThickness);
        p.set('e', params.extension);
        p.set('ft', params.topFold);
        p.set('fb', params.bottomFold);
        p.set('fl', params.leftFold);
        p.set('fr', params.rightFold);

        const url = `https://chaoyouac.github.io/壁龛定制/viewer.html?${p.toString()}`;
        console.log('QR URL:', url, 'Length:', url.length);

        els.qrcode.innerHTML = '';
        try {
            new QRCode(els.qrcode, {
                text: url,
                width: 128,
                height: 128,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
            console.log('QRCode generated OK');
        } catch (e) {
            console.error('QRCode generation failed:', e);
            els.qrcode.innerHTML = '<p style="color:#e74c3c;font-size:13px">二维码生成失败，请刷新重试</p>';
        }
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

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.fillStyle = '#222222';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('壁龛定制工程图', canvasW / 2, 32);

        ctx.drawImage(src, 0, 0, src.width, src.height, padding, titleH, srcW, srcH);

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

        const link = document.createElement('a');
        link.download = `壁龛定制_${outerW}x${outerH}x${params.depth}.png`;
        link.href = composite.toDataURL('image/png');
        link.click();
    }

    els.generateBtn.addEventListener('click', generate);
    els.exportBtn.addEventListener('click', exportViews);

    updateLayerInputs();
    setTimeout(generate, 100);
});
