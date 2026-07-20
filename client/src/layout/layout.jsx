import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Inline styles keep the page shell independent from any CSS framework, so
// every page keeps its layout even if a stylesheet fails to build/load.
const shellStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "var(--bg)",
};

const navWrapStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
};

const mainStyle = {
    flexGrow: 1,
    marginTop: 72,
    width: "100%",
    maxWidth: 1400,
    marginLeft: "auto",
    marginRight: "auto",
};

const footerStyle = {
    width: "100%",
    maxWidth: 1400,
    marginLeft: "auto",
    marginRight: "auto",
};

export default function Layout() {
    return (
        <div style={shellStyle}>
            <div style={navWrapStyle}>
                <Navbar />
            </div>
            <main className="page-container" style={mainStyle}>
                <Outlet />
            </main>
            <footer className="page-container" style={footerStyle}>
                <Footer />
            </footer>
        </div>
    );
}
