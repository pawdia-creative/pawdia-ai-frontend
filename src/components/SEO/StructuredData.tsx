import { useEffect } from 'react';

interface StructuredDataProps {
  data: object;
  type?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data, type }) => {
  useEffect(() => {
    const scriptId = `structured-data-${type || 'default'}`;
    
    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data, type]);

  return null;
};
// Note: generator helpers live in `structuredDataGenerators.ts` to keep this file focused on the component.

