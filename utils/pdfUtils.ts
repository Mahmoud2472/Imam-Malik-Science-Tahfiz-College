import { jsPDF } from "jspdf";
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL } from "../constants";

/**
 * Imam Malik Science & Tahfiz College - PDF Branding Utility
 * 
 * To ensure the logo from the Google Photos link (https://photos.app.goo.gl/Codyzks3AD5iZgqw9) 
 * displays in all PDFs, we use a high-resolution crest placeholder. 
 * If you have a direct URL (ending in .png or .jpg), replace OFFICIAL_LOGO_URL below.
 */
const OFFICIAL_LOGO_URL = "https://api.dicebear.com/7.x/initials/svg?seed=IMST&backgroundColor=1e3a8a&fontFamily=Inter&fontWeight=700&fontSize=40";

// Helper to fetch QR code image as base64 from a secure generator
const generateQrDataUrl = (text: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
};

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Loads the official school logo. 
 * Priority: 1. Local /images/logo.jpg, 2. Global Branding URL, 3. Initials Fallback.
 */
export const loadLogo = async (): Promise<string> => {
    try {
        // Try local asset first
        const localLogo = '/images/logo.jpg';
        const response = await fetch(localLogo);
        if (response.ok) return await getBase64ImageFromUrl(localLogo);
    } catch (e) {}
    
    // Fallback to official branding generator
    return await getBase64ImageFromUrl(OFFICIAL_LOGO_URL);
};

export const addPdfHeader = async (doc: jsPDF, title: string, subTitle?: string): Promise<number> => {
    // Header background bar for a professional look
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 48, 'F');

    // Branding Logo - consistently used in all PDF downloads
    try {
        const logoData = await loadLogo();
        // Check if it's SVG or raster
        const format = logoData.includes('svg') ? 'SVG' : 'JPEG';
        doc.addImage(logoData, format, 15, 8, 30, 30);
    } catch (e) {
        // Final fallback: Draw a blue circle with text if image loading fails completely
        doc.setDrawColor(30, 58, 138);
        doc.setFillColor(30, 58, 138);
        doc.circle(30, 23, 14, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text("IMST", 30, 25, { align: "center" });
    }

    // Security & Verification QR Code (Integrated for all official documents)
    const qrUrl = generateQrDataUrl(`${SCHOOL_NAME} | ${title} | Verified by IMST Portal`);
    try {
        const qrBase64 = await getBase64ImageFromUrl(qrUrl);
        doc.addImage(qrBase64, 'PNG', 175, 8, 20, 20);
        doc.setFontSize(6);
        doc.setTextColor(100);
        doc.text("SECURE VERIFY", 185, 30, { align: "center" });
    } catch (e) {}

    // Institution Name
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138); 
    doc.setFontSize(18);
    doc.text(SCHOOL_NAME.toUpperCase(), 115, 18, { align: "center" });

    // Address & Contact Information
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); 
    doc.setFont("helvetica", "normal");
    doc.text(SCHOOL_ADDRESS, 115, 25, { align: "center" });
    doc.text(`Phone: ${SCHOOL_PHONE} | Email: ${SCHOOL_EMAIL}`, 115, 30, { align: "center" });

    // Document Type / Title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 115, 42, { align: "center" });

    if (subTitle) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(subTitle, 115, 48, { align: "center" });
    }

    // Divider Line
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.8);
    doc.line(15, 50, 195, 50);

    return 65; 
};

export const generateAdmissionLetter = async (studentName: string, regNo: string, classLevel: string) => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "PROVISIONAL ADMISSION LETTER");
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    let y = yStart + 15;
    
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, y);
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.text("OFFER OF PROVISIONAL ADMISSION", 105, y, { align: "center" });
    y += 15;
    
    doc.setFont("helvetica", "normal");
    const letterBody = [
        `Dear ${studentName.toUpperCase()},`,
        "",
        `We are pleased to inform you that you have been offered provisional admission into ${SCHOOL_NAME} for the 2024/2025 academic session to study in ${classLevel}.`,
        "",
        `Your Registration Number is: ${regNo || 'PENDING'}`,
        "",
        "This offer is subject to the verification of your original documents and payment of the required school fees as outlined in the prospectus.",
        "",
        "We welcome you to our community and look forward to your contributions to the academic and moral excellence of our institution.",
        "",
        "Yours faithfully,",
    ];
    
    letterBody.forEach(line => {
        if (line === "") { y += 5; }
        else {
            const splitLines = doc.splitTextToSize(line, 180);
            doc.text(splitLines, 15, y);
            y += (splitLines.length * 6);
        }
    });
    
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("__________________________", 15, y);
    y += 5;
    doc.text("Registrar", 15, y);
    
    const qrUrl = generateQrDataUrl(`ADMISSION_VERIFIED: ${studentName} | ${regNo} | ${SCHOOL_NAME}`);
    try {
        const qrBase64 = await getBase64ImageFromUrl(qrUrl);
        doc.addImage(qrBase64, 'PNG', 160, 240, 30, 30);
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(7);
        doc.text("OFFICIAL ADMISSION SEAL", 175, 275, { align: "center" });
    } catch (e) {}

    // Page Border for Authenticity
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    doc.save(`Admission_Letter_${studentName.replace(/\s/g, '_')}.pdf`);
};

export const generateReceipt = async (data: {
    receiptType: string;
    studentName: string;
    regNo?: string;
    amount: string;
    reference: string;
    date: string;
    term?: string;
    session?: string;
}) => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, data.receiptType, `Ref: ${data.reference}`);
    
    // Background Watermark
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL RECEIPT", 105, 150, { align: "center", angle: 45 });
    
    // Detailed Content Box
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yStart + 5, 180, 110, 3, 3, 'FD');
    
    doc.setTextColor(0);
    doc.setFontSize(11);
    let y = yStart + 20;
    const addLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(value || "N/A", 85, y);
        y += 12;
        doc.setDrawColor(240);
        doc.line(25, y - 8, 185, y - 8);
    };

    addLine("Transaction Date:", data.date);
    addLine("Payment Reference:", data.reference);
    addLine("Student Name:", data.studentName.toUpperCase());
    if (data.regNo) addLine("Registration No:", data.regNo);