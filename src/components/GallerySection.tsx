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
                        <button aria-label="Pogledaj detalje manikure" className="card-media">
                            <img
                                alt="Elegantna crvena manikura u salonskom okruženju"
                                src="https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Klasični Gel</span>
                            </div>
                        </button>
                    </article>

                    {/* 2 */}
                    <article className="gallery-card">
                        <button aria-label="Pogledaj detalje pedikure" className="card-media">
                            <img
                                alt="Profesionalni tretman pedikure"
                                src="https://images.pexels.com/photos/17056222/pexels-photo-17056222.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Pedikura</span>
                            </div>
                        </button>
                    </article>

                    {/* 3 */}
                    {/* 4 */}
                    <article className="gallery-card featured">
                        <button aria-label="Pogledaj detalje istaknutog nail arta" className="card-media">
                            <img
                                alt="Izbor boje za manikuru u kozmetičkom salonu"
                                src="https://images.pexels.com/photos/3997390/pexels-photo-3997390.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Istaknuta Kolekcija</span>
                            </div>
                        </button>
                    </article>

                    {/* 5 */}
                    {/* 6 */}
                    <article className="gallery-card">
                        <button aria-label="Pogledaj detalje minimalističke manikure" className="card-media">
                            <img
                                alt="Minimalistička manikura s crvenim lakom"
                                src="https://images.pexels.com/photos/3997388/pexels-photo-3997388.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Minimalistička Umjetnost</span>
                            </div>
                        </button>
                    </article>

                    {/* 7 */}
                    <article className="gallery-card">
                        <button aria-label="Pogledaj nail art s prirodnim motivom" className="card-media">
                            <img
                                alt="Stilizirana zelena manikura s motivom lista"
                                src="https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Inspirirano Prirodom</span>
                            </div>
                        </button>
                    </article>

                    {/* 8 */}
                    {/* 9 */}
                    <article className="gallery-card">
                        <button aria-label="Pogledaj detalje sesije pedikure" className="card-media">
                            <img
                                alt="Detaljna sesija pedikure s ružičastim lakom"
                                src="https://images.pexels.com/photos/18441299/pexels-photo-18441299.jpeg?auto=compress&cs=tinysrgb&w=1500"
                                loading="lazy"
                            />
                            <div className="gallery-meta">
                                <span>Ružičasto Savršenstvo</span>
                            </div>
                        </button>
                    </article>
                </div>
            </div>
        </section>
    );
}
