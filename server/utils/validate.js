// Shared input validation helpers.
export const MIN_PASSWORD_LENGTH = 8;

// Returns an error message string, or null when the input is valid.
// Only primitive string values are accepted, which also protects the
// queries downstream from NoSQL-injection payloads like { $gt: "" }.
export function validateRegistrationInput(input = {}) {
    const { first_name, last_name, phone, email, password } = input;
    const fields = { first_name, last_name, phone, email, password };
    for (const [name, value] of Object.entries(fields)) {
        if (value === undefined || value === null || value === "") {
            return "All fields are required";
        }
        if (typeof value !== "string") {
            return `Invalid value for ${name}`;
        }
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }
    if (!/^\d{10}$/.test(phone)) {
        return "Phone number must be 10 digits long";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Invalid email address";
    }
    return null;
}

// Coerce request values to plain strings (empty string when not a string).
export const asString = (v) => (typeof v === "string" ? v : "");
