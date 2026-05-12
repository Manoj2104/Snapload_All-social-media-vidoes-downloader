'use client';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

export const useScrollReveal = () => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const revealElements = document.querySelectorAll('[data-reveal]');
    
    revealElements.forEach((el) => {
      const direction = el.getAttribute('data-reveal-direction') || 'up';
      const delay = parseFloat(el.getAttribute('data-reveal-delay') || '0');
      
      let fromVars = {
        opacity: 0,
        y: direction === 'up' ? 24 : direction === 'down' ? -24 : 0,
        x: direction === 'left' ? 24 : direction === 'right' ? -24 : 0,
      };

      gsap.fromTo(el, 
        fromVars,
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.8,
          delay: delay,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    });
  }, []);
};
