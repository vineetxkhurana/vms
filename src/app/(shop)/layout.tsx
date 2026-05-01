import Navbar from '@/components/ui/Navbar'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#050d1a', position: 'relative' }}>
      {/* Persistent dot grid */}
      <div
        className="dot-grid"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />
      <Navbar />
      <div className="page-enter" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
