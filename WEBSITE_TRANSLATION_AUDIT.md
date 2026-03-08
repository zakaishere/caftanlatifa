# Website Translation Audit

## 1. Summary
This document provides a highly granular inventory of the frontend application mapped out for internationalization (French and Arabic). Arabic introduces Right-to-Left (RTL) requirements. The codebase currently contains a mix of **hardcoded French** (e.g., in `StoreLayout` and `Products`) and **hardcoded English** (e.g., in `Checkout`). The goal is a highly professional, culturally appropriate translation of the luxury e-commerce experience without breaking the existing Next.js App Router architecture and premium UI.

## 2. Pages that need translation
*This is the exact list of routed pages containing hardcoded visible text:*
- **Homepage (`src/features/public/Home.tsx`)**: Needs translation for hero section texts, collection showcase headers, and "Découvrir la collection".
- **Product Listing (`src/features/public/products/Products.tsx`)**: "Toutes les créations", "Disponibilité", "Aucun produit trouvé", "Nouveautés", "Prix décroissant", "Pièces d'Exception", "Aucune pièce trouvée".
- **Product Detail (`src/features/public/products/ProductDetails.tsx`)**: "Création Introuvable", "Épuisé", "Veuillez sélectionner une taille", "Quantité", "Ajouté au Panier", "Qualité artisanale", "Caractéristiques", "Expédition & Livraison", return policy texts.
- **Cart (`src/features/public/cart/Cart.tsx`)**: Cart empty states, order summary text, tax disclaimers, "Checkout" buttons.
- **Checkout (`src/features/public/orders/Checkout.tsx`)**: *Note: This page is heavily hardcoded in English currently.* "Secure Checkout", "Shipping Details", "Delivery", "In-Store", "Full Name", "Phone Number", "City", "Full Address", "Summary", "Subtotal", "Shipping", "CASH ON DELIVERY", "CONFIRM ORDER", "Order Now".
- **Checkout Success (`src/features/public/orders/Checkout.tsx` - Success State)**: "Order Confirmed!", "please finalize confirmation via WhatsApp", "Référence de commande", "Confirm on WhatsApp", "Back to Home".
- **Orders History (`src/features/public/orders/MyOrders.tsx`)**: Order list statuses, headers.
- **Contact (`src/features/public/Contact.tsx`)**: "Questions sur nos créations ou votre commande ?", form labels.
- **Not Found (`src/app/[locale]/_not-found.tsx`)**: 404 error messages.

## 3. Shared components that need translation
*These components appear across multiple pages:*
- **`src/components/layout/StoreLayout.tsx`**: "L'élégance du Caftan Marocain", "Service Client", "Livraison Gratuite", "Maison de Couture", footer paragraphs, "Collections", "La Maison", "Contact" sections, "Tous droits réservés".
- **`src/components/layout/MobileBottomNav.tsx`**: Bottom icon labels.
- **`src/components/layout/MobileDrawer.tsx`**: Sidebar link names.
- **`src/components/ui/product-card.tsx`**: "Épuisé", "Aperçu rapide", "Voir détails".
- **`src/components/ui/product-quick-view.tsx`**: "Ajouté !", "Quantité", "Épuisé", "Veuillez sélectionner une taille", "Caractéristiques", "Voir plus de détails".
- **`src/components/ui/order-items-list.tsx`**: "Qté".
- **`src/lib/businessHours.ts` & `SmartBusinessHoursWidget.tsx`**: "Fermé", "Ouvert", Days of the week.

## 4. Text categories found
- **Brand Messaging (French)**: Upscale boutique phrasing like "Pièces d'Exception", "L'héritage de l'artisanat marocain sublimé par une élégance contemporaine".
- **E-commerce Actions (Mixed)**: "Confirm Order" (Checkout), "Ajouter au panier" (Products).
- **Forms & Inputs (Mixed)**: "Full Name", "City", "Address" (English in Checkout) vs "Rechercher..." (French in Header).
- **Form Error Messages (Zod)**: "Full name is required", "City is required for delivery".
- **Toast Notifications (sonner)**: "Référence copiée", "Impossible de copier".

