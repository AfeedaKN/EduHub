import React from 'react';

export const GallerySection: React.FC = () => {
  const photos = [
    {
      className: 'gallery-item-1',
      src: '/images/hero-campus.jpg',
      alt: 'Main historic and modern campus architecture with expansive gardens',
      caption: 'Main Academic Campus & Grounds',
    },
    {
      className: 'gallery-item-2',
      src: '/images/classroom-learning.jpg',
      alt: 'Students collaborating in an elementary and middle school classroom',
      caption: 'Collaborative Classroom Learning',
    },
    {
      className: 'gallery-item-3',
      src: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      alt: 'Students exploring practical STEM experiments in science laboratory',
      caption: 'Science & Discovery Laboratories',
    },
    {
      className: 'gallery-item-4',
      src: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80',
      alt: 'Quiet reading and research spaces in modern library',
      caption: 'Central Library & Research Hub',
    },
    {
      className: 'gallery-item-5',
      src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
      alt: 'Faculty mentor coaching students through challenging lessons',
      caption: 'Dedicated Faculty Mentorship',
    },
    {
      className: 'gallery-item-6',
      src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
      alt: 'Extracurricular athletics and team activities',
      caption: 'Athletics & Creative Arts',
    },
  ];

  return (
    <section className="section-padding gallery-section" id="school-life">
      <div className="container">
        <div className="gallery-header">
          <span className="section-tagline">Campus & Culture</span>
          <h2 className="section-heading-lg">Every School Day Matters.</h2>
          <p className="section-desc-lg" style={{ margin: '0 auto' }}>
            A glimpse into the daily environments, academic spaces, and vibrant community that make our school special.
          </p>
        </div>

        <div className="editorial-gallery-grid" aria-label="School life photography gallery">
          {photos.map((item, index) => (
            <div key={index} className={`gallery-item ${item.className}`}>
              <img src={item.src} alt={item.alt} loading="lazy" />
              <div className="gallery-item-overlay">
                <span className="gallery-item-caption">{item.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
