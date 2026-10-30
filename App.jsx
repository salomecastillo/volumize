import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import { evaluate } from 'mathjs';
import * as THREE from 'three';
import './App.css';

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
    <section className="solution-panel" id="solution-steps">
      <div className="section-heading"><div><p className="eyebrow">THE METHOD</p><h2>One step at a time.</h2></div><span className="muted">From the region to the integral</span></div>
      {steps.map((step, i) => (
        <div className="solution-step" key={i}>
          <button aria-expanded={expanded === i} aria-controls={`step-${i}`} onClick={() => setExpanded(expanded === i ? null : i)}>
            <span><span className="step-number">0{i + 1}</span>{step.title}</span><span aria-hidden="true">{expanded === i ? '\u2212' : '+'}</span>
          </button>
          {expanded === i && <div className="step-content" id={`step-${i}`}>{step.content}</div>}
        </div>
      ))}
    </section>
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
      try { y = Math.max(0, evaluate(expr, { x }) || 0); } catch { /* Keep the visualization responsive while an expression is being edited. */ }
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
      try { top = Math.max(0, evaluate(topExpr, { x }) || 0); bottom = Math.max(0, evaluate(bottomExpr, { x }) || 0); } catch { /* Keep the visualization responsive while an expression is being edited. */ }
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
          color: new THREE.Color().setHSL(0.43 + (i / numCrossSections) * 0.12, 0.42, 0.51),
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
      } catch { /* Keep the visualization responsive while an expression is being edited. */ }
    }
    return sections;
  }, [topFunction, bottomFunction, start, end, crossSectionShape, numCrossSections]);

  return <>{meshes}</>;
}
const SHAPE_FACTORS = { square: 1, semicircle: Math.PI / 2, equilateral: Math.sqrt(3) / 4 };

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
      } catch { /* Keep the visualization responsive while an expression is being edited. */ }
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
      } catch { /* Keep the visualization responsive while an expression is being edited. */ }
    }
    
    setTotalVolume(volume.toFixed(4));
  }, [topFunction, bottomFunction, a, b, shape, numCrossSections]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#"><span className="brand-mark" aria-hidden="true">&#8747;</span>volumize<span className="brand-dot">.</span></a>
        <nav aria-label="Main navigation"><a href="#explore">Workspace</a><a href="#about">The idea</a><a className="nav-cta" href="#explore">Explore in 3D <span aria-hidden="true">&#8599;</span></a></nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="small-square" /> THE CROSS-SECTION LAB</p>
            <h1>A little calculus.<br /><em>A whole new dimension.</em></h1>
            <p className="hero-description">Build a solid from the space between two curves. Change a slice, shift your perspective, and see the math take shape.</p>
          </div>
          <aside className="formula-card" aria-label="The principle of volume by cross sections">
            <p className="eyebrow">THE IDEA IS SIMPLE</p>
            <div className="hero-formula">V = &#8747;<sub>a</sub><sup>b</sup> A(x) dx</div>
            <p>Small slices. A bigger understanding.</p>
          </aside>
        </section>
        <section className="explorer" id="explore" aria-labelledby="explore-title">
          <div className="section-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h2 id="explore-title">Make it take shape.</h2></div><span className="workspace-note"><span /> Live ? updates as you explore</span></div>
          <div className="workspace">
            <aside className="controls-panel">
              <div className="panel-title"><span className="eyebrow">THE PARAMETERS</span><h3>Define your solid</h3></div>
              <div className="control-fields">
                <label htmlFor="top-function"><span className="function-label"><i className="top-dot" />Top function</span><span>f(x)</span></label>
                <div className="equation-input"><span>y =</span><input id="top-function" type="text" value={topFunction} onChange={e => setTopFunction(e.target.value)} placeholder="e.g., 2*x, x^2" /></div>
                <label htmlFor="bottom-function"><span className="function-label"><i className="bottom-dot" />Bottom function</span><span>g(x)</span></label>
                <div className="equation-input"><span>y =</span><input id="bottom-function" type="text" value={bottomFunction} onChange={e => setBottomFunction(e.target.value)} placeholder="e.g., 0, x" /></div>
                <p className="input-hint">Use * to multiply and ^ for powers.</p>
                <div className="bounds"><div><label htmlFor="bound-a">Lower bound <span>a</span></label><input id="bound-a" type="number" value={a} onChange={e => setA(parseFloat(e.target.value) || 0)} step="0.1" /></div><div><label htmlFor="bound-b">Upper bound <span>b</span></label><input id="bound-b" type="number" value={b} onChange={e => setB(parseFloat(e.target.value) || 1)} step="0.1" /></div></div>
                <fieldset className="shape-field"><legend>Cross-section shape</legend><div className="shape-options">{[{ value: 'square', icon: '?', label: 'Square' }, { value: 'semicircle', icon: '?', label: 'Semicircle' }, { value: 'equilateral', icon: '?', label: 'Triangle' }].map(option => <button key={option.value} type="button" aria-pressed={shape === option.value} title={option.value === 'equilateral' ? 'Equilateral triangle' : option.label} onClick={() => setShape(option.value)}><span aria-hidden="true">{option.icon}</span>{option.label}</button>)}</div></fieldset>
                <label className="range-label" htmlFor="sections">Cross sections <output htmlFor="sections">{numCrossSections}</output></label><input id="sections" type="range" min="10" max="100" value={numCrossSections} onChange={e => setNumCrossSections(parseInt(e.target.value))} /><div className="range-extents"><span>10 slices</span><span>100 slices</span></div>
                <label className="checkbox-label"><input type="checkbox" id="showArea" checked={showAreaLines} onChange={e => setShowAreaLines(e.target.checked)} /> Show filled area</label>
              </div>
              {totalVolume && <div className="volume-result"><span className="eyebrow">APPROXIMATE VOLUME</span><p>{totalVolume} <span>units&#179;</span></p><span>Midpoint approximation ? {numCrossSections} slices</span></div>}
              <button className="steps-toggle" aria-expanded={showSteps} aria-controls="solution-steps" onClick={() => setShowSteps(!showSteps)}>{showSteps ? 'Hide' : 'Show'} solution steps <span aria-hidden="true">{showSteps ? '\u2212' : '+'}</span></button>
            </aside>
            <section className="graph-panel" aria-label="Interactive three-dimensional graph">
              <div className="graph-header"><span className="eyebrow">THE VISUALIZATION</span><span className="graph-badge">Interactive 3D</span></div>
              <div className="graph-canvas">
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
              <div className="graph-legend"><span><i className="top-dot" />y = {topFunction}</span><span><i className="bottom-dot" />y = {bottomFunction}</span><span className="shape-name">{shape === 'equilateral' ? 'Equilateral triangle' : shape} sections</span></div>
              <div className="graph-help"><span><b aria-hidden="true">?</b> Drag to rotate</span><span><b aria-hidden="true">?</b> Scroll to zoom</span><span><b aria-hidden="true">?</b> Right-drag to pan</span></div>
            </section>
          </div>
          {showSteps && <SolvingSteps topFunction={topFunction} bottomFunction={bottomFunction} a={a} b={b} shape={shape} totalVolume={totalVolume} />}
        </section>
        <section className="about-section" id="about">
          <div className="about-intro"><p className="eyebrow">THE IDEA BEHIND VOLUMIZE</p><h2>Calculus makes more sense<br />when you can see it.</h2><p>Created as an AP Calculus final project, Volumize helps other students connect the integral on the page to the solid it represents. It is a space to experiment, build intuition, and make cross-sectional volume a little less abstract.</p></div>
          <div className="how-to"><p className="eyebrow">YOUR FIRST EXPLORATION</p><ol><li><span>01</span><div><h3>Define a region</h3><p>Enter two functions and choose your interval along the x-axis.</p></div></li><li><span>02</span><div><h3>Build it in slices</h3><p>Choose a cross-section shape and adjust the number of slices to explore the solid.</p></div></li><li><span>03</span><div><h3>Connect it to calculus</h3><p>Rotate the graph, inspect the volume, and open the solution steps to follow the method.</p></div></li></ol></div>
        </section>
      </main>
      <footer><a className="brand" href="#">volumize.</a><span>An AP Calculus project &middot; Made for curious minds.</span><a href="#explore">Back to exploring &#8593;</a></footer>
    </div>
  );
}
