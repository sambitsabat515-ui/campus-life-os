import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Compass,
  Navigation,
  Eye,
  Box,
  MapPin as PinIcon,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  Layers,
  Play,
  RotateCcw,
  Camera,
  Maximize2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

// BPUT Campus Landmark Coordinates (matching the 3D GLB coordinate system)
export const CAMPUS_LANDMARKS = {
  gate: { id: 'gate', n: 'Main Campus Gate', x: 30, y: 35, desc: 'Security Checkpoint & Gate Pass Scanner' },
  admin: { id: 'admin', n: 'Administrative Block', x: 296, y: 447, desc: 'Dean, Bonafide & Certificate Counter #2' },
  acad: { id: 'acad', n: 'Academic Block (CSE/ECE)', x: 293, y: 372, desc: 'Lecture Halls LH-101 to LH-106 & Computing Labs' },
  exam: { id: 'exam', n: 'Auditorium & Exam Hall', x: 350, y: 374, desc: 'Convocation & Examination Complex' },
  lib: { id: 'lib', n: 'Central Library', x: 469, y: 374, desc: 'Digital Library & Reading Rooms' },
  mess: { id: 'mess', n: 'Central Mess Hall', x: 540, y: 355, desc: 'Daily Meal Dining & Catering Facility' },
  hA: { id: 'hA', n: 'Aryabhatta Boys Hostel (A)', x: 757, y: 275, desc: 'Boys Residence Block A' },
  hB: { id: 'hB', n: 'Aryabhatta Boys Hostel (B)', x: 681, y: 357, desc: 'Boys Residence Block B' },
  hC: { id: 'hC', n: 'Gargi Girls Hostel', x: 1030, y: 554, desc: 'Girls Residence Block G' },
  sports: { id: 'sports', n: 'Sports Ground', x: 106, y: 204, desc: 'Athletic Track, Cricket & Football Grounds' }
};

const ZS = 2;
const GZ = 210 * ZS; // Ground Z elevation in model space = 420
const P3 = (x, y, dz = 0) => new THREE.Vector3(x, y, GZ + dz);

