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

// Predefined structured data generators
export const generateWebApplicationSchema = (options: {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: Array<{
    name: string;
    price: string;
    priceCurrency: string;
    availability: string;
  }>;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: options.name,
    description: options.description,
    url: options.url,
    applicationCategory: options.applicationCategory,
    operatingSystem: options.operatingSystem,
    offers: options.offers.map(offer => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: `https://schema.org/${offer.availability}`,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250',
    },
  };
};

export const generateFAQPageSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

export const generateOrganizationSchema = (options: {
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint?: {
    telephone?: string;
    contactType: string;
    email?: string;
  };
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    logo: options.logo,
    sameAs: options.sameAs,
    ...(options.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...options.contactPoint,
      },
    }),
  };
};

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const generateBlogPostingSchema = (options: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: options.headline,
    description: options.description,
    image: options.image,
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    author: {
      '@type': 'Person',
      name: options.author.name,
      ...(options.author.url && { url: options.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: options.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: options.publisher.logo,
      },
    },
  };
};

