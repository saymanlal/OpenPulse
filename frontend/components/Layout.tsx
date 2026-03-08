'use client';

import Header from './Header';
import Inspector from './Inspector';
import Canvas3D from './Canvas3D';

export default function Layout() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Header />
      
      <main className="absolute inset-0 top-16">
        <Canvas3D />
      </main>
      
      <Inspector />
    </div>
  );
}