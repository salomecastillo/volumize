import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import { evaluate } from 'mathjs';
import * as THREE from 'three';

// Background particles
const InteractiveBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles = [];
    let mouse = { x: null, y: null };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.color = `rgba(255,255,255,${Math.random() * 0.1 + 0.1})`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > height || this.y < 0) this.speedY = -this.speedY;
        
        if (mouse.x) {
          const dx = mouse.x - this.x, dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const angle = Math.atan2(dy, dx);
            this.speedX -= Math.cos(angle) * 0.2;
            this.speedY -= Math.sin(angle) * 0.2;
          }
        }
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        particles.forEach(p => {
          const dx = this.x - p.x, dy = this.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(255,255,255,${0.1 - dist/1500})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        });
      }
    }

    const init = () => {
      particles = Array.from({ length: Math.min(width, height) * 0.08 }, () => new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    };

    const resize = () => {
      width = Math.min(window.innerWidth * 0.9, 1000); // 90% width, max 1000px
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    animate();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1,
    background: 'linear-gradient(135deg, #1e1b2e 0%, #2a2541 50%, #3d3a5c 100%)'
  }} />;
};

// Solution steps
const SolvingSteps = ({ topFunction, bottomFunction, a, b, shape, totalVolume }) => {
  const [expanded, setExpanded] = useState(null);
  const shapes = {
    square: { factor: 1, name: 'Square' },
    semicircle: { factor: Math.PI / 2, name: 'Semicircle' },
    equilateral: { factor: Math.sqrt(3) / 4, name: 'Equilateral Triangle' }
  };
  const { factor, name } = shapes[shape];
  const fmt = f => f.replace(/\*/g, '·').replace(/sqrt/g, '√').replace(/\^2/g, '²').replace(/\^3/g, '³');
  
  const steps = [
    { 
      title: "Problem Setup", 
      content: `We need to find the volume of a solid where each cross-section perpendicular to the x-axis is a ${name.toLowerCase()}.\n\nThe solid is bounded by:\n• Top: y = ${fmt(topFunction)}\n• Bottom: y = ${fmt(bottomFunction)}\n• Left and right boundaries: x = ${a} and x = ${b}\n\nFor any x-value in [${a}, ${b}], we slice the solid perpendicular to the x-axis to get a ${name.toLowerCase()} cross-section.` 
    },
    { 
      title: "Find Cross-Section Dimensions", 
      content: `At any x-value, the ${name.toLowerCase()} has a side length equal to the distance between the top and bottom curves.\n\nSide length: s(x) = |${fmt(topFunction)} − ${fmt(bottomFunction)}|\n\nWe use absolute value to ensure the side length is always positive, regardless of which function is larger.` 
    },
    { 
      title: "Calculate Cross-Section Area", 
      content: `The area of a ${name.toLowerCase()} with side length s is:\n• ${name}: A = ${factor === 1 ? 's²' : factor === Math.PI/2 ? '(π/2)r² where r = s/2, so A = (π/8)s²' : '(√3/4)s²'}\n\nSubstituting our side length:\nA(x) = ${factor.toFixed(4)} × [s(x)]²\nA(x) = ${factor.toFixed(4)} × [${fmt(topFunction)} − ${fmt(bottomFunction)}]²\n\nThis gives us the area of each cross-section as a function of x.` 
    },
    { 
      title: "Set Up Volume Integral", 
      content: `To find the total volume, we integrate the cross-sectional area over the interval [${a}, ${b}]:\n\n∫ A(x) dx  from ${a} to ${b}\n\nSubstituting our area function:\n∫ ${factor.toFixed(4)} × [${fmt(topFunction)} − ${fmt(bottomFunction)}]² dx  from ${a} to ${b}\n\nThis integral sums up all the infinitesimally thin cross-sections from x = ${a} to x = ${b}.` 
    },
    { 
      title: "Final Answer", 
      content: `After evaluating the integral (using calculus techniques like substitution, integration by parts, or numerical methods):\n\nV ≈ ${totalVolume} cubic units\n\nThis represents the total volume of the solid with ${name.toLowerCase()} cross-sections.` 
    }
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', borderRadius: '30px',
      padding: '30px', border: '1px solid rgba(255,255,255,0.2)', color: 'white',
      width: '94vw', fontSize: '18px', fontFamily: 'Georgia, serif'
    }}>
      <h2 style={{ margin: '0 0 25px 0', fontSize: '28px', textAlign: 'center' }}>Solution Steps</h2>
      {steps.map((step, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', margin: '14px 0' }}>
          <button onClick={() => setExpanded(expanded === i ? null : i)} style={{
            width: '100%', padding: '20px 24px', background: 'transparent', border: 'none',
            color: 'white', fontSize: '20px', textAlign: 'left', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between'
          }}>
            <span>{i + 1}. {step.title}</span>
            <span style={{ transform: `rotate(${expanded === i ? 180 : 0}deg)`, transition: 'transform 0.3s' }}>▼</span>
          </button>
          {expanded === i && (
            <div style={{
              padding: '0 24px 20px', fontSize: '17px', borderTop: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'pre-wrap'
            }}>
              {step.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 3D Axes
function Axes({ xRange, yRange, zRange }) {
  const line = (start, end, color) => <line geometry={new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...start), new THREE.Vector3(...end)])} material={new THREE.LineBasicMaterial({ color })} />;
  
  return (
    <>
      <mesh position={[(xRange[0] + xRange[1])/2, (yRange[0] + yRange[1])/2, -0.001]}>
        <planeGeometry args={[xRange[1] - xRange[0], yRange[1] - yRange[0]]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {line([xRange[0], 0, 0], [xRange[1], 0, 0], '#FF6B6B')}
      {line([0, yRange[0], 0], [0, yRange[1], 0], '#4ECDC4')}
      {line([0, 0, zRange[0]], [0, 0, zRange[1]], '#45B7D1')}
      <Text position={[xRange[1] + 0.15, 0, 0]} fontSize={0.12} color="#FF6B6B">x</Text>
      <Text position={[0, yRange[1] + 0.15, 0]} fontSize={0.12} color="#4ECDC4">y</Text>
      <Text position={[0, 0, zRange[1] + 0.15]} fontSize={0.12} color="#45B7D1">z</Text>
    </>
  );
}

// Function graphs
function FunctionGraph({ expression, start, end, color, showArea, bottomExpression }) {
  const processExpr = expr => (expr || "0").replace(/(\d)([a-zA-Z])/g, '$1*$2');
  
  const points = useMemo(() => {
    const pts = [];
    const expr = processExpr(expression);
    for (let i = 0; i <= 300; i++) {
      const x = start + (i / 300) * (end - start);
      let y = 0;
      try { y = Math.max(0, evaluate(expr, { x }) || 0); } catch {}
      pts.push([x, y, 0]);
    }
    return pts;
  }, [expression, start, end]);

  const area = useMemo(() => {
    if (!showArea) return null;
    const vertices = [], indices = [];
    const topExpr = processExpr(expression), bottomExpr = processExpr(bottomExpression);
    const topPts = [], bottomPts = [];
    
    for (let i = 0; i <= 100; i++) {
      const x = start + (i / 100) * (end - start);
      let top = 0, bottom = 0;
      try { top = Math.max(0, evaluate(topExpr, { x }) || 0); bottom = Math.max(0, evaluate(bottomExpr, { x }) || 0); } catch {}
      topPts.push([x, top, 0.002]);
      bottomPts.push([x, bottom, 0.002]);
    }
    
    topPts.forEach(p => vertices.push(...p));
    bottomPts.reverse().forEach(p => vertices.push(...p));
    
    for (let i = 0; i < topPts.length - 1; i++) {
      const bi = topPts.length + (topPts.length - 1 - i);
      const nbi = topPts.length + (topPts.length - 1 - (i + 1));
      indices.push(i, i + 1, bi, i + 1, nbi, bi);
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    return <mesh geometry={geo} material={new THREE.MeshBasicMaterial({ color: '#9B59B6', transparent: true, opacity: 0.2, side: THREE.DoubleSide })} />;
  }, [expression, bottomExpression, start, end, showArea]);

  return <><Line points={points} color={color} lineWidth={4} />{area}</>;
}

// Cross-section solid
function CrossSectionSolid({ topFunction, bottomFunction, start, end, crossSectionShape, numCrossSections }) {
  const meshes = useMemo(() => {
    const sections = [];
    const delta = (end - start) / numCrossSections;
    const topExpr = (topFunction || "0").replace(/(\d)([a-zA-Z])/g, '$1*$2');
    const bottomExpr = (bottomFunction || "0").replace(/(\d)([a-zA-Z])/g, '$1*$2');
    
    for (let i = 0; i < numCrossSections; i++) {
      const x = start + i * delta + delta / 2;
      try {
        let top = evaluate(topExpr, { x }) || 0;
        let bottom = evaluate(bottomExpr, { x }) || 0;
        if (top < 0) top = 0;
        if (bottom < 0) bottom = 0;
        
        const h = Math.abs(top - bottom);
        if (h < 0.01 || h > 10) continue;
        
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL((i / numCrossSections) * 0.8 + 0.1, 0.8, 0.6),
          transparent: true, opacity: 0.85, side: THREE.DoubleSide
        });
        
        let mesh;
        const centerY = (top + bottom) / 2;
        
        if (crossSectionShape === 'rectangle') {
          mesh = new THREE.Mesh(new THREE.BoxGeometry(delta * 0.9, h, h), mat);
          mesh.position.set(x, centerY, h / 2);
        } else if (crossSectionShape === 'semicircle') {
          // Create semicircle geometry - use radius h/2 so diameter equals height h
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(h/2, h/2, delta * 0.9, 16, 1, false, 0, Math.PI), mat);
          
          // Rotate the semicircle:
          // 1. Rotate 90° around X-axis to lay it flat (curved part pointing up in +Z)
          // 2. Then rotate 90° around Z-axis to align with the height span
          mesh.rotation.set(Math.PI / 2, 0, Math.PI / 2);
          
          // Position so the flat diameter edge spans from bottom to top function values
          // The semicircle's flat edge will be on the xy-plane, curved part extends in +z
          mesh.position.set(x, centerY, 0);
        } else if (crossSectionShape === 'triangle') {
          // Create equilateral triangle with one side along the line from bottom to top
          const shape = new THREE.Shape();
          
          // Create triangle with base of length h (from bottom to top)
          // and extending outward perpendicular to xy-plane
          const height = h * Math.sqrt(3) / 2; // Height of equilateral triangle
          
          // Triangle vertices: base along y-axis, peak extending in positive z-direction
          shape.moveTo(0, -h/2);  // Bottom of base
          shape.lineTo(0, h/2);   // Top of base
          shape.lineTo(-height, 0); // Peak extending in positive z direction (negative because of rotation)
          shape.closePath();
          
          mesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, { 
              depth: delta * 0.9, 
              bevelEnabled: false 
            }), 
            mat
          );
          
          // Rotate so the triangle is perpendicular to xy-plane
          // The base (one side) will touch the graph line from bottom to top
          mesh.rotation.set(0, Math.PI / 2, 0);
          
          // Position the triangle so its base aligns with the graph
          mesh.position.set(x, centerY, 0);
        }
        
        if (mesh) sections.push(<primitive key={i} object={mesh} />);
      } catch {}
    }
    return sections;
  }, [topFunction, bottomFunction, start, end, crossSectionShape, numCrossSections]);

  return <>{meshes}</>;
}
// Main component
export default function App() {
  const [topFunction, setTopFunction] = useState('2*x');
  const [bottomFunction, setBottomFunction] = useState('x^2');
  const [a, setA] = useState(0);
  const [b, setB] = useState(1.5);
  const [shape, setShape] = useState('square');
  const [numCrossSections, setNumCrossSections] = useState(25);
  const [totalVolume, setTotalVolume] = useState(null);
  const [showAreaLines, setShowAreaLines] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [ranges, setRanges] = useState({ x: [0, 2], y: [0, 3], z: [0, 2] });

  const SHAPE_FACTORS = { square: 1, semicircle: Math.PI / 2, equilateral: Math.sqrt(3) / 4 };

  useEffect(() => {
    const xMax = Math.max(b, 1.5) + 0.5;
    let maxHeight = 0;
    
    for (let i = 0; i <= 20; i++) {
      const x = a + i * (b - a) / 20;
      if (x < 0) continue;
      
      try {
        const top = evaluate(topFunction.replace(/(\d)([a-zA-Z])/g, '$1*$2'), { x });
        const bottom = evaluate(bottomFunction.replace(/(\d)([a-zA-Z])/g, '$1*$2'), { x });
        
        if (!isNaN(top) && !isNaN(bottom) && top >= 0 && bottom >= 0) {
          maxHeight = Math.max(maxHeight, top, bottom);
        }
      } catch {}
    }
    
    setRanges({
      x: [0, xMax],
      y: [0, Math.max(maxHeight * 1.3, 3)],
      z: [0, Math.max(maxHeight * 1.1, 2)]
    });
  }, [a, b, topFunction, bottomFunction]);

  useEffect(() => {
    const dx = (b - a) / numCrossSections;
    let volume = 0;
    const shapeFactor = SHAPE_FACTORS[shape];
    
    for (let i = 0; i < numCrossSections; i++) {
      const x = a + i * dx + dx / 2;
      if (x < a || x > b) continue;
      
      try {
        let top = evaluate(topFunction.replace(/(\d)([a-zA-Z])/g, '$1*$2'), { x }) || 0;
        let bottom = evaluate(bottomFunction.replace(/(\d)([a-zA-Z])/g, '$1*$2'), { x }) || 0;
        if (top < 0) top = 0;
        if (bottom < 0) bottom = 0;
        
        volume += shapeFactor * Math.pow(Math.abs(top - bottom), 2) * dx;
      } catch {}
    }
    
    setTotalVolume(volume.toFixed(4));
  }, [topFunction, bottomFunction, a, b, shape, numCrossSections]);

  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth <= 1024;

  const inputStyle = {
    width: '90%', padding: '12px 16px 12px 12px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '14px'
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)',
    borderRadius: '20px', padding: '30px',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', overflowX: 'hidden', margin: 0, padding: 0 }}>
      <InteractiveBackground />
      
      <div style={{
        textAlign:'center',
        fontSize: '6vw',
        fontWeight: 'bold',
      }}> VOLUMIZE </div>

      <div style={{ 
        position: 'relative', zIndex: 1, width: '100%', minHeight: '100vh',
        padding: isMobile ? '10px' : '20px',
        display: 'flex', flexDirection: isTablet ? 'column' : 'row',
        gap: '20px', boxSizing: 'border-box', maxWidth: '100vw'
      }}>
       
        <div style={{
          ...cardStyle, width: isTablet ? '100%' : '380px',
          height: 'fit-content', color: 'white', flexShrink: 0
        }}>
          <h1 style={{ 
            margin: '0 0 25px 0', fontSize: isMobile ? '20px' : '24px', fontWeight: '700', textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Volume by Cross-Sectional Areas</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', }}>Top Function: y =</label>
              <input type="text" value={topFunction} onChange={e => setTopFunction(e.target.value)} placeholder="e.g., 2*x, x^2" style={inputStyle} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Bottom Function: y =</label>
              <input type="text" value={bottomFunction} onChange={e => setBottomFunction(e.target.value)} placeholder="e.g., 0, x" style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>From x =</label>
                <input type="number" value={a} onChange={e => setA(parseFloat(e.target.value) || 0)} step="0.1" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>To x =</label>
                <input type="number" value={b} onChange={e => setB(parseFloat(e.target.value) || 1)} step="0.1" style={inputStyle} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Cross-Section Shape</label>
              <select value={shape} onChange={e => setShape(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="square">Square</option>
                <option value="semicircle">Semicircle</option>
                <option value="equilateral">Equilateral Triangle</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Cross-Sections: {numCrossSections}</label>
              <input type="range" min="10" max="100" value={numCrossSections} onChange={e => setNumCrossSections(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="checkbox" id="showArea" checked={showAreaLines} onChange={e => setShowAreaLines(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label htmlFor="showArea" style={{ cursor: 'pointer', fontSize: '14px' }}>Show filled area</label>
            </div>
            
            {totalVolume && (
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Volume</h3>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: '700' }}>{totalVolume} cubic units</p>
              </div>
            )}
            
            <button onClick={() => setShowSteps(!showSteps)} style={{
              width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
            }}>
              {showSteps ? 'Hide' : 'Show'} Solution Steps
            </button>
          </div>
        </div>

        <div style={{
          ...cardStyle, flex: 1, width: isTablet ? '100%' : 'calc(100% - 400px)',
          height: isTablet ? '500px' : '80vh', minHeight: '400px', position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
            background: 'rgba(0,0,0,0.7)', padding: '10px 15px', borderRadius: '8px',
            color: 'white', fontSize: '12px'
          }}>
            <div>Top: y = {topFunction}</div>
            <div>Bottom: y = {bottomFunction}</div>
            <div>Shape: {shape}</div>
          </div>
          
          <Canvas camera={{ position: [4, 3, 4], fov: 50 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            
            <Axes xRange={ranges.x} yRange={ranges.y} zRange={ranges.z} />
            
            <FunctionGraph expression={topFunction} start={ranges.x[0]} end={ranges.x[1]} color="#FF6B6B" 
              showArea={showAreaLines} bottomExpression={bottomFunction} />
            
            <FunctionGraph expression={bottomFunction} start={ranges.x[0]} end={ranges.x[1]} color="#4ECDC4" />
            
            <CrossSectionSolid topFunction={topFunction} bottomFunction={bottomFunction} start={a} end={b} 
              crossSectionShape={shape === 'square' ? 'rectangle' : shape === 'equilateral' ? 'triangle' : shape} 
              numCrossSections={numCrossSections} />
            
            <OrbitControls enablePan enableZoom enableRotate maxDistance={15} minDistance={2} />
          </Canvas>
        </div>
      </div>
      
      {showSteps && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: isMobile ? '10px' : '20px', paddingTop: '0' }}>
          <SolvingSteps topFunction={topFunction} bottomFunction={bottomFunction} a={a} b={b} shape={shape} totalVolume={totalVolume} />
        </div>
      )}
    </div>
  );
}