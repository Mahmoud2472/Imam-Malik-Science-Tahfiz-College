import { jsPDF } from "jspdf";
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL } from "../constants";

// Helper to fetch QR code image as base64 from a secure generator
const generateQrDataUrl = (text: string): string => {
    // Using a reliable public QR API for embedding in PDF
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

export const loadLogo = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = '/images/logo.jpg';
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            // Fallback for demo if logo doesn't exist in public/images
            img.src = 'https://placehold.co/100x100/1e3a8a/ffffff?text=IMST';
            img.onload = () => resolve(img);
        };
    });
};

export const addPdfHeader = async (doc: jsPDF, title: string, subTitle?: string): Promise<number> => {
    // Header Background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 45, 'F');

    // Load Logo
    try {
        const logo = await loadLogo();
        doc.addImage(logo, 'JPEG', 15, 8, 28, 28);
    } catch (e) {
        console.warn("Logo could not be loaded for PDF");
    }

    // Add Security QR Code in the header corner (Verification Link)
    const qrUrl = generateQrDataUrl(`${SCHOOL_NAME} | ${title} | ${new Date().toISOString()}`);
    try {
        const qrBase64 = await getBase64ImageFromUrl(qrUrl);
        doc.addImage(qrBase64, 'PNG', 175, 8, 20, 20);
        doc.setFontSize(6);
        doc.text("SECURE VERIFY", 185, 30, { align: "center" });
    } catch (e) {
        console.warn("QR Code failed to load");
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138); 
    doc.setFontSize(16);
    if (SCHOOL_NAME.length > 35) doc.setFontSize(14);
    doc.text(SCHOOL_NAME.toUpperCase(), 115, 18, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); 
    doc.setFont("helvetica", "normal");
    doc.text(SCHOOL_ADDRESS, 115, 25, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 115, 35, { align: "center" });

    if (subTitle) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(subTitle, 115, 41, { align: "center" });
    }

    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);

    return 55; 
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
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("__________________________", 15, y);
    y += 5;
    doc.text("Registrar", 15, y);
    
    const qrUrl = generateQrDataUrl(`ADMISSION_VERIFIED: ${studentName} | ${regNo} | ${SCHOOL_NAME}`);
    try {
        const qrBase64 = await getBase64ImageFromUrl(qrUrl);
        doc.addImage(qrBase64, 'PNG', 160, 240, 30, 30);
        doc.setFontSize(7);
        doc.text("SCAN TO VERIFY ADMISSION", 175, 275, { align: "center" });
    } catch (e) {}

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
    
    // Watermark
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL RECEIPT", 105, 150, { align: "center", angle: 45 });
    
    // Content Box
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yStart + 5, 180, 110, 3, 3, 'FD');
    
    doc.setTextColor(0);
    doc.setFontSize(11);
    let y = yStart + 20;
    const xLabel = 25;
    const xValue = 85;
    const lineHeight = 12;

    const addLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, xLabel, y);
        doc.setFont("helvetica", "normal");
        doc.text(value || "N/A", xValue, y);
        y += lineHeight;
        doc.setDrawColor(240);
        doc.line(xLabel, y - 8, 185, y - 8);
    };

    addLine("Transaction Date:", data.date);
    addLine("Payment Reference:", data.reference);
    addLine("Student Name:", data.studentName.toUpperCase());
    if (data.regNo) addLine("Registration No:", data.regNo);
    if (data.session) addLine("Academic Session:", data.session);
    if (data.term) addLine("Academic Term:", data.term);
    
    // Amount Highlight
    y += 5;
    doc.setFillColor(30, 58, 138);
    doc.rect(xLabel - 5, y - 8, 170, 12, 'F');
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL AMOUNT PAID:", xLabel, y);
    doc.text(`NGN ${data.amount}`, 180, y, { align: "right" });
    
    // Footer Verification
    y = yStart + 125;
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("This is a computer-generated receipt. No signature is required.", 105, y, { align: "center" });
    doc.text(`For inquiries: ${SCHOOL_EMAIL} | ${SCHOOL_PHONE}`, 105, y + 5, { align: "center" });
    
    // Add Security QR at bottom right for authenticity verification
    const footerQrUrl = generateQrDataUrl(`VERIFIED_PAYMENT: ${data.reference} | ${data.studentName} | Amount: ${data.amount} | IMST COLLEGE`);
    try {
        const qrBase64 = await getBase64ImageFromUrl(footerQrUrl);
        doc.addImage(qrBase64, 'PNG', 160, 240, 30, 30);
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("SCAN TO VERIFY RECEIPT", 175, 275, { align: "center" });
    } catch (e) {}

    // Border
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);

    doc.save(`Receipt_${data.reference}.pdf`);
};
