import React, {useEffect, useRef, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

let mermaidPromise: Promise<any> | null = null;
let mermaidInitialized = false;

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => m.default);
  }
  return mermaidPromise;
}

function MermaidBlock({code, containerId}: {code: string; containerId: string}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    getMermaid().then(async (mermaid) => {
      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
          fontFamily: 'inherit',
          flowchart: {htmlLabels: true, useMaxWidth: true, curve: 'basis'},
          sequence: {useMaxWidth: true, wrap: true},
        });
        mermaidInitialized = true;
      }

      try {
        const id = `mermaid-svg-${containerId}`;
        const {svg} = await mermaid.render(id, code.trim());
        if (ref.current) {
          ref.current.innerHTML = svg;
          // Apply styles to the SVG
          const svgEl = ref.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
        }
      } catch (err) {
        console.warn('Mermaid render error:', err);
        if (ref.current) {
          ref.current.innerHTML = `<pre style="color:red;font-size:12px;white-space:pre-wrap">Mermaid Error: ${String(err)}\n\n${code}</pre>`;
        }
      }
    });
  }, [code, containerId]);

  return (
    <div
      ref={ref}
      className="mermaid-container"
      style={{textAlign: 'center', margin: '1.5rem 0', overflow: 'auto'}}
    >
      <div style={{padding: '1rem', color: '#666', fontSize: '14px'}}>
        Loading diagram...
      </div>
    </div>
  );
}

function MermaidManager() {
  const [blocks, setBlocks] = useState<{code: string; id: string}[]>([]);
  const processedSet = useRef(new Set<string>());

  useEffect(() => {
    const processBlocks = () => {
      const codes = document.querySelectorAll('code.language-mermaid');
      const newBlocks: {code: string; id: string}[] = [];
      let changed = false;

      codes.forEach((el, i) => {
        const pre = el.closest('pre');
        if (!pre) return;

        const id = `m-${i}-${pre.textContent?.length || 0}`;
        if (processedSet.current.has(id)) {
          // Already processed, check if container exists
          const container = pre.parentElement?.querySelector('.mermaid-container');
          if (container) return;
        }

        const text = el.textContent || '';
        if (!text.trim()) return;

        processedSet.current.add(id);
        newBlocks.push({code: text, id});
        changed = true;

        // Create container after the pre element
        const container = document.createElement('div');
        container.className = 'mermaid-wrapper';
        container.setAttribute('data-mermaid-id', id);
        pre.style.display = 'none';
        pre.parentElement?.insertBefore(container, pre.nextSibling);

        // Render React into container
        const root = (window as any).__mermaid_roots = (window as any).__mermaid_roots || {};
        if (root[id]) {
          root[id].unmount();
        }
        // Use createRoot dynamically
        import('react-dom/client').then(({createRoot}) => {
          const r = createRoot(container);
          root[id] = r;
          r.render(<MermaidBlock code={text} containerId={id} />);
        });
      });
    };

    // Initial processing
    const timer = setTimeout(processBlocks, 200);

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(processBlocks, 200);
    });
    observer.observe(document.body, {childList: true, subtree: true});

    // Re-process on route change
    const handleRoute = () => {
      processedSet.current.clear();
      setTimeout(processBlocks, 300);
    };
    window.addEventListener('popstate', handleRoute);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('popstate', handleRoute);
    };
  }, []);

  return null;
}

export default function MermaidRenderer(): React.ReactElement {
  return (
    <BrowserOnly fallback={null}>
      {() => <MermaidManager />}
    </BrowserOnly>
  );
}
