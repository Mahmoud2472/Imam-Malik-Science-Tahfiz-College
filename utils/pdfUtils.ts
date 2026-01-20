import { jsPDF } from "jspdf";
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL } from "../constants";
import { TermResult } from "../types";

const OFFICIAL_LOGO_URL = "https://res.cloudinary.com/dswuqqfuk/image/upload/logo.jpg_imoamc.jpg";

const generateQrDataUrl = (text: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
};

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        return "";
    }
};

export const addPdfHeader = async (doc: jsPDF, title: string, subTitle?: string): Promise<number> => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 50, 'F');

    const logoBase64 = await getBase64ImageFromUrl(OFFICIAL_LOGO_URL);
    if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 15, 8, 32, 32);
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138); 
    doc.setFontSize(20);
    doc.text(SCHOOL_NAME.toUpperCase(), 115, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); 
    doc.setFont("helvetica", "normal");
    doc.text(SCHOOL_ADDRESS, 115, 27, { align: "center" });
    doc.text(`Phone: ${SCHOOL_PHONE} | Email: ${SCHOOL_EMAIL}`, 115, 33, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 115, 45, { align: "center" });

    if (subTitle) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(subTitle, 115, 50, { align: "center" });
    }

    const qrUrl = generateQrDataUrl(`${SCHOOL_NAME} | ${title} | ${new Date().toLocaleDateString()}`);
    const qrBase64 = await getBase64ImageFromUrl(qrUrl);
    if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', 175, 10, 20, 20);
        doc.setFontSize(6);
        doc.text("SCAN TO VERIFY", 185, 32, { align: "center" });
    }

    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.line(15, 52, 195, 52);

    return 60; 
};

export const generateTerminalReport = async (data: TermResult) => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "TERMINAL ACADEMIC REPORT", `${data.term} - ${data.session}`);
    
    let y = yStart + 10;
    
    // Student Info Block
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, 180, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("NAME:", 20, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text(data.studentName.toUpperCase(), 45, y + 10);
    
    doc.setFont("helvetica", "bold");
    doc.text("REG NO:", 20, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text(data.regNumber, 45, y + 18);

    doc.setFont("helvetica", "bold");
    doc.text("CLASS:", 130, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text(data.classLevel, 155, y + 10);

    doc.setFont("helvetica", "bold");
    doc.text("GENDER:", 130, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text("N/A", 155, y + 18);

    y += 35;

    // Academic Table
    const headers = ["SUBJECT", "CA (40)", "EXAM (60)", "TOTAL", "GRADE", "REMARK"];
    const colWidths = [60, 25, 25, 20, 20, 30];
    
    doc.setFillColor(30, 58, 138);
    doc.rect(15, y, 180, 10, 'F');
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    let currentX = 15;
    headers.forEach((h, i) => {
        doc.text(h, currentX + 2, y + 7);
        currentX += colWidths[i];
    });

    y += 10;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    data.results.forEach((row, idx) => {
        if (idx % 2 === 0) doc.setFillColor(248, 250, 252);
        else doc.setFillColor(255);
        doc.rect(15, y, 180, 8, 'F');
        
        let rowX = 15;
        doc.text(row.subject, rowX + 2, y + 5.5); rowX += colWidths[0];
        doc.text(row.ca.toString(), rowX + colWidths[1]/2, y + 5.5, { align: "center" }); rowX += colWidths[1];
        doc.text(row.exam.toString(), rowX + colWidths[2]/2, y + 5.5, { align: "center" }); rowX += colWidths[2];
        doc.setFont("helvetica", "bold");
        doc.text(row.total.toString(), rowX + colWidths[3]/2, y + 5.5, { align: "center" }); rowX += colWidths[3];
        doc.setFont("helvetica", "normal");
        doc.text(row.grade, rowX + colWidths[4]/2, y + 5.5, { align: "center" }); rowX += colWidths[4];
        doc.setFontSize(8);
        doc.text(row.remark, rowX + 2, y + 5.5);
        doc.setFontSize(10);
        
        y += 8;
    });

    // Performance Stats
    y += 10;
    doc.setDrawColor(30, 58, 138);
    doc.roundedRect(15, y, 180, 25, 2, 2);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL SCORE:", 25, y + 10);
    doc.text("AVERAGE:", 25, y + 18);
    doc.text("POSITION:", 120, y + 10);
    doc.text("CLASS POP:", 120, y + 18);

    doc.setFont("helvetica", "normal");
    doc.text(data.totalScore.toString(), 65, y + 10);
    doc.text(`${data.average.toFixed(1)}%`, 65, y + 18);
    doc.text(data.position, 155, y + 10);
    doc.text(data.classPopulation.toString(), 155, y + 18);

    // Comments
    y += 35;
    doc.setFont("helvetica", "bold");
    doc.text("Teacher's Remark:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.teacherComment || "A good performance, keep it up.", 15, y + 6);

    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Principal's Remark:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.principalComment || "Promoted to next class.", 15, y + 6);

    y += 30;
    doc.line(15, y, 65, y);
    doc.text("Class Teacher", 25, y + 5);
    
    doc.line(130, y, 180, y);
    doc.text("Principal/Director", 140, y + 5);

    doc.save(`${data.studentName}_Report_${data.term.replace(/\s/g, '_')}.pdf`);
};

export const generateAdmissionLetter = async (studentName: string, regNo: string, classLevel: string) => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "PROVISIONAL ADMISSION LETTER");
    
    doc.setFontSize(11);
    let y = yStart + 15;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, y);
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("OFFER OF PROVISIONAL ADMISSION", 105, y, { align: "center" });
    y += 15;
    doc.setFont("helvetica", "normal");
    const body = [
        `Dear ${studentName.toUpperCase()},`,
        "",
        `Congratulations! We are pleased to offer you provisional admission into ${SCHOOL_NAME} for the 2024/2025 academic session. You have been placed in ${classLevel}.`,
        "",
        `Temporary Registration Number: ${regNo || 'PENDING'}`,
        "",
        "Our institution is dedicated to academic excellence in Science and deep spiritual grounding through our Tahfiz program. We expect our students to maintain the highest standards of character and academic rigor.",
        "",
        "Please proceed to the bursary department or the online portal to settle your acceptance fees and complete your registration within two weeks of this notice.",
        "",
        "Welcome to the Imam Malik family.",
        "",
        "Yours faithfully,",
    ];
    body.forEach(line => {
        if (!line) y += 5;
        else {
            const split = doc.splitTextToSize(line, 180);
            doc.text(split, 15, y);
            y += (split.length * 7);
        }
    });
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("__________________________", 15, y);
    doc.text("Registrar / Admission Officer", 15, y + 7);
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
    const yStart = await addPdfHeader(doc, data.receiptType, `Transaction Ref: ${data.reference}`);
    doc.setDrawColor(200);
    doc.roundedRect(15, yStart + 5, 180, 100, 3, 3);
    let y = yStart + 20;
    const addLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(value || "N/A", 85, y);
        y += 12;
    };
    addLine("Payment Date:", data.date);
    addLine("Student Name:", data.studentName.toUpperCase());
    if (data.regNo) addLine("Registration No:", data.regNo);
    if (data.session) addLine("Academic Session:", data.session);
    if (data.term) addLine("Term:", data.term);
    y += 5;
    doc.setFillColor(30, 58, 138);
    doc.rect(25, y - 8, 160, 15, 'F');
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TOTAL PAID:", 35, y + 2);
    doc.text(`NGN ${data.amount}`, 175, y + 2, { align: "right" });
    doc.save(`Receipt_${data.reference}.pdf`);
};
