import { createContext } from "react";

// Shared cart state lives outside the provider component so CartContext.jsx
// can export components only (required by React Fast Refresh).
const CartContext = createContext(null);

export default CartContext;
