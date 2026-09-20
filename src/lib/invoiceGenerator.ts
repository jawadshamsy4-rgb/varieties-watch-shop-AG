import { jsPDF } from "jspdf";
import type { OrderConfirmationState } from "@/pages/OrderConfirmationPage";

export function generateInvoicePDF(state: OrderConfirmationState): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Top decorative gold accent bar
  doc.setFillColor(197, 160, 89); // Gold
  doc.rect(0, 0, pageWidth, 4, "F");

  // Header - Brand details (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 27, 45); // Dark navy
  doc.text("VARIETIES WATCH SHOP", margin, 18);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Authentic & Premium Timepieces", margin, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Dhaka: Shop 108, Twin Tower Concord, Shantinagar", margin, 28);
  doc.text("Chattogram: Shop 5, Gulzar Tower, Chawkbazar", margin, 32);
  doc.text("Email: varietieswatchshop@gmail.com", margin, 36);

  // Header - Invoice Meta (Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(197, 160, 89);
  doc.text("INVOICE", pageWidth - margin, 18, { align: "right" });

  const orderNumStr = state.orderNumbers.map((n) => `#${n}`).join(", ");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 27, 45);
  doc.text(`Order: ${orderNumStr}`, pageWidth - margin, 25, { align: "right" });

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${todayStr}`, pageWidth - margin, 30, { align: "right" });
  doc.text("Payment: Cash on Delivery (COD)", pageWidth - margin, 34, { align: "right" });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 40, pageWidth - margin, 40);

  // Customer / Shipping Details Card
  const cardY = 44;
  const cardHeight = 28;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(197, 160, 89);
  doc.text("BILL TO / SHIPPING DETAILS", margin + 4, cardY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 27, 45);
  doc.text(state.customerName || "Customer", margin + 4, cardY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${state.customerPhone}`, margin + 4, cardY + 17);

  const addressLines = doc.splitTextToSize(`Address: ${state.customerAddress}`, contentWidth - 8);
  doc.text(addressLines, margin + 4, cardY + 22);

  // Table Header
  let currentY = 78;
  const colIndex = margin + 4;
  const colDesc = margin + 14;
  const colQty = margin + 115;
  const colPrice = margin + 145;
  const colTotal = pageWidth - margin - 4;

  doc.setFillColor(20, 27, 45);
  doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("#", colIndex, currentY + 5.5);
  doc.text("ITEM DESCRIPTION", colDesc, currentY + 5.5);
  doc.text("QTY", colQty, currentY + 5.5, { align: "center" });
  doc.text("UNIT PRICE (BDT)", colPrice, currentY + 5.5, { align: "right" });
  doc.text("TOTAL (BDT)", colTotal, currentY + 5.5, { align: "right" });

  currentY += 10;

  // Table Rows
  state.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    // Check if we need a page break (rare for order confirmations, but good practice)
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(String(index + 1), colIndex, currentY + 4);

    // Title & variant
    const descLines = doc.splitTextToSize(item.productName, 95);
    doc.text(descLines, colDesc, currentY + 4);

    const descHeight = descLines.length * 4;
    if (item.variant) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Variant: ${item.variant}`, colDesc, currentY + 4 + descHeight);
    }

    // Qty
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(String(item.quantity), colQty, currentY + 4, { align: "center" });

    // Unit Price
    doc.text(item.price.toLocaleString(), colPrice, currentY + 4, { align: "right" });

    // Item Total
    doc.setFont("helvetica", "bold");
    doc.text(itemTotal.toLocaleString(), colTotal, currentY + 4, { align: "right" });

    const rowHeight = Math.max(descHeight + (item.variant ? 6 : 2), 9);
    currentY += rowHeight;

    // Row divider
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 3;
  });

  // Totals Section
  const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryCharge = state.deliveryCharge || 0;
  const grandTotal = subtotal + deliveryCharge;

  currentY += 4;
  const summaryX = pageWidth - margin - 85;
  const summaryWidth = 85;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal:", summaryX + 25, currentY + 4, { align: "right" });
  doc.setTextColor(30, 41, 59);
  doc.text(`BDT ${subtotal.toLocaleString()}`, colTotal, currentY + 4, { align: "right" });

  currentY += 6;

  // Delivery Charge
  doc.setTextColor(100, 116, 139);
  doc.text("Delivery Charge:", summaryX + 25, currentY + 4, { align: "right" });
  doc.setTextColor(30, 41, 59);
  doc.text(`BDT ${deliveryCharge.toLocaleString()}`, colTotal, currentY + 4, { align: "right" });

  currentY += 7;

  // Total Card
  doc.setFillColor(253, 250, 243); // Subtle gold tint
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX, currentY, summaryWidth, 10, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 27, 45);
  doc.text("Grand Total:", summaryX + 25, currentY + 6.5, { align: "right" });

  doc.setFontSize(10.5);
  doc.setTextColor(197, 160, 89);
  doc.text(`BDT ${grandTotal.toLocaleString()}`, colTotal - 2, currentY + 6.5, { align: "right" });

  currentY += 18;

  // Order Notes & Terms Box
  const notesY = Math.max(currentY, 195);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, notesY, contentWidth, 24, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, notesY, contentWidth, 24, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 27, 45);
  doc.text("TERMS & INSTRUCTIONS:", margin + 4, notesY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("• Payment is to be made in cash to the courier representative upon package delivery.", margin + 4, notesY + 10);
  doc.text("• Please check the watch in the presence of the delivery person before payment.", margin + 4, notesY + 14);
  doc.text("• Keep this invoice for future reference, warranty verification, and order tracking.", margin + 4, notesY + 18);

  // Footer text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(197, 160, 89);
  doc.text("Thank you for choosing Varieties Watch Shop!", pageWidth / 2, 280, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This is an electronically generated invoice. For any inquiries, call 01819-866410.", pageWidth / 2, 284, { align: "center" });

  // Save the PDF
  const filename = `Invoice_${state.orderNumbers[0] || "order"}.pdf`;
  doc.save(filename);
}
