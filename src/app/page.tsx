import HeroSection from "@/components/HeroSection";
import BookingSection from "@/components/BookingSection";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";

export default function Home() {
    return (
        <main>
            <HeroSection />
            <GallerySection />
            <BookingSection />
        </main>
    );
}
