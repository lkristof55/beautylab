"use client";

import React from "react";

export default function BookingSection() {
    return (
        <section id="booking" className="booking-section">
            <div className="booking-container">
                {/* Lijeva strana — naslov i intro */}
                <div className="booking-intro">
                    <h2 id="booking-onboarding-title" className="section-title">
                        Three Effortless Steps
                    </h2>
                    <p className="section-content">
                        Book in three clicks and arrive relaxed.
                    </p>
                </div>

                {/* Sredina — koraci */}
                <div className="booking-steps">
                    <ol aria-label="Booking process steps" className="steps-list">
                        <li className="step-card">
                            <div className="step-number">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <g
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M8 2v4m8-4v4"></path>
                                        <rect x="3" y="4" rx="2" width="18" height="18"></rect>
                                        <path d="M3 10h18"></path>
                                    </g>
                                </svg>
                                <span>01</span>
                            </div>
                            <div className="step-content">
                                <h3 className="step-title">Choose your service</h3>
                                <p className="step-description">
                                    Manicure, Pedicure, Waxing, Brows & Lashes. Select a signature
                                    treatment or bespoke combination tailored by Irena.
                                </p>
                            </div>
                        </li>

                        <li className="step-card">
                            <div className="step-number">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <g
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 6v6l4 2"></path>
                                        <circle r="10" cx="12" cy="12"></circle>
                                    </g>
                                </svg>
                                <span>02</span>
                            </div>
                            <div className="step-content">
                                <h3 className="step-title">Pick a time</h3>
                                <p className="step-description">
                                    Real-time availability, instant confirmation. Morning, midday
                                    or evening—reserve the moment that fits your rhythm.
                                </p>
                            </div>
                        </li>

                        <li className="step-card">
                            <div className="step-number">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M20 6L9 17l-5-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    ></path>
                                </svg>
                                <span>03</span>
                            </div>
                            <div className="step-content">
                                <h3 className="step-title">Add details & confirm</h3>
                                <p className="step-description">
                                    Preference notes, color choice, and any special requests.
                                    Secure your appointment with a single confirmation.
                                </p>
                            </div>
                        </li>
                    </ol>
                </div>

                {/* Desna strana — dodatne informacije */}
                <div className="booking-reinforcement">
                    <div className="reinforcement-content">
                        <p className="reinforcement-text">
                            A refined, streamlined path designed for discerning clients —
                            clarity, speed, and personalized luxury.
                        </p>
                        <p className="reinforcement-tips">
                            Want a matching set? Note your preferred polish shade. New to us?
                            Mention allergies or sensitivities for a flawless experience.
                        </p>
                    </div>
                    <a href="/appointments">
                        <div
                            aria-label="Start booking — three clicks"
                            className="btn booking-cta btn-primary"
                        >
                            <span>Ready in 3 clicks</span>
                        </div>
                    </a>
                </div>
            </div>
        </section>
    );
}
