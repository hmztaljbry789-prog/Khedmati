import { AnimatePresence, motion } from "framer-motion";

// All styles are inline so the app splash screen never depends on a CSS
// framework being present.
const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "var(--bg)",
    color: "var(--text)",
};

const innerStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
};

const brandRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
};

const iconBoxStyle = {
    width: 72,
    height: 72,
    borderRadius: 22,
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--shadow-blue)",
};

const titleStyle = {
    fontSize: 56,
    fontFamily: "var(--font-display)",
    color: "var(--text)",
};

const barTrackStyle = {
    width: 224,
    height: 4,
    marginTop: 22,
    borderRadius: 99,
    overflow: "hidden",
    background: "var(--glass-bg)",
    border: "1px solid var(--border)",
};

const barFillStyle = {
    height: "100%",
    borderRadius: 99,
    background: "linear-gradient(90deg, var(--blue), var(--cyan))",
};

const fadeFrom = { opacity: 0 };
const fadeTo = { opacity: 1 };
const riseFrom = { opacity: 0, y: 20 };
const riseTo = { opacity: 1, y: 0 };
const popFrom = { scale: 0.5, rotate: -15 };
const popTo = { scale: 1, rotate: 0 };
const scaleFrom = { scale: 0.5 };
const scaleTo = { scale: 1 };
const springT = { duration: 0.5, type: "spring" };
const riseT = { duration: 0.8 };
const barDelayT = { delay: 0.3 };
const barFrom = { width: "0%" };
const barTo = { width: "100%" };
const barT = { duration: 6, ease: "easeInOut" };

export default function Loader() {
    return (
        <div style={overlayStyle}>
            <AnimatePresence>
                <motion.div
                    style={innerStyle}
                    initial={fadeFrom}
                    animate={fadeTo}
                    exit={fadeFrom}
                >
                    <motion.div
                        style={brandRowStyle}
                        initial={riseFrom}
                        animate={riseTo}
                        transition={riseT}
                    >
                        <motion.div
                            style={iconBoxStyle}
                            initial={popFrom}
                            animate={popTo}
                            transition={springT}
                        >
                            <img src="/logo-192.png" alt="" width="64" height="64" />
                        </motion.div>
                        <motion.h1
                            className="logo"
                            style={titleStyle}
                            initial={scaleFrom}
                            animate={scaleTo}
                            transition={springT}
                        >
                            خدمتي
                        </motion.h1>
                    </motion.div>

                    <motion.div
                        style={barTrackStyle}
                        initial={riseFrom}
                        animate={riseTo}
                        transition={barDelayT}
                    >
                        <motion.div
                            style={barFillStyle}
                            initial={barFrom}
                            animate={barTo}
                            transition={barT}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
