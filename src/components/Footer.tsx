"use client";

import React from "react";
import "../app/globals.css";

export default function Footer() {
    return (
        <footer id="footer" className="footer">
            <div className="footer__container">
                <div className="footer__brand">
                    <h3 className="footer__brand-title">Beauty Lab by Irena</h3>
                    <p className="footer__brand-tagline">
                        Your new favorite appointment — in 3 clicks.
                    </p>
                    <p className="footer__brand-description">
                        Experience luxury beauty services in an elegant, intimate setting.
                        We specialize in manicure, pedicure, waxing, and brows & lashes
                        treatments.
                    </p>
                </div>

                <div className="footer__info-grid">
                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Contact</h4>
                        <ul className="footer__info-list">
                            <li>
                                📞 +1 (234) 567-890
                            </li>
                            <li>
                                ✉️ hello@beautylabbyirena.com
                            </li>
                            <li>
                                📍 123 Beauty Street, New York, NY 10001
                            </li>
                        </ul>
                    </div>

                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Hours</h4>
                        <ul className="footer__info-list">
                            <li>Monday - Friday: 9:00 AM - 7:00 PM</li>
                            <li>Saturday: 10:00 AM - 6:00 PM</li>
                            <li>Sunday: Closed</li>
                        </ul>
                    </div>

                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Services</h4>
                        <ul className="footer__info-list">
                            <li>Manicure</li>
                            <li>Pedicure</li>
                            <li>Waxing</li>
                            <li>Brows & Lashes</li>
                        </ul>
                    </div>

                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Quick Links</h4>
                        <ul className="footer__info-list">
                            <li><a href="/">Home</a></li>
                            <li><a href="/appointments">Book Appointment</a></li>
                            <li><a href="/radovi">Our Work</a></li>
                            <li><a href="/about">About Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer__divider"></div>

                <div className="footer__bottom">
                    <div className="footer__social">
                        <span className="footer__social-label">Follow us</span>
                        <div className="footer__social-links">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="footer__social-link"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="footer__social-link"
                            >
                                <i className="fab fa-facebook-f"></i>
                            </a>
                        </div>
                    </div>

                    <div className="footer__copyright">
                        <p>© 2025 Beauty Lab by Irena. All rights reserved.</p>
                        <div className="footer__legal-links">
                            <a href="/privacy">Privacy Policy</a>
                            <span>|</span>
                            <a href="/terms">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
