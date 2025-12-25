import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaTagsProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  keywords?: string;
}

const BASE_URL = 'https://pawdia-ai.com';

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  canonical,
  ogImage = `${BASE_URL}/logo.png`,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  keywords,
}) => {
  const location = useLocation();
  const currentUrl = canonical || `${BASE_URL}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update description
    updateMetaTag('description', description);

    // Update keywords if provided
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Update robots
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', 'Pawdia AI', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Update Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:site', '@PawdiaAI');

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Update language
    document.documentElement.setAttribute('lang', 'en-US');
  }, [title, description, canonical, ogImage, ogType, twitterCard, noindex, keywords, currentUrl, location.pathname]);

  return null;
};

