
# Imam Malik Science & Tahfiz College Portal

A modern, responsive school management portal built with React, TypeScript, and Tailwind CSS.

## 🚀 Deployment to Netlify

To deploy this portal successfully and connect it to your Supabase backend:

1.  **Build the Project**: Run `npm run build` to generate the `dist` folder.
2.  **Upload to Netlify**: Drag and drop the `dist` folder into the Netlify "Deploy" area.
3.  **Configure Environment Variables**:
    *   In Netlify, go to **Site Settings > Environment Variables**.
    *   Add `VITE_SUPABASE_URL`: `https://ywlwzbaydhnkjdoxcvby.supabase.co`
    *   Add `VITE_SUPABASE_ANON_KEY`: (Your `anon` JWT key from Supabase settings)
    *   Add `API_KEY`: (Your Google Gemini API Key for AI features)
4.  **Finalize**: Re-deploy the site for the variables to take effect.

## 📁 Image Setup Steps (Passport & Branding)

To ensure the website displays your real school photos, follow these naming and placement rules:

1.  **Folder Structure**: Create a `public/images/` folder in your project root.
2.  **Naming Convention**: Save your images with these exact names:
    *   `logo.jpg`: The official school badge.
    *   `assembly.jpg`: Main homepage banner (morning assembly).
    *   `girls.jpg`: Classroom photo (Girls section).
    *   `boy.jpg`: Featured student photo.
    *   `staff.jpg`: Staff/Teacher group photo.
3.  **Student Passports**: When adding students in the Admin Dashboard, use the "Upload Photo" button in the modal. These are saved instantly as Base64 previews.

## 🛠 Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS.
- **Backend**: Supabase (Auth & Database).
- **AI**: Google Gemini API (Report card analysis).
- **Integrations**: Paystack (Fee payments).
- **Utilities**: jsPDF (Report generation), XLSX (Bulk data import).

## 🌐 Contact
For technical support, contact the IT team at: {maitechitservices6@gmail.com}
