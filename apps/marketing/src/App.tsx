import { useEffect, useState } from 'react';
import Splash from './components/Splash';
import Nav from './components/Nav';
import Hero from './components/Hero';
import ProductInAction from './components/ProductInAction';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Splash visible={!booted} />
      <Nav ready={booted} />
      <main>
        <Hero ready={booted} />
        <ProductInAction />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
