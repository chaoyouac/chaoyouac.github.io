const ThreeViewer = (function() {
    let scene, camera, renderer;
    let meshGroup;

    function setupControls(container, camera) {
        let isDragging = false;
        let previousPosition = { x: 0, y: 0 };
        let pinchStartDistance = 0;

        function onStart(x, y) {
            isDragging = true;
            previousPosition = { x, y };
        }

        function onMove(x, y) {
            if (!isDragging || !meshGroup) return;
            const deltaX = x - previousPosition.x;
            const deltaY = y - previousPosition.y;

            // 滚筒式/车轮式旋转：绕 Y 轴和 X 轴
            meshGroup.rotation.y += deltaX * 0.01;
            meshGroup.rotation.x += deltaY * 0.01;

            meshGroup.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, meshGroup.rotation.x));

            previousPosition = { x, y };
        }

        function onEnd() {
            isDragging = false;
        }

        function onWheel(e) {
            const delta = e.deltaY * 0.8;
            camera.position.z += delta;
            camera.position.z = Math.max(100, Math.min(3000, camera.position.z));
        }

        container.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
        container.addEventListener('mousemove', e => {
            if (e.buttons === 1) onMove(e.clientX, e.clientY);
        });
        container.addEventListener('mouseup', onEnd);
        container.addEventListener('mouseleave', onEnd);

        container.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                onStart(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: false });

        container.addEventListener('touchmove', e => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (pinchStartDistance > 0) {
                    const scale = dist / pinchStartDistance;
                    const targetZ = camera.position.z / scale;
                    camera.position.z = Math.max(100, Math.min(3000, targetZ));
                    pinchStartDistance = dist;
                }
            }
        }, { passive: false });

        container.addEventListener('touchend', onEnd);
        container.addEventListener('wheel', e => { e.preventDefault(); onWheel(e); }, { passive: false });
    }

    function init(container, params) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // 灯光
        const ambient = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambient);
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight1.position.set(300, 500, 400);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-300, 200, -200);
        scene.add(dirLight2);

        // 相机固定位置
        const { width: pw, totalHeight, depth, topFold, bottomFold, leftFold, rightFold, extension } = params;
        const outerW = pw + leftFold + rightFold;
        const outerH = totalHeight + topFold + bottomFold;
        // depth 已包含延伸
        const maxDim = Math.max(outerW, outerH, depth);
        const distance = maxDim * 1.6;
        camera.position.set(distance * 0.6, distance * 0.5, distance);
        camera.lookAt(0, 0, outerD / 2);

        setupControls(container, camera);

        generateModel(params);

        function animate() {
            requestAnimationFrame(animate);
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
        animate();

        window.addEventListener('resize', () => onResize(container));
    }

    function generateModel(params) {
        if (meshGroup) {
            scene.remove(meshGroup);
        }
        meshGroup = new THREE.Group();

        const { width, totalHeight, depth, layers, layerThickness, extension,
                topFold, bottomFold, leftFold, rightFold, layerHeights } = params;

        // depth 参数已包含延伸，所以内框主体深度 = depth - extension
        const bodyDepth = depth - extension;

        const material = new THREE.MeshPhongMaterial({
            color: 0x2c2c2c,
            shininess: 50,
            side: THREE.DoubleSide
        });

        // 辅助函数：只创建实体板件，不添加线框
        function addPanel(w, h, d, x, y, z) {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(x, y, z);
            meshGroup.add(mesh);
        }

        // 1. 折边（正面四周，向后延伸 extension）
        const extHalf = extension / 2;
        const outerH = totalHeight + topFold + bottomFold;
        const foldYOffset = (bottomFold - topFold) / 2;

        if (topFold > 0 && extension > 0) {
            addPanel(width + leftFold + rightFold, topFold, extension,
                (rightFold - leftFold) / 2,
                totalHeight / 2 + topFold / 2,
                extHalf);
        }
        if (bottomFold > 0 && extension > 0) {
            addPanel(width + leftFold + rightFold, bottomFold, extension,
                (rightFold - leftFold) / 2,
                -totalHeight / 2 - bottomFold / 2,
                extHalf);
        }
        if (leftFold > 0 && extension > 0) {
            addPanel(leftFold, outerH, extension,
                -width / 2 - leftFold / 2,
                foldYOffset,
                extHalf);
        }
        if (rightFold > 0 && extension > 0) {
            addPanel(rightFold, outerH, extension,
                width / 2 + rightFold / 2,
                foldYOffset,
                extHalf);
        }

        // 2. 主体五面板（背、顶、底、左、右），正面开口
        const bodyStartZ = extension + bodyDepth / 2;

        // 背板
        addPanel(width, totalHeight, layerThickness,
            0, 0, extension + bodyDepth - layerThickness / 2);

        // 顶板
        addPanel(width, layerThickness, bodyDepth,
            0, totalHeight / 2 - layerThickness / 2, bodyStartZ);

        // 底板
        addPanel(width, layerThickness, bodyDepth,
            0, -totalHeight / 2 + layerThickness / 2, bodyStartZ);

        // 左侧板
        addPanel(layerThickness, totalHeight, bodyDepth,
            -width / 2 + layerThickness / 2, 0, bodyStartZ);

        // 右侧板
        addPanel(layerThickness, totalHeight, bodyDepth,
            width / 2 - layerThickness / 2, 0, bodyStartZ);

        // 3. 层板
        let currentY = -totalHeight / 2;
        for (let i = 0; i < layers - 1; i++) {
            currentY += layerHeights[i];
            addPanel(width, layerThickness, bodyDepth,
                0, currentY, bodyStartZ);
        }

        scene.add(meshGroup);
    }

    function onResize(container) {
        if (!camera || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    return {
        init,
        generateModel,
        onResize
    };
})();