## 5. RTL-sensitive areas
- **Carousels (`embla-carousel-react`)**: Product image galleries and home page sliders must receive a `direction="rtl"` property to allow swiping natively from right to left.
- **Absolute Positioning**: Icons placed absolutely (e.g., search icon inside the header input: `absolute left-3`) will visually break. We need to convert `left-3` to `start-3`.
- **Alignments & Spacing**: Margins like `mr-1.5` (Checkout ArrowLeft) or `ml-2` must strictly become `me-1.5` and `ms-2` (Margin End / Margin Start).
- **Icons**: Back arrows (`<ArrowLeft />` in Checkout) should point right in Arabic mode. We can use a CSS transform (`rtl:-scale-x-100`) to easily flip horizontal-directional icons.
- **Drawers (`MobileDrawer.tsx`)**: Sidebar should slide in from the right edge instead of the left edge in RTL.

## 6. Hardcoded text to extract
Currently, 100% of the UI text is hardcoded directly inside the render functions of React components or as Zod error strings. 
**Example from `Checkout.tsx`:**
```tsx
<h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Shipping Details</h1>
```
This must be moved to our dictionaries (`fr.json`, `ar.json`) and replaced with a lookup like:
```tsx
<h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t("checkout.shippingDetails.title")}</h1>
```

## 7. Dynamic content that should remain dynamic
- **Database entities**: Product Names, Variations, and Categories. These are fed by Prisma DB. Translating them falls under Content Management, not UI i18n mapping.
- **Currency values**: The formatting of prices (`centsToMad()`) should dynamically append `MAD` or `درهم` depending on locale, but the raw numbers remain dynamic.
- **WhatsApp Generation**: The checkout currently generates a WhatsApp message (`generateWhatsAppMessage()`) string in English. We should consider translating the generated message content based on the active locale so the merchant receives standard strings.

## 8. Recommended translation order
*(Safest to Riskiest based on deep scan)*

1. **Setup Core**: Build `DictionaryProvider` to pass JSON maps to Client Components via a `useTranslation()` hook.
2. **Global UI (Low Risk)**: Translate `StoreLayout.tsx`, `MobileBottomNav.tsx`, `MobileDrawer.tsx`. Address Tailwind LTR/RTL flipped classes (`ml-2` -> `ms-2`).
3. **Product Discovery UI (Medium Risk)**: Translate `product-card.tsx`, `product-quick-view.tsx`, `Products.tsx`, `ProductDetails.tsx`, and fix the Embla Carousel direction for RTL.
4. **Static Informational (Low Risk)**: `Contact.tsx`, `Home.tsx`, `businessHours.ts`.
5. **Checkout Flow (High Risk)**: `Cart.tsx`, `Checkout.tsx`. This requires translating complex Zod validation schemas (`formSchema`) and form state rendering.
6. **WhatsApp String Generation**: Adapt `generateWhatsAppMessage()` to use translated labels.
7. **Admin Dashboard**: Defer until frontend user experience is 100% stable in Arabic.

## 9. Best i18n architecture for this project
You are on Next.js 16 App Router using a heavily client-side architecture (`"use client"`). 
- **Route Segment (`/[locale]`)**: You already have the `middleware.ts` redirecting to `/[locale]/`. This is perfect.
- **Dictionary State Injection**: Since most components use React Hooks (`useForm`, `useEffect`), we cannot use Server Components to fetch dictionaries repeatedly. We MUST create an `i18nProvider` in `app/[locale]/layout.tsx` that passes the `fr.json` or `ar.json` tree into a React Context. 
- **Tailwind Native RTL**: Ensure we systematically replace all `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-` with their logical counterparts `ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`. 

## 10. Risks and notes
- **Zod Error Messages Translation**: Zod schemas are usually defined *outside* the React component, meaning they don't have access to the `useTranslation()` hook. **Risk Mitigation**: We will need to move the Zod schema definitions *inside* the React functional components (wrapped in `useMemo` for performance) so they can dynamically access Arabic or French validation messages.
- **Translation Tone Quality**: The Arabic translation must feel like a luxury boutique. 
  - *Example*: Instead of literal "Shipping Details" -> "تفاصيل الشحن", use "معلومات التوصيل" (Delivery Information).
  - *Example*: "Secure Checkout" -> "الدفع الآمن".
  - *Example*: "L'élégance du Caftan Marocain" -> "أناقة القفطان المغربي".
- **Mixed Languages Found**: The audit revealed that Checkout is built in English while the Homepage/Products are in French. The i18n refactoring will unifying everything cleanly.
