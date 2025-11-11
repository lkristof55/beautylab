"use client";

import React from "react";

export default function GallerySection() {
    return (
        <section id="gallery" className="gallery-section">
            <div className="gallery-panel">
                <div className="gallery-header">
                    <h2 className="section-title">Naš rad</h2>
                    <p className="section-subtitle">
                        Izbor najljepših trenutaka iz našeg salona: manikura, pedikura, šminkanje i tretmani depilacije.
                    </p>
                </div>

                <div className="masonry-gallery">
                    {/* 1 */}
                    <article className="gallery-card">
                        <button aria-label="View manicure details" className="card-media">
                            <img
                                alt="Elegant red manicure in salon setting"
                                src="https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Classic Gel</span>
                            </div>
                        </button>
                    </article>

                    {/* 2 */}
                    <article className="gallery-card">
                        <button aria-label="View pedicure details" className="card-media">
                            <img
                                alt="Professional pedicure treatment"
                                src="https://images.pexels.com/photos/17056222/pexels-photo-17056222.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Pedicure</span>
                            </div>
                        </button>
                    </article>

                    {/* 3 */}
                    <article className="gallery-card">
                        <button aria-label="View brow treatment details" className="card-media">
                            <img
                                alt="Eyebrow shaping treatment"
                                src="https://images.pexels.com/photos/5128259/pexels-photo-5128259.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Brow Sculpting</span>
                            </div>
                        </button>
                    </article>

                    {/* 4 */}
                    <article className="gallery-card featured">
                        <button aria-label="View featured nail art details" className="card-media">
                            <img
                                alt="Manicure color selection in beauty salon"
                                src="https://images.pexels.com/photos/3997390/pexels-photo-3997390.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Featured Collection</span>
                            </div>
                        </button>
                    </article>

                    {/* 5 */}
                    <article className="gallery-card">
                        <button aria-label="View lash treatment details" className="card-media">
                            <img
                                alt="Professional eyelash extensions application"
                                src="https://images.pexels.com/photos/5128182/pexels-photo-5128182.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Lash Lift</span>
                            </div>
                        </button>
                    </article>

                    {/* 6 */}
                    <article className="gallery-card">
                        <button aria-label="View minimalist manicure details" className="card-media">
                            <img
                                alt="Minimalistic manicure with red polish"
                                src="https://images.pexels.com/photos/3997388/pexels-photo-3997388.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Minimalist Art</span>
                            </div>
                        </button>
                    </article>

                    {/* 7 */}
                    <article className="gallery-card">
                        <button aria-label="View nature nail art" className="card-media">
                            <img
                                alt="Stylish green manicure with leaf design"
                                src="https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Nature-Inspired</span>
                            </div>
                        </button>
                    </article>

                    {/* 8 */}
                    <article className="gallery-card">
                        <button aria-label="View lash tinting" className="card-media">
                            <img
                                alt="Eyelash tint and beauty tools"
                                src="https://images.pexels.com/photos/5128262/pexels-photo-5128262.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Lash Tinting</span>
                            </div>
                        </button>
                    </article>

                    {/* 9 */}
                    <article className="gallery-card">
                        <button aria-label="View pedicure session details" className="card-media">
                            <img
                                alt="Detailed pedicure session with pink polish"
                                src="https://images.pexels.com/photos/18441299/pexels-photo-18441299.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Pink Perfection</span>
                            </div>
                        </button>
                    </article>
                </div>
            </div>
        </section>
    );
}
