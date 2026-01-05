import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * 3D DATA LANDSCAPE - Industry metrics visualization
 * GPU-accelerated Three.js rendering with interactive controls
 */
export function Data3DLandscape({
  width = 1000,
  height = 600,
  data = [],
  colorScheme = { primary: '#06f', secondary: '#0ff' },
  rotation = true,
  interactive = true,
}) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const meshesRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a1e)
    scene.fog = new THREE.Fog(0x0a0a1e, 5000, 10000)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      10000
    )
    camera.position.set(0, 200, 300)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 300, 100)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Create grid landscape
    const createGrid = () => {
      const geometry = new THREE.BufferGeometry()
      const gridSize = 50
      const gridSegments = 10

      const positions = []
      for (let i = 0; i <= gridSegments; i++) {
        for (let j = 0; j <= gridSegments; j++) {
          const x = (i / gridSegments) * gridSize - gridSize / 2
          const z = (j / gridSegments) * gridSize - gridSize / 2
          const y = Math.sin(x / 10) * Math.cos(z / 10) * 10
          positions.push(x, y, z)
        }
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))

      const material = new THREE.LineBasicMaterial({
        color: colorScheme.secondary,
        transparent: true,
        opacity: 0.3,
      })

      const grid = new THREE.LineSegments(geometry, material)
      scene.add(grid)
    }

    createGrid()

    // Create data pillars
    if (data && data.length > 0) {
      const spacing = 40
      const startX = -(data.length / 2) * spacing + spacing / 2

      data.forEach((item, index) => {
        const x = startX + index * spacing
        const z = 0
        const height = (item.value || 50) * 2
        const width = 15
        const depth = 15

        const geometry = new THREE.BoxGeometry(width, height, depth)
        const material = new THREE.MeshStandardMaterial({
          color: item.color || colorScheme.primary,
          metalness: 0.7,
          roughness: 0.2,
          emissive: colorScheme.secondary,
          emissiveIntensity: 0.2,
        })

        const pillar = new THREE.Mesh(geometry, material)
        pillar.position.set(x, height / 2, z)
        pillar.castShadow = true
        pillar.receiveShadow = true
        pillar.userData = item

        // Hover effect
        pillar.userData.originalColor = material.color.clone()

        scene.add(pillar)
        meshesRef.current.push(pillar)

        // Add label
        if (item.label) {
          const canvas = document.createElement('canvas')
          canvas.width = 256
          canvas.height = 128
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = colorScheme.primary
          ctx.font = 'bold 32px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(item.label, 128, 64)

          const texture = new THREE.CanvasTexture(canvas)
          const labelGeometry = new THREE.PlaneGeometry(30, 15)
          const labelMaterial = new THREE.MeshBasicMaterial({ map: texture })
          const label = new THREE.Mesh(labelGeometry, labelMaterial)
          label.position.set(x, height + 20, z)
          scene.add(label)
        }
      })
    }

    // Mouse tracking
    const onMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / width) * 2 - 1
      mouseRef.current.y = -(event.clientY / height) * 2 + 1
    }

    if (interactive) {
      renderer.domElement.addEventListener('mousemove', onMouseMove)
    }

    // Animation loop
    let frame = 0
    const animate = () => {
      frame++

      // Rotate camera if enabled
      if (rotation) {
        const angle = (frame * 0.0002) % (Math.PI * 2)
        camera.position.x = Math.sin(angle) * 300
        camera.position.z = Math.cos(angle) * 300
        camera.lookAt(0, 100, 0)
      }

      // Update meshes
      meshesRef.current.forEach((mesh) => {
        // Floating animation
        const floatOffset = Math.sin(frame * 0.005 + mesh.position.x * 0.1) * 5
        mesh.position.y += (mesh.userData.originalY - mesh.position.y + floatOffset) * 0.05

        // Hover effect
        if (interactive) {
          const raycaster = new THREE.Raycaster()
          raycaster.setFromCamera(mouseRef.current, camera)
          const intersects = raycaster.intersectObject(mesh)

          if (intersects.length > 0) {
            mesh.material.emissiveIntensity = 0.8
            mesh.scale.y = 1.05
          } else {
            mesh.material.emissiveIntensity = 0.2
            mesh.scale.y = 1
          }
        }
      })

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    // Store original Y position
    meshesRef.current.forEach((mesh) => {
      mesh.userData.originalY = mesh.position.y
    })

    animate()
    setIsLoading(false)

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth
        const newHeight = containerRef.current.clientHeight
        camera.aspect = newWidth / newHeight
        camera.updateProjectionMatrix()
        renderer.setSize(newWidth, newHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [width, height, data, colorScheme, rotation, interactive])

  return (
    <div className="data-3d-landscape-container" style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#0ff',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Loading 3D Landscape...
        </div>
      )}
    </div>
  )
}

export default Data3DLandscape
