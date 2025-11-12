"use client";

import React, { useState } from "react";
import Script from "dangerous-html/react";
import { Helmet } from "react-helmet";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./dashboard-styles.css";

const UserDashboard = (props) => {
    const [activeTab, setActiveTab] = useState("appointments");

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
    };

    return (
        <div className="user-dashboard-container">
            <Helmet>
                <title>User Dashboard - Beauty Lab</title>
                <meta property="og:title" content="User Dashboard - Beauty Lab" />
            </Helmet>

            <Navbar />

            <main className="user-dashboard-main">
                <div className="dashboard-container">
                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        <button
                            className={`tab-button ${
                                activeTab === "appointments" ? "active" : ""
                            }`}
                            onClick={() => handleTabClick("appointments")}
                            aria-selected={activeTab === "appointments"}
                        >
                            My Appointments
                        </button>
                        <button
                            className={`tab-button ${
                                activeTab === "loyalty" ? "active" : ""
                            }`}
                            onClick={() => handleTabClick("loyalty")}
                            aria-selected={activeTab === "loyalty"}
                        >
                            Loyalty & Coupons
                        </button>
                        <button
                            className={`tab-button ${
                                activeTab === "invite" ? "active" : ""
                            }`}
                            onClick={() => handleTabClick("invite")}
                            aria-selected={activeTab === "invite"}
                        >
                            Invite Friends
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content-wrapper">
                        {/* My Appointments Tab */}
                        {activeTab === "appointments" && (
                            <div className="tab-panel appointments-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">My Appointments</h2>
                                    <p className="panel-subtitle">
                                        Upcoming bookings and recent visits — elegantly organized
                                        for your convenience
                                    </p>
                                </header>

                                <div className="appointments-content">
                                    {/* Upcoming Appointments */}
                                    <div className="appointments-upcoming">
                                        <h3 className="section-label">Upcoming</h3>

                                        {/* Main Featured Appointment */}
                                        <article className="appointment-featured">
                                            <div className="appointment-featured-image">
                                                <div className="status-badge confirmed">Confirmed</div>
                                            </div>
                                            <div className="appointment-featured-content">
                                                <h4 className="appointment-title">Gel Manicure</h4>
                                                <div className="appointment-meta">
                          <span className="appointment-date">
                            Tomorrow • 14:30 • 60 min
                          </span>
                                                    <span className="appointment-location">
                            Studio A • with Irena
                          </span>
                                                </div>
                                                <div className="appointment-actions">
                                                    <button className="btn btn-secondary">
                                                        Reschedule
                                                    </button>
                                                    <button className="btn btn-outline">Cancel</button>
                                                </div>
                                                <p className="appointment-note">
                                                    Deposit paid: €15.00 • Cancellation free up to 24
                                                    hours
                                                </p>
                                            </div>
                                        </article>

                                        {/* Additional Appointments */}
                                        <div className="appointments-list">
                                            <article className="appointment-card">
                                                <div className="appointment-date-box">
                                                    <span className="date-day">12</span>
                                                    <span className="date-month">DEC</span>
                                                </div>
                                                <div className="appointment-info">
                                                    <h4 className="appointment-name">
                                                        Luxury Pedicure
                                                    </h4>
                                                    <p className="appointment-time">
                                                        15:00 • 90 min • Studio B
                                                    </p>
                                                    <p className="appointment-staff">with Sofia</p>
                                                </div>
                                                <div className="appointment-status">
                          <span className="status-badge confirmed">
                            Confirmed
                          </span>
                                                    <button className="btn-link">Details</button>
                                                </div>
                                            </article>

                                            <article className="appointment-card">
                                                <div className="appointment-date-box">
                                                    <span className="date-day">18</span>
                                                    <span className="date-month">DEC</span>
                                                </div>
                                                <div className="appointment-info">
                                                    <h4 className="appointment-name">Gel Manicure</h4>
                                                    <p className="appointment-time">
                                                        11:30 • 60 min • Studio A
                                                    </p>
                                                    <p className="appointment-staff">with Irena</p>
                                                </div>
                                                <div className="appointment-status">
                          <span className="status-badge confirmed">
                            Confirmed
                          </span>
                                                    <button className="btn-link">Details</button>
                                                </div>
                                            </article>
                                        </div>
                                    </div>

                                    {/* Recent Visits */}
                                    <div className="appointments-recent">
                                        <h3 className="section-label">Recent Visits</h3>

                                        <div className="visits-list">
                                            <article className="visit-card">
                                                <div className="visit-info">
                                                    <h4 className="visit-name">Gel Manicure</h4>
                                                    <p className="visit-date">Nov 25, 2025 • 14:00</p>
                                                    <span className="status-badge completed">
                            Completed
                          </span>
                                                </div>
                                                <div className="visit-actions">
                                                    <button className="btn btn-outline btn-sm">
                                                        Review
                                                    </button>
                                                    <button className="btn-link">Rebook</button>
                                                </div>
                                            </article>

                                            <article className="visit-card">
                                                <div className="visit-info">
                                                    <h4 className="visit-name">Luxury Pedicure</h4>
                                                    <p className="visit-date">Nov 10, 2025 • 15:30</p>
                                                    <span className="status-badge completed">
                            Completed
                          </span>
                                                </div>
                                                <div className="visit-actions">
                                                    <button className="btn btn-outline btn-sm">
                                                        Review
                                                    </button>
                                                    <button className="btn-link">Rebook</button>
                                                </div>
                                            </article>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loyalty & Coupons Tab */}
                        {activeTab === "loyalty" && (
                            <div className="tab-panel loyalty-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Loyalty Points</h2>
                                    <p className="panel-subtitle">
                                        Your elegance, rewarded. Earn 1 point for every €1 spent.
                                    </p>
                                </header>

                                <div className="loyalty-content">
                                    <div className="loyalty-main">
                                        {/* Points Balance */}
                                        <div className="points-balance-card">
                                            <div className="points-display">
                                                <span className="points-number">238</span>
                                                <span className="points-label">Points Available</span>
                                            </div>

                                            <div className="points-progress">
                                                <div className="progress-info">
                                                    <span>238 pts</span>
                                                    <span>300 pts for €15 credit</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: "79%" }}
                                                    ></div>
                                                </div>
                                                <p className="progress-remaining">
                                                    62 points to next reward
                                                </p>
                                            </div>

                                            <div className="earning-ways">
                                                <h3 className="subsection-title">Ways to Earn</h3>
                                                <ul className="earning-list">
                                                    <li>✓ Book appointments</li>
                                                    <li>✓ Refer friends</li>
                                                    <li>✓ Birthday bonus</li>
                                                    <li>✓ Streak rewards</li>
                                                </ul>
                                            </div>

                                            <div className="redemption-section">
                                                <h3 className="subsection-title">Redeem Points</h3>
                                                <p className="redemption-text">
                                                    Convert points into coupons and apply at checkout.
                                                </p>
                                                <div className="redemption-buttons">
                                                    <button className="btn btn-primary">
                                                        50 pts → €5
                                                    </button>
                                                    <button className="btn btn-primary">
                                                        120 pts → €15
                                                    </button>
                                                    <button className="btn btn-outline">Custom</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Coupons */}
                                    <div className="coupons-sidebar">
                                        <h3 className="sidebar-title">Available Coupons</h3>
                                        <p className="sidebar-text">
                                            Your active coupons are listed below. Tap to apply at
                                            checkout.
                                        </p>

                                        <div className="coupons-list">
                                            <article className="coupon-card">
                                                <div className="coupon-icon">🎁</div>
                                                <div className="coupon-details">
                                                    <h4 className="coupon-title">€5 Off</h4>
                                                    <p className="coupon-description">
                                                        50 pts redemption
                                                    </p>
                                                    <p className="coupon-code">BLAB5</p>
                                                    <p className="coupon-expiry">
                                                        Expires: Apr 15, 2026
                                                    </p>
                                                </div>
                                                <div className="coupon-actions">
                                                    <button className="btn btn-outline btn-sm">
                                                        Copy
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm">
                                                        Apply
                                                    </button>
                                                </div>
                                            </article>

                                            <article className="coupon-card">
                                                <div className="coupon-icon">✨</div>
                                                <div className="coupon-details">
                                                    <h4 className="coupon-title">15% Off</h4>
                                                    <p className="coupon-description">
                                                        Luxury Manicure
                                                    </p>
                                                    <p className="coupon-code">MANILUX15</p>
                                                    <p className="coupon-expiry">
                                                        Expires: Jun 1, 2026
                                                    </p>
                                                </div>
                                                <div className="coupon-actions">
                                                    <button className="btn btn-outline btn-sm">
                                                        Copy
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm">
                                                        Apply
                                                    </button>
                                                </div>
                                            </article>

                                            <article className="coupon-card">
                                                <div className="coupon-icon">🎁</div>
                                                <div className="coupon-details">
                                                    <h4 className="coupon-title">€15 Off</h4>
                                                    <p className="coupon-description">
                                                        120 pts redemption
                                                    </p>
                                                    <p className="coupon-code">BLAB15</p>
                                                    <p className="coupon-expiry">
                                                        Expires: May 30, 2026
                                                    </p>
                                                </div>
                                                <div className="coupon-actions">
                                                    <button className="btn btn-outline btn-sm">
                                                        Copy
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm">
                                                        Apply
                                                    </button>
                                                </div>
                                            </article>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'invite' && (
                            <div className="tab-panel invite-panel active">
                                <div className="invite-content">
                                    <div className="invite-hero">
                                        <h2 className="invite-title">Invite Friends & Earn</h2>
                                        <p className="invite-subtitle">Share your code and reward yourself with salon credit. You both earn €5.</p>
                                        <div className="invite-code-section">
                                            <span className="code-label">YOUR INVITE CODE</span>
                                            <div className="code-display">BEAUTY238</div>
                                            <div className="code-actions">
                                                <button className="btn btn-primary"><span>📤</span> Share</button>
                                                <button className="btn btn-outline"><span>📋</span> Copy Code</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="invite-body">
                                        <div className="how-it-works">…</div>
                                        <div className="share-section">…</div>
                                        <div className="message-editor">…</div>
                                        <div className="referral-stats">…</div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserDashboard;
