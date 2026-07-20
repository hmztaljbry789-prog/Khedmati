import Hero from "../components/Hero";
import ServicesSection from "../components/ServicesSection";
import HowItWorks, { CtaBanner } from "../components/HowItWorks";

export default function HomePage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <Hero />
            <HowItWorks />
            <ServicesSection />
            <CtaBanner />
        </div>
    );
}
