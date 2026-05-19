const ThreeViewer = (function() {
    let scene, camera, renderer;
    let meshGroup;

    function setupControls(container, camera) {
        let isDragging = false;
        let previousPosition = { x: 0, y: 0 };
        let spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);

        let pinchStartDistance = 0;
        let pinchStartRadius = 0;

        function onStart(x, y) {
            isDragging = true;
            previousPosition = { x, y };
            spherical.setFromVector3(camera.position);
        }

        function onMove(x, y) {
            if (!isDragging) return;
            const deltaX = x - previousPosition.x;
            const deltaY = y - previousPosition.y;

            spherical.theta -= deltaX * 0.005;
            spherical.phi += deltaY * 0.005;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);

            previousPosition = { x, y };
        }

        function onEnd() {
            isDragging = false;
        }

        function onWheel(e) {
            spherical.setFromVector3(camera.position);
            const delta = e.deltaY * 0.5;
            spherical.radius = Math.max(50, Math.min(3000, spherical.radius + delta));
            camera.position.setFromSpherical(spherical);
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
                pinchStartRadius = spherical.radius;
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
                    const scale = pinchStartDistance / dist;
                    spherical.radius = Math.max(50, Math.min(3000, pinchStartRadius * scale));
                    camera.position.setFromSpherical(spherical);
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
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight1.position.set(200, 400, 300);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-200, 200, -200);
        scene.add(dirLight2);

        // 初始相机位置
        const { width: pw, totalHeight, depth, topFold, bottomFold, leftFold, rightFold } = params;
        const outerW = pw + leftFold + rightFold;
        const outerH = totalHeight + topFold + bottomFold;
        const outerD = depth + 5;
        const maxDim = Math.max(outerW, outerH, outerD);
        const distance = maxDim * 1.4;
        camera.position.set(distance * 0.7, distance * 1.0, distance * 0.8);
        camera.lookAt(0, 0, 0);

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

        const { width, totalHeight, depth, layers, layerThickness,
                topFold, bottomFold, leftFold, rightFold, layerHeights } = params;

        const outerW = width + leftFold + rightFold;
        const outerH = totalHeight + topFold + bottomFold;
        const outerD = depth + 5;

        const xOffset = (rightFold - leftFold) / 2;
        const yOffset = (bottomFold - topFold) / 2;

        const material = new THREE.MeshPhongMaterial({
            color: 0x2c2c2c,
            shininess: 40,
            side: THREE.DoubleSide
        });

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 1 });
        const redLineMaterial = new THREE.LineBasicMaterial({ color: 0xe74c3c, linewidth: 1 });

        // 外框线框
        const outerGeo = new THREE.BoxGeometry(outerW, outerH, outerD);
        const outerEdges = new THREE.EdgesGeometry(outerGeo);
        const outerLine = new THREE.LineSegments(outerEdges, lineMaterial);
        outerLine.position.set(0, 0, -2.5);
        meshGroup.add(outerLine);

        // 外框半透明面
        const outerFaceMat = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.12,
            side: THREE.BackSide,
            depthWrite: false
        });
        const outerMesh = new THREE.Mesh(outerGeo, outerFaceMat);
        outerMesh.position.set(0, 0, -2.5);
        meshGroup.add(outerMesh);

        // 内框线框
        const innerGeo = new THREE.BoxGeometry(width, totalHeight, depth);
        const innerEdges = new THREE.EdgesGeometry(innerGeo);
        const innerLine = new THREE.LineSegments(innerEdges, redLineMaterial);
        innerLine.position.set(xOffset, yOffset, 0);
        meshGroup.add(innerLine);

        // 层板
        let currentY = yOffset - totalHeight / 2;
        for (let i = 0; i < layers - 1; i++) {
            currentY += layerHeights[i];
            const shelfGeo = new THREE.BoxGeometry(width, layerThickness, depth);
            const shelfMesh = new THREE.Mesh(shelfGeo, material);
            shelfMesh.position.set(xOffset, currentY, 0);
            meshGroup.add(shelfMesh);

            const shelfEdges = new THREE.EdgesGeometry(shelfGeo);
            const shelfLine = new THREE.LineSegments(shelfEdges, lineMaterial);
            shelfLine.position.set(xOffset, currentY, 0);
            meshGroup.add(shelfLine);
        }

        // 网格地面
        const gridHelper = new THREE.GridHelper(Math.max(outerW, outerD) * 2, 20, 0xcccccc, 0xe5e5e5);
        gridHelper.position.y = -outerH / 2 - 20;
        meshGroup.add(gridHelper);

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