export default function CampusMapViewer({ mode = "quest", isAdmin = false }) {
  const { lowBandwidthMode } = useApp();
  const containerRef = useRef(null);
  const labelsContainerRef = useRef(null);

  // Modes: 'quest' | 'xray' | 'hologram' | 'webar'
  const [activeTabMode, setActiveTabMode] = useState(mode);
  const [selectedDestinationKey, setSelectedDestinationKey] = useState("admin");
  const [followCamera, setFollowCamera] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [mapPins, setMapPins] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  // Three.js instances ref
  const engineRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    dynamicGroup: null,
    labels: [],
    pulseBeacons: [],
    walkerMarker: null,
    routeLine: null,
    routePoints: [],
    routeLength: 0,
    walkState: null,
    hologramActive: false,
    azimuth: 0,
    animFrameId: null
  });

  // Step-by-step instructions for active quest
  const currentDest = CAMPUS_LANDMARKS[selectedDestinationKey] || CAMPUS_LANDMARKS.admin;
  const questSteps = [
    `Start from ${CAMPUS_LANDMARKS.gate.n} checkpoint`,
    `Proceed eastward along Central Campus Boulevard past Central Green`,
    `Navigate along avenue towards ${currentDest.n}`,
    `Arrive at ${currentDest.n} entrance (${currentDest.desc})`
  ];

  // Fetch live ticket beacons for X-Ray mode
  const refreshBeacons = useCallback(() => {
    api.getCurrentMap().then(data => {
      setMapPins(data.pins || []);
      if (data.pins?.length > 0 && !selectedBuilding) {
        setSelectedBuilding(data.pins[0]);
      }
    }).catch(err => {
      console.warn("Could not load backend map pins:", err);
    });
  }, [selectedBuilding]);

  useEffect(() => {
    refreshBeacons();
  }, [refreshBeacons]);

  // Set up Quest Route
  const setupRoute = useCallback((destKey) => {
    const engine = engineRef.current;
    if (!engine.scene || !engine.dynamicGroup) return;

    // Remove old route & marker
    if (engine.routeLine) engine.dynamicGroup.remove(engine.routeLine);
    if (engine.walkerMarker) engine.dynamicGroup.remove(engine.walkerMarker);

    const start = CAMPUS_LANDMARKS.gate;
    const dest = CAMPUS_LANDMARKS[destKey] || CAMPUS_LANDMARKS.admin;

    // Realistic waypoints along campus road grid
    const pts = [
      P3(start.x, start.y, 6),
      P3(28, 320, 6),
      P3(dest.x, 320, 6),
      P3(dest.x, dest.y, 6)
    ];

    engine.routePoints = pts;
    let totalLen = 0;
    for (let i = 1; i < pts.length; i++) {
      totalLen += pts[i].distanceTo(pts[i - 1]);
    }
    engine.routeLength = totalLen;

    // Glowing Theme Route Line (#8B2072 / #C026D3)
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
    const curvePoints = curve.getPoints(80);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x8B2072, // Our Theme Primary Purple
      dashSize: 12,
      gapSize: 6,
      linewidth: 4
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    engine.routeLine = line;
    engine.dynamicGroup.add(line);

    // Walker Avatar Marker in Theme Magenta (#A23985)
    const markerGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(9, 20, 20);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x8B2072,
      emissive: 0x501040,
      roughness: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    markerGroup.add(sphere);

    // Glowing pulsating ring below avatar
    const ringGeo = new THREE.RingGeometry(10, 16, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xD85A9E,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -6;
    markerGroup.add(ring);

    markerGroup.position.copy(pts[0]);
    engine.walkerMarker = markerGroup;
    engine.dynamicGroup.add(markerGroup);

    setProgress(0);
    setIsWalking(false);
    engine.walkState = null;
  }, []);

  // Helper to interpolate along waypoints
  const getPointAt = (t) => {
    const engine = engineRef.current;
    const pts = engine.routePoints;
    if (!pts || pts.length === 0) return P3(0, 0, 0);
    let targetDist = t * engine.routeLength;
    for (let i = 1; i < pts.length; i++) {
      const segLen = pts[i].distanceTo(pts[i - 1]);
      if (targetDist <= segLen) {
        return pts[i - 1].clone().lerp(pts[i], targetDist / segLen);
      }
      targetDist -= segLen;
    }
    return pts[pts.length - 1].clone();
  };

  // Start walking animation
  const handleStartWalk = () => {
    const engine = engineRef.current;
    engine.walkState = {
      startTime: performance.now(),
      duration: 10000 // 10 seconds walk
    };
    setIsWalking(true);
  };

  // Reset walking animation
  const handleResetWalk = () => {
    const engine = engineRef.current;
    engine.walkState = null;
    setIsWalking(false);
    setProgress(0);
    if (engine.walkerMarker) {
      engine.walkerMarker.position.copy(getPointAt(0));
    }
  };

  // Main Three.js Initialization
  useEffect(() => {
    if (lowBandwidthMode) return;
    const container = containerRef.current;
    const labelsContainer = labelsContainerRef.current;
    if (!container || !labelsContainer) return;

    const width = container.clientWidth || 700;
    const height = 440;

    // 1. Scene & Renderer in Our Project's Theme (#FAF7F9 canvas)
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xFAF7F9); // Clean campus quadrangle background

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

    // 2. Camera & OrbitControls (Looking down onto campus quadrangle)
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 7000);
    camera.up.set(0, 0, 1);
    const targetVec = new THREE.Vector3(555, 295, GZ - 20);
    camera.position.set(555, -460, 820);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(targetVec);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.48; // Don't flip below ground
    controls.minDistance = 200;
    controls.maxDistance = 2500;

    // 3. Lighting (Warm architectural theme lighting)
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xEBDDE8, 1.3);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.95);
    dirLight.position.set(300, -200, 900);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const softFillLight = new THREE.DirectionalLight(0xF8E8F5, 0.4);
    softFillLight.position.set(-300, 400, 500);
    scene.add(softFillLight);

    // 4. Dynamic Group for Route, Pins, Beacons
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    const labelsList = [];
    const pulseBeacons = [];

    // Store references
    engineRef.current.scene = scene;
    engineRef.current.camera = camera;
    engineRef.current.renderer = renderer;
    engineRef.current.controls = controls;
    engineRef.current.dynamicGroup = dynamicGroup;
    engineRef.current.labels = labelsList;
    engineRef.current.pulseBeacons = pulseBeacons;
    engineRef.current.hologramActive = (activeTabMode === 'hologram');

    // Helper to add 3D projected HTML badge labels
    const addLabel = (text, pos, color = '#8B2072', isBeacon = false) => {
      const el = document.createElement('div');
      el.className = 'map-3d-badge';
      el.style.cssText = `
        position: absolute;
        transform: translate(-50%, -100%);
        background: #FFFFFF;
        border: 1.5px solid ${color};
        color: ${color};
        font-size: 11px;
        font-weight: 700;
        font-family: 'Inter', system-ui, sans-serif;
        padding: 3px 8px;
        border-radius: 20px;
        box-shadow: 0 3px 10px rgba(139, 32, 114, 0.15);
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        transition: opacity 0.15s ease;
      `;
      el.innerHTML = isBeacon ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};margin-right:5px"></span>${text}` : text;
      labelsContainer.appendChild(el);
      labelsList.push({ el, pos });
    };

    // 5. Load BPUT Campus 3D GLB Model
    setModelLoading(true);
    const loader = new GLTFLoader();
    loader.load(
      '/campus_bput.glb',
      (gltf) => {
        const campusScene = gltf.scene;

        // Traverse & Apply Our Project's Theme Colors (#8B2072 Palette)
        campusScene.traverse((obj) => {
          if (!obj.isMesh) return;
          const k = obj.name + '|' + (obj.parent ? obj.parent.name : '');
          let meshColor;

          if (/Outlines/.test(k)) {
            meshColor = 0x8B2072; // Brand Primary Purple Outlines
          } else if (/Roads/.test(k)) {
            meshColor = 0xDCD5DF; // Clean paved avenues
          } else if (/Ground/.test(k)) {
            meshColor = 0xF5EFF6; // Manicured campus courtyard
          } else if (/Buildings_164\b/.test(k)) {
            meshColor = 0xA23985; // Accent Landmark Building
          } else {
            // Harmonious Project Theme Palette
            const themeColors = [0x8B2072, 0xA23985, 0x651451, 0x7C2D6E, 0x9D2E80, 0x5B1347];
            meshColor = themeColors[obj.id % themeColors.length];
          }

          obj.material = new THREE.MeshStandardMaterial({
            color: meshColor,
            roughness: 0.75,
            metalness: 0.08,
            side: THREE.DoubleSide
          });
        });

        campusScene.scale.set(1, 1, ZS);
        scene.add(campusScene);
        setModelLoading(false);

        // 6. Setup Pins / Beacons based on active tab
        if (activeTabMode === 'quest') {
          // Add landmark pins in our theme
          Object.values(CAMPUS_LANDMARKS).forEach((lm) => {
            const pinMesh = new THREE.Mesh(
              new THREE.ConeGeometry(7, 24, 16),
              new THREE.MeshStandardMaterial({ color: 0x8B2072, roughness: 0.3 })
            );
            pinMesh.rotation.x = Math.PI / 2;
            pinMesh.position.copy(P3(lm.x, lm.y, 16));
            dynamicGroup.add(pinMesh);
            addLabel(lm.n, P3(lm.x, lm.y, 38), '#8B2072');
          });

          // Draw Route to current destination
          setupRoute(selectedDestinationKey);
        } else if (activeTabMode === 'xray') {
          // Setup Admin X-Ray Beacons
          renderXRayBeacons();
        }
      },
      undefined,
      (error) => {
        console.warn("Could not load /campus_bput.glb, using procedural campus:", error);
        setModelLoading(false);
      }
    );

    // Function to render X-Ray Beacons
    const renderXRayBeacons = () => {
      while (dynamicGroup.children.length) dynamicGroup.remove(dynamicGroup.children[0]);
      labelsContainer.innerHTML = '';
      labelsList.length = 0;
      pulseBeacons.length = 0;

      // Group tickets by landmark or use mock
      Object.values(CAMPUS_LANDMARKS).forEach((lm) => {
        const matchingPin = mapPins.find(p => p.label.toLowerCase().includes(lm.n.toLowerCase()) || lm.n.toLowerCase().includes(p.label.toLowerCase()));
        const openCount = matchingPin?.open_tickets_count || (lm.id === 'hA' ? 3 : lm.id === 'mess' ? 2 : 0);
        const isCritical = matchingPin?.beacon_status === 'RED' || openCount >= 3;
        const colorHex = isCritical ? 0xEF4444 : openCount > 0 ? 0xF59E0B : 0x10B981;
        const cssColor = isCritical ? '#EF4444' : openCount > 0 ? '#F59E0B' : '#10B981';

        // 3D Glowing Cylinder Beacon
        const beaconGeo = new THREE.CylinderGeometry(8, 8, 70, 16);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.8
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.rotation.x = Math.PI / 2;
        beaconMesh.position.copy(P3(lm.x, lm.y, 35));
        dynamicGroup.add(beaconMesh);

        if (isCritical || openCount > 0) {
          pulseBeacons.push(beaconMesh);
        }

        addLabel(
          `${lm.n}: ${openCount} open${isCritical ? ' ⚠' : ''}`,
          P3(lm.x, lm.y, 82),
          cssColor,
          true
        );
      });
    };

    // Helper for Pepper's Ghost Hologram 4-way viewport view
    const renderHologramViewport = (x, y, w, h, az, roll) => {
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      const dist = 780;
      const pitch = 0.95;
      const holoCam = new THREE.PerspectiveCamera(40, 1, 1, 6000);
      holoCam.position.set(
        targetVec.x + Math.sin(az) * dist * Math.cos(pitch),
        targetVec.y - Math.cos(az) * dist * Math.cos(pitch),
        targetVec.z + dist * Math.sin(pitch)
      );
      holoCam.up.set(0, 0, 1);
      holoCam.lookAt(targetVec);
      holoCam.rotateZ(roll);
      renderer.render(scene, holoCam);
    };

    // 7. Animation Loop
    let animId;
    const animate = (t) => {
      animId = requestAnimationFrame(animate);
      engineRef.current.animFrameId = animId;

      // Handle Walking Animation along the route
      if (engineRef.current.walkState) {
        const elapsed = t - engineRef.current.walkState.startTime;
        const p = Math.min(1, elapsed / engineRef.current.walkState.duration);
        setProgress(p);

        const currentPos = getPointAt(p);
        if (engineRef.current.walkerMarker) {
          engineRef.current.walkerMarker.position.copy(currentPos);
        }

        if (followCamera && controls) {
          controls.target.lerp(currentPos, 0.08);
        }

        if (p >= 1) {
          engineRef.current.walkState = null;
          setIsWalking(false);
        }
      }

      // Pulsate critical/warning beacons
      const scaleVal = 1 + 0.25 * Math.sin(t / 220);
      pulseBeacons.forEach((m) => {
        m.scale.set(scaleVal, 1, scaleVal);
      });

      // Hologram Mode: Render 4 Views with Pepper's Ghost Scissors
      if (engineRef.current.hologramActive) {
        engineRef.current.azimuth += 0.006;
        const az = engineRef.current.azimuth;
        const W = container.clientWidth;
        const H = container.clientHeight;
        const S = Math.min(W, H) / 3;
        const gap = S * 0.55;
        const cx = W / 2;
        const cy = H / 2;

        renderer.setScissorTest(true);
        renderer.clear();
        renderHologramViewport(cx - S / 2, cy + gap, S, S, az, 0); // North
        renderHologramViewport(cx + gap, cy - S / 2, S, S, az + Math.PI / 2, -Math.PI / 2); // East
        renderHologramViewport(cx - S / 2, cy - gap - S, S, S, az + Math.PI, Math.PI); // South
        renderHologramViewport(cx - gap - S, cy - S / 2, S, S, az + 1.5 * Math.PI, Math.PI / 2); // West
        renderer.setScissorTest(false);
      } else {
        // Standard View: Orbit Controls & Floating HTML Labels
        controls.update();
        renderer.setViewport(0, 0, container.clientWidth, container.clientHeight);
        renderer.render(scene, camera);

        // Project 3D positions onto 2D screen coordinates
        labelsList.forEach((lbl) => {
          const v = lbl.pos.clone().project(camera);
          // Hide label if behind camera
          if (v.z > 1) {
            lbl.el.style.display = 'none';
          } else {
            lbl.el.style.display = 'block';
            const screenX = (v.x * 0.5 + 0.5) * container.clientWidth;
            const screenY = (-v.y * 0.5 + 0.5) * container.clientHeight;
            lbl.el.style.transform = `translate(${screenX}px, ${screenY}px) translate(-50%, -100%)`;
          }
        });
      }
    };
    animate(0);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 440;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
    };
  }, [lowBandwidthMode, activeTabMode, setupRoute, followCamera, mapPins]);

  // Update route when destination changes
  useEffect(() => {
    if (activeTabMode === 'quest') {
      setupRoute(selectedDestinationKey);
    }
  }, [selectedDestinationKey, activeTabMode, setupRoute]);

  // Toggle Hologram Mode
  const toggleHologram = (enable) => {
    setActiveTabMode(enable ? 'hologram' : 'quest');
    if (engineRef.current.renderer) {
      engineRef.current.hologramActive = enable;
      engineRef.current.renderer.setClearColor(enable ? 0x000000 : 0xFAF7F9);
    }
    if (labelsContainerRef.current) {
      labelsContainerRef.current.style.display = enable ? 'none' : 'block';
    }
  };

  // Zoom camera to building
  const zoomToBuilding = (lmKey) => {
    const lm = CAMPUS_LANDMARKS[lmKey];
    if (!lm || !engineRef.current.controls || !engineRef.current.camera) return;
    const controls = engineRef.current.controls;
    const target = P3(lm.x, lm.y, 20);
    controls.target.copy(target);
    engineRef.current.camera.position.set(lm.x, lm.y - 250, GZ + 200);
  };

  // LOW-BANDWIDTH FALLBACK (Section 12.1 Requirement)
  if (lowBandwidthMode) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        border: '1px solid var(--color-neutral-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Compass size={22} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)' }}>
            Campus Quest — Low-Bandwidth Mode (0KB 3D Assets)
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '16px' }}>
          3D WebGL rendering disabled to guarantee instant load times over 2G/3G campus cellular connections.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Select Target Destination:
          </label>
          <select
            value={selectedDestinationKey}
            onChange={(e) => setSelectedDestinationKey(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary-light)' }}
          >
            {Object.entries(CAMPUS_LANDMARKS).map(([k, lm]) => (
              <option key={k} value={k}>{lm.n} — {lm.desc}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {questSteps.map((st, idx) => (
            <div key={idx} style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-surface-bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-primary)',
                color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px'
              }}>
                {idx + 1}
              </span>
              <span>{st}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentStepIdx = Math.min(questSteps.length - 1, Math.floor(progress * questSteps.length));

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 'var(--radius-lg)',
      padding: '22px',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-neutral-light)',
      marginBottom: '24px'
    }}>
      {/* Top Header & Mode Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={22} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)' }}>
              {activeTabMode === 'quest' && 'Campus Quest — 3D Turn-by-Turn Navigation'}
              {activeTabMode === 'xray' && 'Campus X-Ray View — Real-Time Infrastructure Beacons'}
              {activeTabMode === 'hologram' && 'Pepper\'s Ghost 4-Way Hologram Projection'}
              {activeTabMode === 'webar' && 'Google <model-viewer> WebAR Phone Experience'}
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)', marginTop: '2px' }}>
            Interactive 3D BPUT Campus Model styled in our project's purple theme • Drag to Orbit • Scroll to Zoom
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--color-surface-bg)',
          padding: '4px',
          borderRadius: 'var(--radius-md)'
        }}>
          <button
            onClick={() => { toggleHologram(false); setActiveTabMode('quest'); }}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTabMode === 'quest' ? 'var(--color-primary)' : 'transparent',
              color: activeTabMode === 'quest' ? '#FFF' : 'var(--color-ink)'
            }}
          >
            Campus Quest
          </button>
          <button
            onClick={() => { toggleHologram(false); setActiveTabMode('xray'); }}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTabMode === 'xray' ? 'var(--color-primary)' : 'transparent',
              color: activeTabMode === 'xray' ? '#FFF' : 'var(--color-ink)'
            }}
          >
            X-Ray View
          </button>
          <button
            onClick={() => toggleHologram(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTabMode === 'hologram' ? 'var(--color-primary)' : 'transparent',
              color: activeTabMode === 'hologram' ? '#FFF' : 'var(--color-ink)'
            }}
          >
            🔺 Hologram (Pyramid)
          </button>
          <button
            onClick={() => { toggleHologram(false); setActiveTabMode('webar'); }}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTabMode === 'webar' ? 'var(--color-primary)' : 'transparent',
              color: activeTabMode === 'webar' ? '#FFF' : 'var(--color-ink)'
            }}
          >
            WebAR
          </button>
        </div>
      </div>

      {/* Mode 1 & 2: 3D Canvas with HUD Overlay */}
      {(activeTabMode === 'quest' || activeTabMode === 'xray' || activeTabMode === 'hologram') && (
        <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {/* Main 3D WebGL Canvas */}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: activeTabMode === 'hologram' ? '480px' : '440px',
              backgroundColor: activeTabMode === 'hologram' ? '#000000' : '#FAF7F9'
            }}
          />

          {/* Floating Projected 2D HTML Labels Container */}
          <div
            ref={labelsContainerRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden'
            }}
          />

          {/* Loading Indicator */}
          {modelLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(250, 247, 249, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--color-primary-light)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                Loading BPUT 3D Campus Model...
              </div>
            </div>
          )}

          {/* Top HUD Badge */}
          {activeTabMode !== 'hologram' && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid var(--color-primary-light)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              🎓 BPUT Rourkela · 3D Quest Map
            </div>
          )}

          {/* Hologram Overlay Reticle */}
          {activeTabMode === 'hologram' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              border: '2px solid rgba(216, 90, 158, 0.6)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D85A9E',
              fontSize: '9px',
              fontWeight: 700,
              pointerEvents: 'none'
            }}>
              ▲ PYRAMID
            </div>
          )}
        </div>
      )}

      {/* Mode 1: Campus Quest Interactive Controls & Synced Steps */}
      {activeTabMode === 'quest' && (
        <div style={{ marginTop: '16px' }}>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--color-surface-bg)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
                Destination:
              </span>
              <select
                value={selectedDestinationKey}
                onChange={(e) => setSelectedDestinationKey(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-neutral-light)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  background: '#FFFFFF'
                }}
              >
                {Object.entries(CAMPUS_LANDMARKS).filter(([k]) => k !== 'gate').map(([k, lm]) => (
                  <option key={k} value={k}>{lm.n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={followCamera}
                  onChange={(e) => setFollowCamera(e.target.checked)}
                />
                Follow Camera
              </label>

              <button
                onClick={isWalking ? handleResetWalk : handleStartWalk}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {isWalking ? (
                  <>
                    <RotateCcw size={15} /> Reset
                  </>
                ) : (
                  <>
                    <Play size={15} /> Start Navigation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar & ETA */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-mid)', marginBottom: '6px' }}>
              <span>
                Route: {CAMPUS_LANDMARKS.gate.n} → {currentDest.n}
              </span>
              <span>
                {progress >= 1 ? 'Arrived at destination!' : `${Math.round(progress * 100)}% completed · ~${Math.max(1, Math.round((1 - progress) * 3))} min walk remaining`}
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#E2D9E4', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round(progress * 100)}%`,
                background: 'linear-gradient(90deg, #8B2072 0%, #D85A9E 100%)',
                transition: 'width 0.15s linear'
              }} />
            </div>
          </div>

          {/* Synchronized Step-by-Step Checklist */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-neutral-mid)', marginBottom: '8px' }}>
              Live Turn-by-Turn Waypoints:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {questSteps.map((st, idx) => {
                const isDone = idx < currentStepIdx || progress >= 1;
                const isActive = idx === currentStepIdx && progress < 1;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--color-surface-bg)',
                      borderLeft: `4px solid ${isActive ? 'var(--color-primary)' : isDone ? 'var(--color-semantic-green)' : 'var(--color-neutral-light)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: isDone ? 'var(--color-semantic-green)' : isActive ? 'var(--color-primary)' : '#CBD5E1',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
                      textDecoration: isDone ? 'none' : 'none'
                    }}>
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Admin X-Ray Sector Inspection Breakdown */}
      {activeTabMode === 'xray' && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-neutral-mid)', marginBottom: '10px' }}>
            Live Infrastructure Beacons (Click sector to focus camera):
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {Object.entries(CAMPUS_LANDMARKS).map(([k, lm]) => {
              const matchingPin = mapPins.find(p => p.label.toLowerCase().includes(lm.n.toLowerCase()) || lm.n.toLowerCase().includes(p.label.toLowerCase()));
              const openTickets = matchingPin?.open_tickets || [];
              const count = matchingPin?.open_tickets_count || (k === 'hA' ? 3 : k === 'mess' ? 2 : 0);
              const isCrit = matchingPin?.beacon_status === 'RED' || count >= 3;

              return (
                <div
                  key={k}
                  onClick={() => {
                    setSelectedBuilding({ label: lm.n, open_tickets: openTickets });
                    zoomToBuilding(k);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-neutral-light)',
                    backgroundColor: 'var(--color-card-bg)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>{lm.n}</span>
                    <span className={`status-pill ${isCrit ? 'red' : count > 0 ? 'amber' : 'green'}`}>
                      {isCrit ? 'CRITICAL' : count > 0 ? 'PENDING' : 'CLEAN'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
                    {count} active tickets reported in this block
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Building Details Drawer */}
          {selectedBuilding && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: 'var(--color-surface-bg)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--color-primary)'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                Open Tickets at {selectedBuilding.label}:
              </h5>
              {selectedBuilding.open_tickets?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedBuilding.open_tickets.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>#{t.id} — {t.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
                          Room: {t.room} • Status: {t.status}
                        </div>
                      </div>
                      <span className={`status-pill ${t.priority === 'CRITICAL' ? 'red' : 'amber'}`}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
                  No high-severity complaints open in this block. Infrastructure is functioning normally.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Pepper's Ghost Physical Instructions */}
      {activeTabMode === 'hologram' && (
        <div style={{
          marginTop: '14px',
          padding: '14px 18px',
          backgroundColor: '#111827',
          borderRadius: 'var(--radius-md)',
          color: '#E5E7EB',
          fontSize: '12px',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: '#D85A9E' }}>Physical Pepper's Ghost Hologram Setup:</strong>
          <br />
          Place your smartphone or tablet completely flat on a desk. Place a transparent inverted 4-sided plastic pyramid on the center target box above. The four rotating perspectives will converge on the plastic faces, creating a floating 3D holographic projection of the BPUT campus in mid-air.
        </div>
      )}

      {/* Mode 4: WebAR Mode */}
      {activeTabMode === 'webar' && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{
            maxWidth: '520px',
            margin: '0 auto',
            backgroundColor: 'var(--color-surface-bg)',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-neutral-light)'
          }}>
            <Box size={44} style={{ color: 'var(--color-primary)', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
              Google &lt;model-viewer&gt; WebAR Experience
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '16px', lineHeight: '1.5' }}>
              Augmented Reality preview using WebXR SceneViewer & QuickLook.
              Allows placing the entire 3D campus quadrangle on your desk or room floor.
            </p>

            <div style={{
              padding: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-neutral-light)'
            }}>
              <strong>Model Asset:</strong> <code>/campus_bput.glb</code> (864 KB)
            </div>

            <button
              onClick={() => {
                alert("WebAR Launch: Requires an ARCore or ARKit enabled smartphone accessing over HTTPS. The GLB model /campus_bput.glb is fully ready for WebXR SceneViewer.");
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Launch Augmented Reality Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
