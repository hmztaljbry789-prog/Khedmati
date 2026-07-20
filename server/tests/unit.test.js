import test from "node:test";
import assert from "node:assert/strict";

import { getDistance, getCityCoordinates } from "../data/palestineCities.js";
import { clampPrice } from "../utils/price.js";
import { validateRegistrationInput } from "../utils/validate.js";

// ── Distance (Haversine) ──

test("getDistance: zero for identical points", () => {
    assert.equal(getDistance(31.9, 35.2, 31.9, 35.2), 0);
});

test("getDistance: Nablus to Ramallah is ~35 km and symmetric", () => {
    const d1 = getDistance(32.2211, 35.2544, 31.9029, 35.2062);
    const d2 = getDistance(31.9029, 35.2062, 32.2211, 35.2544);
    assert.ok(d1 > 25 && d1 < 45, `unexpected distance ${d1}`);
    assert.ok(Math.abs(d1 - d2) < 1e-9);
});

test("getDistance: missing coordinates yield Infinity", () => {
    assert.equal(getDistance(null, null, 31.9, 35.2), Infinity);
});

// ── City matching ──

test("getCityCoordinates: matches Arabic and English city names", () => {
    assert.ok(getCityCoordinates("شارع رفيديا، نابلس"));
    assert.ok(getCityCoordinates("Main St, Nablus"));
    assert.equal(getCityCoordinates("nowhere special"), null);
});

// ── Price clamping ──

test("clampPrice: keeps the value inside the allowed range", () => {
    assert.equal(clampPrice(50, { min: 60, max: 100 }), 60);
    assert.equal(clampPrice(150, { min: 60, max: 100 }), 100);
    assert.equal(clampPrice(80, { min: 60, max: 100 }), 80);
    assert.equal(clampPrice("abc", { min: 1 }), null);
});

// ── Registration validation ──

test("validateRegistrationInput: accepts valid input", () => {
    assert.equal(
        validateRegistrationInput({
            first_name: "أحمد",
            last_name: "خالد",
            phone: "0599999999",
            email: "a@b.com",
            password: "12345678",
        }),
        null
    );
});

test("validateRegistrationInput: rejects weak or malicious input", () => {
    // Too-short password
    assert.ok(
        validateRegistrationInput({
            first_name: "أ",
            last_name: "ب",
            phone: "0599999999",
            email: "a@b.com",
            password: "1234567",
        })
    );
    // NoSQL-injection style object instead of a string
    assert.ok(
        validateRegistrationInput({
            first_name: "أ",
            last_name: "ب",
            phone: { $gt: "" },
            email: "a@b.com",
            password: "12345678",
        })
    );
    // Missing everything
    assert.ok(validateRegistrationInput({}));
});
