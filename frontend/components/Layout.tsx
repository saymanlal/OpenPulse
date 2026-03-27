'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Inspector from './Inspector';
import ClientCanvasWrapper from './ClientCanvasWrapper';
import NodeTooltip from './NodeTooltip';
import FrontLoading from './FrontLoading';

export default function Layout() {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  return (
    <>
      {/* Loading Screen with exit animation */}
      <AnimatePresence mode="wait">
        {!isLoadingComplete && (
          <FrontLoading onComplete={() => setIsLoadingComplete(true)} />
        )}
      </AnimatePresence>

      {/* Main Content with entrance animation */}
      <AnimatePresence>
        {isLoadingComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex min-h-screen flex-col bg-slate-950 text-slate-100"
          >
            <Header />

            <main
              className="grid flex-1"
              style={{
                height: 'calc(100vh - 57px)',
                gridTemplateColumns: 'minmax(0,1fr) 340px',
              }}
            >
              <section className="relative">
                <ClientCanvasWrapper />
                <NodeTooltip />
              </section>

              <Inspector />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}