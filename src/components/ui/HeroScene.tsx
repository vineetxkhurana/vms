'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050d1a, 0.11)
    const camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 0, 4)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pl1 = new THREE.PointLight(0x00c2ff, 2, 10)
    pl1.position.set(2, 3, 2)
    scene.add(pl1)
    const pl2 = new THREE.PointLight(0x00e5a0, 1.5, 10)
    pl2.position.set(-2, -2, 1)
    scene.add(pl2)

    // Stars
    const starPos = new Float32Array(6000)
    for (let i = 0; i < 6000; i++) starPos[i] = (Math.random() - 0.5) * 100
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.5 }),
      ),
    )

    // DNA helix
    const dnaGroup = new THREE.Group()
    scene.add(dnaGroup)
    const count = 24
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 4 - Math.PI * 2
      const y = (i / count) * 5 - 2.5
      const r = 0.7

      const s1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0x00c2ff,
          emissive: 0x00c2ff,
          emissiveIntensity: 1.5,
          roughness: 0.1,
        }),
      )
      s1.position.set(Math.cos(t) * r, y, Math.sin(t) * r)
      dnaGroup.add(s1)

      const s2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0x00e5a0,
          emissive: 0x00e5a0,
          emissiveIntensity: 1.5,
          roughness: 0.1,
        }),
      )
      s2.position.set(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r)
      dnaGroup.add(s2)

      if (i % 3 === 0) {
        const p1 = new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r)
        const p2 = new THREE.Vector3(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r)
        const rung = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, p1.distanceTo(p2), 6),
          new THREE.MeshStandardMaterial({
            color: 0x7c3aed,
            emissive: 0x7c3aed,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7,
          }),
        )
        rung.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5))
        rung.rotation.z = Math.PI / 2
        dnaGroup.add(rung)
      }
    }

    // Floating pills
    const pills = [
      { pos: [-2, 0.5, 0], color: 0x00c2ff, speed: 0.8 },
      { pos: [2, -0.5, -1], color: 0x00e5a0, speed: 0.6 },
      { pos: [-1.5, -1.5, 0.5], color: 0x7c3aed, speed: 1.0 },
      { pos: [1.8, 1.2, -0.5], color: 0x00c2ff, speed: 0.7 },
    ].map(cfg => {
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.08, 0.25, 4, 8),
        new THREE.MeshStandardMaterial({
          color: cfg.color,
          emissive: cfg.color,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.85,
        }),
      )
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2])
      scene.add(mesh)
      return { mesh, baseY: cfg.pos[1], speed: cfg.speed }
    })

    // Resize handler
    const onResize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    // Animation loop
    const clock = new THREE.Clock()
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      dnaGroup.rotation.y = t * 0.25
      dnaGroup.rotation.x = Math.sin(t * 0.2) * 0.08
      pills.forEach(p => {
        p.mesh.position.y = p.baseY + Math.sin(t * p.speed) * 0.3
        p.mesh.rotation.x = t * p.speed * 0.5
        p.mesh.rotation.z = t * p.speed * 0.3
      })
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
