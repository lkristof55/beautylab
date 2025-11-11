export default function HeroSection() {
    return (
        <section className="hero-section">
            {/* Background Image */}
            <div
                className="hero-background"
                style={{
                    backgroundImage: "url('/images/salon-bg.jpg')", // Stavi svoju sliku u /public/images/
                }}
            />

            {/* Dark Overlay / Scrim */}
            <div className="hero-scrim" />

            {/* Hero Content */}
            <div className="hero-content">
                <div className="glass-panel">
                    <h1 className="hero-title">Beauty Lab by Irena</h1>
                    <p className="hero-subtitle">
                        Beauty is the illumination of your soul
                    </p>
                    <p className="hero-intro">
                        Doživi svoj trenutak luksuza i mira. Dobrodošla u Beauty Lab by Irena.
                    </p>
                    <button
                        type="button"
                        aria-label="Rezerviraj termin"
                        className="btn btn-primary btn-lg"
                    >
                        Rezerviraj termin
                    </button>
                </div>
            </div>
        </section>
    );
}
