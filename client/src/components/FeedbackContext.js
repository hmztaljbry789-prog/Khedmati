import { createContext, useContext } from "react";

const FeedbackContext = createContext(null);

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (context) return context;

    // Safe fallback if a component is rendered outside the provider.
    return {
        toast: (message) => window.alert(message),
        confirm: (message) => Promise.resolve(window.confirm(message)),
    };
}

export default FeedbackContext;
