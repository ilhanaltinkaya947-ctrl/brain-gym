import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import { NeuralCore } from './components/NeuralCore';
import './index.css';

const NeuralCoreStandalone = () => {
  const [charge, setCharge] = useState(50);
  const [size, setSize] = useState(240);

  useEffect(() => {
    // Expose updateCharge for native to call
    (window as any).updateCharge = (value: number) => {
      setCharge(Math.max(0, Math.min(100, value)));
    };

    // Responsive sizing
    const updateSize = () => {
      const s = Math.min(window.innerWidth, window.innerHeight);
      setSize(s);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      delete (window as any).updateCharge;
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      overflow: 'hidden',
    }}>
      <NeuralCore size={size} brainCharge={charge} />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<NeuralCoreStandalone />);
