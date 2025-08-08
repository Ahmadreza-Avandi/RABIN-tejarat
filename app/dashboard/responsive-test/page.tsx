'use client';

import React from 'react';
import { useEffect, useState } from 'react';

export default function ResponsiveTestPage() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Only execute this on the client side
    if (typeof window !== 'undefined') {
      // Handler to call on window resize
      function handleResize() {
        // Set window width/height to state
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Call handler right away so state gets updated with initial window size
      handleResize();
      
      // Remove event listener on cleanup
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Responsive Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Window Dimensions</h2>
        <p className="mb-2">Width: <span className="font-mono">{windowSize.width}px</span></p>
        <p>Height: <span className="font-mono">{windowSize.height}px</span></p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Responsive Elements</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded">Box 1</div>
          <div className="bg-green-100 p-4 rounded">Box 2</div>
          <div className="bg-yellow-100 p-4 rounded">Box 3</div>
        </div>
        
        <div className="hidden sm:block">
          <p className="text-green-600">This text is visible on small screens and above (sm+)</p>
        </div>
        
        <div className="hidden md:block">
          <p className="text-blue-600">This text is visible on medium screens and above (md+)</p>
        </div>
        
        <div className="hidden lg:block">
          <p className="text-purple-600">This text is visible on large screens and above (lg+)</p>
        </div>
        
        <div className="block sm:hidden">
          <p className="text-red-600">This text is only visible on extra small screens (xs)</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Breakpoint Detection</h2>
        <div className="grid grid-cols-5 gap-2 text-center text-white font-bold">
          <div className="block sm:hidden bg-red-500 p-2 rounded">xs</div>
          <div className="hidden sm:block md:hidden bg-orange-500 p-2 rounded">sm</div>
          <div className="hidden md:block lg:hidden bg-green-500 p-2 rounded">md</div>
          <div className="hidden lg:block xl:hidden bg-blue-500 p-2 rounded">lg</div>
          <div className="hidden xl:block bg-purple-500 p-2 rounded">xl</div>
        </div>
      </div>
    </div>
  );
}