import React from 'react';
import MermaidRenderer from '@site/src/components/MermaidRenderer';

export default function Root({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <MermaidRenderer />
    </>
  );
}
