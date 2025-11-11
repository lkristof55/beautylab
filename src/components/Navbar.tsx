"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const nav = document.getElementById("navigationMain");
        const handleScroll = () => {
            const currentScroll = window.pageYOffset;
            if (nav) {
                if (currentScroll > 100) {
                    nav.style.background =
                        "linear-gradient(to bottom, rgba(247,243,239,0.98) 0%, rgba(247,243,239,0.85) 50%, rgba(247,243,239,0) 100%)";
                    nav.style.backdropFilter = "blur(25px)";
                } else {
                    nav.style.background =
                        "linear-gradient(to bottom, rgba(247,243,239,0.85) 0%, rgba(247,243,239,0.6) 50%, rgba(247,243,239,0) 100%)";
                    nav.style.backdropFilter = "blur(20px)";
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".navigation__profile")) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="navigation-container1">
            <nav id="navigationMain" className="navigation">
                <div className="navigation__container">
                    {/* Logo */}
                    <Link href="/" className="no-underline">
                        <div
                            aria-label="Beauty Lab by Irena Homepage"
                            className="navigation__logo"
                        >
              <span className="navigation__logo-text text-[1.2rem] font-serif tracking-wide">
                Beauty Lab{" "}
                  <span className="signature text-[1.8rem] ml-1">by Irena</span>
              </span>
                        </div>
                    </Link>

                    {/* Mobile Toggle */}
                    <button
                        id="navigationToggle"
                        aria-label="Toggle Navigation Menu"
                        aria-expanded={menuOpen}
                        className="navigation__toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            >
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            >
                                <path d="M4 5h16M4 12h16M4 19h16" />
                            </svg>
                        )}
                    </button>

                    {/* Menu */}
                    <div
                        id="navigationMenu"
                        className={`navigation__menu ${
                            menuOpen ? "navigation__menu--open" : ""
                        }`}
                    >
                        <ul className="navigation__list">
                            <li className="navigation__item">
                                <Link href="#services" className="navigation__link">
                                    <span>Services</span>
                                </Link>
                            </li>
                            <li className="navigation__item">
                                <Link href="#about" className="navigation__link">
                                    <span>About</span>
                                </Link>
                            </li>
                            <li className="navigation__item">
                                <Link href="#gallery" className="navigation__link">
                                    <span>Gallery</span>
                                </Link>
                            </li>
                            <li className="navigation__item">
                                <Link href="#contact" className="navigation__link">
                                    <span>Contact</span>
                                </Link>
                            </li>
                        </ul>

                        {/* Actions */}
                        <div className="navigation__actions">
                            {!user ? (
                                <>
                                    <Link
                                        href="/login"
                                        className="navigation__button btn btn-outline"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="navigation__button btn btn-primary"
                                    >
                                        Register
                                    </Link>
                                </>
                            ) : (
                                <div className="navigation__profile">
                                    <button
                                        aria-label="User menu"
                                        className="profile-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDropdownOpen(!dropdownOpen);
                                        }}
                                    >
                                        <i className="fa-regular fa-user"></i>
                                    </button>

                                    <div
                                        className={`profile-dropdown ${
                                            dropdownOpen ? "open" : ""
                                        }`}
                                    >
                                        <div className="profile-header">
                                            <p className="profile-name">{user.name}</p>
                                            <p className="profile-email">{user.email}</p>
                                        </div>
                                        <a href="/dashboard" className="profile-item">
                                            Profil
                                        </a>
                                        <a href="/appointments" className="profile-item">
                                            Moji termini
                                        </a>
                                        <a href="/dashboard" className="profile-item">
                                            Dashboard
                                        </a>
                                        <button onClick={logout} className="profile-item logout">
                                            Odjavi se
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
}
