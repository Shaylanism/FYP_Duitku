// PDF Generation Utilities for DuitKu Financial Reports
// Following MVC architecture pattern and maintaining consistency

// PDF Layout Constants
export const PDF_CONSTANTS = {
  PAGE_HEIGHT: 297, // A4 height in mm
  PAGE_WIDTH: 210, // A4 width in mm
  FOOTER_HEIGHT: 50, // Increased space reserved for footer (was 35)
  HEADER_HEIGHT: 80, // Space reserved for header
  MARGIN: {
    LEFT: 20,
    RIGHT: 20,
    TOP: 20,
    BOTTOM: 50 // Increased bottom margin to prevent footer overlap (was 35)
  }
};

// Calculated values
export const LAYOUT = {
  FOOTER_START_Y: PDF_CONSTANTS.PAGE_HEIGHT - PDF_CONSTANTS.FOOTER_HEIGHT,
  CONTENT_MAX_Y: PDF_CONSTANTS.PAGE_HEIGHT - PDF_CONSTANTS.FOOTER_HEIGHT - 15, // Increased buffer to 15mm
  CONTENT_WIDTH: PDF_CONSTANTS.PAGE_WIDTH - PDF_CONSTANTS.MARGIN.LEFT - PDF_CONSTANTS.MARGIN.RIGHT
};

// Standard table styling configurations
export const TABLE_STYLES = {
  DEFAULT: {
    theme: 'plain',
    margin: { 
      left: PDF_CONSTANTS.MARGIN.LEFT, 
      right: PDF_CONSTANTS.MARGIN.RIGHT, 
      bottom: PDF_CONSTANTS.FOOTER_HEIGHT 
    },
    pageBreak: 'auto',
    showFoot: 'everyPage',
    styles: {
      overflow: 'linebreak',
      cellPadding: 3,
      fontSize: 8,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252] // Very subtle alternate row color
    }
  },
  
  HEADER: {
    fillColor: [248, 248, 248], // Very light gray
    textColor: [0, 0, 0], // Black text
    fontSize: 9,
    fontStyle: 'bold',
    cellPadding: 4,
    lineColor: [218, 165, 32], // Gold border
    lineWidth: 0.5
  },
  
  BODY: {
    fontSize: 8,
    cellPadding: 3,
    lineColor: [230, 230, 230], // Light gray borders
    lineWidth: 0.2
  }
};

// Color scheme for the reports
export const COLORS = {
  GOLD: [218, 165, 32],
  WHITE: [255, 255, 255],
  BLACK: [0, 0, 0],
  GRAY: [100, 100, 100],
  LIGHT_GRAY: [230, 230, 230],
  GREEN: [34, 139, 34],
  RED: [220, 20, 60],
  BLUE: [0, 100, 200]
};

// Standard font configurations
export const FONTS = {
  TITLE: { size: 22, style: 'bold' },
  SUBTITLE: { size: 12, style: 'normal' },
  SECTION_HEADER: { size: 14, style: 'bold' },
  BODY: { size: 11, style: 'normal' },
  SMALL: { size: 9, style: 'normal' },
  FOOTER: { size: 8, style: 'normal' }
};

/**
 * Utility function to create consistent table configurations
 * @param {Object} options - Table configuration options
 * @returns {Object} Complete table configuration
 */
export const createTableConfig = (options = {}) => {
  const config = {
    ...TABLE_STYLES.DEFAULT,
    headStyles: { ...TABLE_STYLES.HEADER, ...(options.headStyles || {}) },
    bodyStyles: { ...TABLE_STYLES.BODY, ...(options.bodyStyles || {}) },
    columnStyles: options.columnStyles || {},
    startY: options.startY || 40,
    head: options.head || [],
    body: options.body || [],
    didParseCell: options.didParseCell
  };

  // Special handling for transaction history tables (larger datasets)
  if (options.isTransactionHistory) {
    config.margin.bottom = PDF_CONSTANTS.FOOTER_HEIGHT + 15; // Extra protection for history tables
    config.styles.minCellHeight = 6; // Ensure minimum cell height for readability
    config.pageBreakBefore = function(cursor, doc) {
      // Force page break if less than 30mm space remaining (more aggressive)
      return cursor.y > LAYOUT.CONTENT_MAX_Y - 30;
    };
  }

  return config;
};

/**
 * Utility function to ensure proper page breaks for large tables
 * @param {Object} doc - jsPDF document object
 * @param {number} currentY - Current Y position
 * @param {number} requiredSpace - Required space for next content
 * @returns {boolean} Whether a new page was added
 */
export const ensurePageSpace = (doc, currentY, requiredSpace = 30) => {
  if (currentY + requiredSpace > LAYOUT.CONTENT_MAX_Y) {
    doc.addPage();
    return true;
  }
  return false;
};

/**
 * Add professional footer to a PDF page
 * @param {Object} doc - jsPDF document object
 * @param {number} pageNumber - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {boolean} isLastPage - Whether this is the last page
 */
export const addFooter = (doc, pageNumber, totalPages, isLastPage = false) => {
  const footerY = LAYOUT.FOOTER_START_Y;
  
  // Footer divider line
  doc.setDrawColor(...COLORS.GOLD);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, 190, footerY - 5);
  
  // Footer text
  doc.setFontSize(FONTS.FOOTER.size);
  doc.setFont('helvetica', FONTS.FOOTER.style);
  doc.setTextColor(...COLORS.GRAY);
  
  // Left side - Confidentiality notice
  doc.text('CONFIDENTIAL: This statement is for the account holder only.', 20, footerY);
  doc.text('Please review and report any discrepancies immediately.', 20, footerY + 5);
  
  // Right side - Contact info
  doc.text('DuitKu Financial Management App', 190, footerY, { align: 'right' });
  
  // Center - Page info with page numbers
  doc.setFont('helvetica', 'italic');
  if (isLastPage) {
    doc.text('*** END OF STATEMENT ***', 105, footerY + 12, { align: 'center' });
  }
  
  // Page number
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNumber} of ${totalPages}`, 105, footerY + 17, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(...COLORS.BLACK);
};