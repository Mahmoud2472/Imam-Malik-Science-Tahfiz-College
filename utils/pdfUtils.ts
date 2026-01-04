
import { jsPDF } from "jspdf";
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL } from "../constants";

export const loadLogo = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = '/images/logo.jpg';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
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
    const yStart = await addPdfHeader(doc, data.receiptType);
    
    // Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL RECEIPT", 105, 150, { align: "center", angle: 45 });
    
    // Content Box
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yStart + 5, 180, 100, 3, 3, 'FD');
    
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
    y = yStart + 120;
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("This is a computer-generated receipt. No signature is required.", 105, y, { align: "center" });
    doc.text(`For inquiries: ${SCHOOL_EMAIL} | ${SCHOOL_PHONE}`, 105, y + 5, { align: "center" });
    
    // QR placeholder / Border
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);

    doc.save(`Receipt_${data.reference}.pdf`);
};
